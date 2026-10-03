import { authStorage } from "./auth";
import type { ConversationItem } from "../types/chat";
import type { ConversationDetail } from "../types/messenger";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/messenger/api";

// ─── Generic fetch wrapper ───────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // خواندن توکن از استورج در صورت وجود، یا فال‌بک به توکن تست
  const storageToken = authStorage.getToken();
  const token =
    storageToken ||
    "GAPGPTMASKTOKENuq7y3hbaa08X1X" ||
    "GAPGPTMASKTOKENp08bvq1jf4X0X";

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
  id?: string;
  conversationId?: string;
  uuid?: string;
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

// ─── Mapper ──────────────────────────────────────────────────────────────────

export function mapConversation(raw: ConversationRaw): ConversationItem {
  return {
    id: raw.conversationId ?? raw.id ?? raw.uuid ?? "",
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

// ─── Messages API ─────────────────────────────────────────────────────────────

// ─── Messages API ─────────────────────────────────────────────────────────────

export const messagesApi = {
  /**
   * دریافت مستقیم پیام‌های یک مکالمه به صورت REST API خالص
   */
  async getConversationDetail(
    conversationId: string,
    pageNo = 0,
    pageSize = 50,
  ): Promise<ConversationDetail> {
    const query = new URLSearchParams({
      PageNo: pageNo.toString(),
      PageSize: pageSize.toString(),
    });

    // درخواست مستقیم GET به بک‌اند
    return apiFetch<ConversationDetail>(
      `/messages/${conversationId}?${query.toString()}`,
    );
  },

  async getNextPage(
    conversationId: string,
    pageNo: number,
    pageSize = 50,
  ): Promise<ConversationDetail> {
    return this.getConversationDetail(conversationId, pageNo, pageSize);
  },
};
