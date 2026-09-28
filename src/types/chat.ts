export type ConversationType =
  | "ALL"
  | "PERSONAL"
  | "GROUP"
  | "CHANNEL"
  | "SUPPORT";

export interface MessageItem {
  id: string | number;
  conversationId: string | number;
  senderId: string | number;
  senderName?: string;
  text: string;
  createdAt: string;
  isOutgoing: boolean;
  status?: "sending" | "sent" | "delivered" | "read";
  replyRefMessageId?: string | number | null;
  replyToMessage?: {
    id: string | number;
    text: string;
    senderName?: string;
    isOutgoing?: boolean;
  } | null;
}

export interface ConversationItem {
  id: string | number;
  title: string;
  type: "PERSONAL" | "GROUP" | "CHANNEL" | "SUPPORT";
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isPinned?: boolean;
  isOnline?: boolean;
  isVerified?: boolean;
}
