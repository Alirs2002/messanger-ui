import { authStorage } from "./auth";
import type { ConversationItem } from "../types/chat";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/messenger/api";

// ─── Generic fetch wrapper ───────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = authStorage.getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

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
  id: string;
  title: string;
  targetType: "PERSONAL" | "GROUP" | "CHANNEL" | "SUPPORT" | "ALL";
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
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

// Inner page object nested under `conversations`
export interface ConversationPage {
  content: ConversationRaw[];
  number: number;
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  size: number;
}

// Actual root response shape from the backend
export interface ConversationsResponse {
  conversations: ConversationPage;
  specificMessage1: string | null;
  specificMessage2: string | null;
  unreadCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  allUnreadCounts: Record<string, number>;
}

// ─── Mapper ──────────────────────────────────────────────────────────────────

export function mapConversation(raw: ConversationRaw): ConversationItem {
  return {
    id: raw.id,
    title: raw.title,
    type:
      (raw.targetType === "ALL" ? "PERSONAL" : raw.targetType) ?? "PERSONAL",
    avatar: raw.avatar,
    lastMessage: raw.lastMessage,
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
// ─── RSC Parser ──────────────────────────────────────────────────────────────

function parseRSC<T>(text: string): T {
  const lines = text.trim().split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("1:")) {
      try {
        return JSON.parse(trimmed.slice(2)) as T;
      } catch {
        throw new Error(
          `[parseRSC] JSON parse failed: ${trimmed.slice(0, 100)}`,
        );
      }
    }
  }
  throw new Error('[parseRSC] No data line found (expected "1:...")');
}

// ─── Message types ────────────────────────────────────────────────────────────

export interface MessageRaw {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  type: "TEXT" | "IMAGE" | "FILE" | "VOICE" | "VIDEO" | "STICKER";
  createdAt: string;
  editedAt?: string;
  replyTo?: string;
  isRead?: boolean;
  isDelivered?: boolean;
  isMine?: boolean;
}

export interface MessagePage {
  content: MessageRaw[];
  number: number;
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  size: number;
}

export interface ConversationDetail {
  conversation: {
    id: string;
    title: string;
    avatar?: string;
    targetType: string;
  };
  messages: MessagePage;
  opponentStatus: "ONLINE" | "OFFLINE";
  hasPrevious: boolean;
  hasNext: boolean;
}

// ─── Messages API ─────────────────────────────────────────────────────────────

export const messagesApi = {
  async getConversationDetail(
    conversationId: string,
    pageNo = 0,
    pageSize = 100,
  ): Promise<ConversationDetail> {
    const path = `/conversations/${conversationId}`;
    const token = authStorage.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify([
        "Get",
        { PageNo: pageNo, PageSize: pageSize, type: "" },
        {},
        path,
        true,
      ]),
    });

    if (!res.ok) {
      throw new Error(`[messagesApi] ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    return parseRSC<ConversationDetail>(text);
  },

  async getNextPage(
    conversationId: string,
    pageNo: number,
    pageSize = 50,
  ): Promise<ConversationDetail> {
    return this.getConversationDetail(conversationId, pageNo, pageSize);
  },
};
