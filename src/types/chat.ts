export type ConversationType =
  | "ALL"
  | "PERSONAL"
  | "GROUP"
  | "CHANNEL"
  | "SUPPORT";

export interface ForwardFromInfo {
  id?: string | number;
  name: string;
  chatTitle?: string;
  chatType?: "pv" | "group" | "channel";
}

export interface ReplyToMessageInfo {
  id: string | number;
  text: string;
  senderName?: string;
  isOutgoing?: boolean;
}

export interface MessageItem {
  id: string | number;
  conversationId?: string | number;
  senderId?: string | number;
  senderName?: string;
  text: string;
  createdAt: string;
  timestamp?: string;
  isOutgoing: boolean;
  isMe?: boolean;
  isEdited?: boolean;
  views?: number | string;
  status?: "sending" | "sent" | "delivered" | "read";
  replyToId?: string | number | null;
  replyRefMessageId?: string | number | null;
  forwardFrom?: ForwardFromInfo | null;
  replyToMessage?: ReplyToMessageInfo | null;
}

export interface ConversationItem {
  id: string | number;
  title: string;
  type: "PERSONAL" | "GROUP" | "CHANNEL" | "SUPPORT";
  avatar?: string;
  lastMessageText?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isUnread?: boolean;
  isPinned?: boolean;
  lastMessageNickname?: string;
  lastMessageSenderName?: string;
  isOnline?: boolean;
  isVerified?: boolean;
  lastMessageState?: "SEEN" | "DELIVERED" | "SENT" | null;
  lastMessageSenderId?: string | number;
  isMuted?: boolean;
  isBlocked?: boolean;
  membersCount?: number;
  role?: "ADMIN" | "OWNER" | "MEMBER";
  isAdmin?: boolean;
  canPost?: boolean;
}
