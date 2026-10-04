// ─── Shared date type ────────────────────────────────────────────────────────

export interface PersianDate {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface Conversation {
  conversationId: string;
  title: string;
  targetId: string;
  targetType: "PERSONAL" | "GROUP" | "SUPPORT";
  avatarThumbnail: { id: string; url: string };
  isMuted: boolean;
  unreadCount: number;
  lastMessageId: string | null;
  lastMessageText: string | null;
  lastMessageNickname: string | null;
  lastMessageAuthorUserId: string | null;
  lastMessageTimestamp: PersianDate | null;
  lastMessageType: string;
  lastMessageState: "SEEN" | "DELIVERED" | "SENT" | null;
  canSendMessage: boolean;
  role: string;
  active: boolean;
  hidden: boolean;
  isDeleted: boolean;
  isSuperGroup: boolean;
  opponentLastSeen: PersianDate | null;
  seenTime: PersianDate | null;
  createdAt: PersianDate;
}

export interface ConversationsPage {
  content: Conversation[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface ConversationsResponse {
  conversations: ConversationsPage;
  unreadCount: number;
  allUnreadCounts: number;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export type MessageType =
  | "TEXT"
  | "IMAGE"
  | "FILE"
  | "VOICE"
  | "VIDEO"
  | "STICKER";
export type MessageState = "SEEN" | "DELIVERED" | "SENT" | "PENDING" | "FAILED";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderNickname: string;
  text: string | null;
  type: MessageType;
  state: MessageState;
  timestamp: PersianDate;
  replyToMessageId: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  fileUrl?: string;
  thumbnailUrl?: string;
  authorUserId?: string; // <--- اضافه شد
  authorNickname?: string;
}

export interface MessagesPage {
  content: Message[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: MessagesPage;
  memberCount: number;
  opponentStatus: "ONLINE" | "OFFLINE";
  hasPrevious: boolean;
  hasNext: boolean;
  opponentLastSeen: PersianDate | null;
  blocked: boolean;
  member: boolean;
}
