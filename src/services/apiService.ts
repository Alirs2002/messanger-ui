// فایل: src/services/apiService.ts
import { authStorage } from "./auth";
import type { ConversationItem, MessageItem } from "../types/chat";
import type {
  ConversationDetail,
  Message as BackendMessage,
  PersianDate,
} from "../types/messenger";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/messenger/api";

// ─── Generic fetch wrapper ───────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const secretToken = authStorage.getToken();
  // توکن معتبر کپی شده از تب نتورک سیستم اصلی
  const token = secretToken || "eyJhbGciOi...";

  console.log("Using Token:", token);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  // ...

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[API Error] ${res.status} ${res.statusText}:`, errorText);
    throw new Error(`[API] ${res.status} ${res.statusText} — ${path}`);
  }

  const rawText = await res.text();
  try {
    return JSON.parse(rawText) as T;
  } catch (err) {
    console.error(
      `[API Parse Error] Response is not valid JSON. First 200 chars:`,
      rawText.slice(0, 200),
    );
    throw err;
  }
}

// ─── Raw API types (mirrors backend shape) ───────────────────────────────────

export interface ConversationRaw {
  id?: string;
  conversationId?: string;
  uuid?: string;
  title: string;
  targetType: "PERSONAL" | "GROUP" | "CHANNEL" | "SUPPORT" | "ALL";
  avatar?: string;
  lastMessageText?: string;
  lastMessageTime?: string;
  lastMessageSenderName?: string;
  lastMessageNickname?: string;

  unreadCount?: number;
  isPinned?: boolean;
  isOnline?: boolean;
  isVerified?: boolean;
  isMuted?: boolean;
  isBlocked?: boolean;
  isAdmin?: boolean;
  canPost?: boolean;
  membersCount?: number;
  role?: "ADMIN" | "OWNER" | "MEMBER";
}

export interface ConversationPage {
  content: ConversationRaw[];
  number: number;
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  size: number;
}

export interface ConversationsResponse {
  conversations: ConversationPage;
  specificMessage1: string | null;
  specificMessage2: string | null;
  unreadCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  allUnreadCounts: Record<string, number>;
}

// ─── Conversation Mapper ─────────────────────────────────────────────────────

export function mapConversation(raw: ConversationRaw): ConversationItem {
  return {
    id: raw.conversationId ?? raw.id ?? raw.uuid ?? "",
    title: raw.title,
    type:
      (raw.targetType === "ALL" ? "PERSONAL" : raw.targetType) ?? "PERSONAL",
    avatar: raw.avatar,
    lastMessageText: raw.lastMessageText,
    lastMessageSenderName: raw.lastMessageSenderName,
    lastMessageNickname: raw.lastMessageNickname,
    lastMessageState:
      (raw as any).lastMessageState ?? (raw as any).lastMessage?.state,
    lastMessageSenderId:
      (raw as any).lastMessage?.senderId ?? (raw as any).lastMessageSenderId,

    lastMessageTime: raw.lastMessageTime,
    unreadCount: raw.unreadCount ?? 0,
    isPinned: raw.isPinned ?? false,
    isOnline: raw.isOnline ?? false,
    isVerified: raw.isVerified ?? false,

    isMuted: raw.isMuted ?? false,
    isBlocked: raw.isBlocked ?? false,
    isAdmin: raw.isAdmin,
    canPost: raw.canPost,
    membersCount: raw.membersCount,
    role: raw.role,
  };
}

// ─── Message Mappers ─────────────────────────────────────────────────────────

export function formatMessageTime(
  dateInput?: PersianDate | string | number | Date | null,
): string {
  if (!dateInput) return "";

  if (
    typeof dateInput === "object" &&
    "hour" in dateInput &&
    "minute" in dateInput
  ) {
    const pad = (v: string | number) => String(v).padStart(2, "0");
    const enTime = `${pad(dateInput.hour)}:${pad(dateInput.minute)}`;
    return enTime.replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
  }

  const date = new Date(dateInput as string | number | Date);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function mapMessageStatus(
  state?: string,
): "sending" | "sent" | "delivered" | "read" | undefined {
  switch (state?.toUpperCase()) {
    case "SEEN":
      return "read";
    case "DELIVERED":
      return "delivered";
    case "SENT":
      return "sent";
    case "PENDING":
      return "sending";
    default:
      return undefined;
  }
}

// پیام‌های حذف‌شده را null برمی‌گرداند تا فراخواننده فیلترشان کند
export function isMessageDeleted(raw: BackendMessage | any): boolean {
  const tag = (raw?.deleteTag ?? raw?.deletedTag ?? "")
    .toString()
    .toUpperCase();
    
  return Boolean(
    raw?.isDeleted === true ||
    raw?.deleted === true ||
    raw?.deletedAll === true ||     // اضافه شد
    raw?.deletedForMe === true ||   // اضافه شد
    raw?.deleteAll === true ||      // اضافه شد (جهت احتیاط)
    raw?.deleteForMe === true ||    // اضافه شد (جهت احتیاط)
    tag === "FOR_ALL" ||
    tag === "FOR_ME"
  );
}


export function mapMessageToItem(
  raw: BackendMessage | any,
  currentUserId?: string | number | null,
): MessageItem | null {
  if (isMessageDeleted(raw)) return null;
  const senderId = raw.senderId ?? raw.creatorId ?? raw.sender?.id ?? raw.from;
  const isOutgoing =
    currentUserId != null
      ? String(senderId) === String(currentUserId)
      : Boolean(raw.isOutgoing);

  // Construct the nested replyToMessage object if a reply ID is present
  const replyToMessage = raw.replyRefMessageId
    ? {
        id: String(raw.replyRefMessageId),
        text: raw.replyRefMessageText || "",
        senderName: raw.replyRefUserNickname || "",
        // You can conditionally determine isOutgoing if the reply's sender ID matches the current user
        isOutgoing:
          currentUserId != null && raw.replyRefSenderId != null
            ? String(raw.replyRefSenderId) === String(currentUserId)
            : false,
      }
    : undefined;

  return {
    id: String(raw.id ?? raw.messageId ?? raw.uuid),
    isDeleted: false,
    senderId: senderId ? String(senderId) : undefined,
    senderName: raw.senderNickname ?? raw.senderName ?? "",
    text: raw.text ?? raw.content ?? raw.body ?? "",
    createdAt: formatMessageTime(raw.timestamp ?? raw.createdAt),
    isOutgoing,
    isMe: isOutgoing,
    isEdited: Boolean(raw.isEdited),
    status: mapMessageStatus(raw.state ?? raw.status),
    replyToId: raw.replyToMessageId ? String(raw.replyToMessageId) : undefined,
    replyToMessage, // Add the constructed object here
  };
}

// ─── API calls ───────────────────────────────────────────────────────────────

export const conversationsApi = {
  list: (pageNo = 0, pageSize = 100, type = "") => {
    const query = new URLSearchParams({
      PageNo: pageNo.toString(),
      PageSize: pageSize.toString(),
    });
    if (type && type !== "ALL") {
      query.append("type", type);
    }
    return apiFetch<ConversationsResponse>(
      `/conversations?${query.toString()}`,
    );
  },
};

export const deleteMessages = async (
  messageIds: string[],
  tagDelete: "FOR_ALL" | "FOR_ME",
  targetType: "PERSONAL" | "GROUP" | "CHANNEL" = "PERSONAL",
) => {
  return await apiFetch<void>("/messages/delete", {
    method: "PATCH",
    body: JSON.stringify({
      messageIds,
      tagDelete,
      targetType,
    }),
  });
};

export interface SendMessagePayload {
  tempId?: string;
  text: string;
  encodedText?: string;
  attachment?: { id: string; url: string };
  attachmentThumbnail?: { id: string; url: string };
  albums?: any[];
  albumsThumbnail?: any[];
  albumsTypes?: any[];
  extra?: string;
  forwarderId?: string;
  forwarderNickname?: string;
  replyRefMessageId?: string;
  replyRefMessageText?: string;
  replyRefUserId?: string;
  replyRefUserNickname?: string;
  replyRefMessageType?: string;
  replyRefUserAvatarThumbnail?: { id: string; url: string };
  messageState?: string;
  opponentIds?: string[];
  messageType?: string;
}

export const editMessage = async (
  messageId: string,
  targetType: string,
  text: string,
): Promise<void> => {
  await apiFetch(`/messages/edit/${messageId}`, {
    method: "PUT",
    body: JSON.stringify({
      targetType,
      text,
    }),
  });
};

export const messagesApi = {
  async getConversationDetail(
    conversationId: string,
    pageNo = 0,
    pageSize = 50,
  ): Promise<ConversationDetail> {
    const query = new URLSearchParams({
      PageNo: pageNo.toString(),
      PageSize: pageSize.toString(),
    });

    return apiFetch<ConversationDetail>(
      `/messages/${conversationId}?${query.toString()}`,
    );
  },

  sendMessage: async (
    conversationId: string,
    messagePayload: any,
  ): Promise<any> => {
    return apiFetch(`/messages/send/${conversationId}`, {
      method: "POST",
      body: JSON.stringify(messagePayload),
    });
  },

  async getNextPage(
    conversationId: string,
    pageNo: number,
    pageSize = 50,
  ): Promise<ConversationDetail> {
    return this.getConversationDetail(conversationId, pageNo, pageSize);
  },
};
