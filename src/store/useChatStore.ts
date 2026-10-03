import { create } from "zustand";
import type {
  ConversationItem,
  ConversationType,
  MessageItem,
} from "../types/chat";

interface ChatStore {
  activeTab: ConversationType;
  setActiveTab: (tab: ConversationType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeConversationId: string | number | null;
  setActiveConversation: (id: string | number | null) => void;
  conversations: ConversationItem[];
  messages: Record<string | number, MessageItem[]>;
  setConversations: (conversations: ConversationItem[]) => void;

  // اکشن جدید برای تزریق پیام‌های دریافتی از سرور به استور
  setMessagesForConversation: (
    conversationId: string | number,
    newMessages: MessageItem[],
  ) => void;

  // استیت و اکشن ریپلای
  replyingTo: MessageItem | null;
  setReplyingTo: (message: MessageItem | null) => void;

  // اکشن‌های ارسال، ویرایش، حذف و فوروارد پیام
  sendMessage: (conversationId: string | number, text: string) => void;
  editMessage: (
    conversationId: string | number,
    messageId: string | number,
    newText: string,
  ) => void;
  deleteMessage: (
    conversationId: string | number,
    messageId: string | number,
  ) => void;
  forwardMessage: (
    targetConversationId: string | number,
    message: MessageItem,
    fromChatTitle: string,
  ) => void;

  // اکشن‌های مدیریت گفتگوها و سایدبار
  deleteConversation: (conversationId: string | number) => void;
  receiveLiveMessage: (payload: any, currentUserId: number | string) => void;
  leaveConversation: (conversationId: string | number) => void;
  clearChat: (conversationId: string | number) => void;
  togglePinConversation: (conversationId: string | number) => void;
  toggleMuteConversation: (conversationId: string | number) => void;
  toggleUnreadConversation: (conversationId: string | number) => void;
  markAsRead: (conversationId: string | number) => void;
}

const INITIAL_CONVERSATIONS: ConversationItem[] = [
  {
    id: 1,
    title: "پشتیبانی مرکزی رسالت",
    type: "SUPPORT",
    lastMessage: "سلام، برای پیگیری وضعیت درخواست وام سوال داشتم.",
    lastMessageTime: "۱۲:۳۲",
    unreadCount: 0,
    isPinned: true,
    isMuted: false,
    isVerified: true,
    isOnline: true,
  },
  {
    id: 2,
    title: "کانال اطلاع‌رسانی",
    type: "CHANNEL",
    lastMessage:
      "🔒 توجه: به منظور ارتقای امنیت، لطفاً نسبت به فعال‌سازی تایید دو مرحله‌ای اقدام فرمایید.",
    lastMessageTime: "۱۶:۱۰",
    unreadCount: 40,
    isPinned: true,
    isMuted: true,
    isVerified: true,
  },
  {
    id: 3,
    title: "گروه توسعه نرم‌افزار",
    type: "GROUP",
    lastMessage:
      "علی: عالیه، اگر کامپوننت جدیدی نیاز بود بگید تا سریع اضافه کنم.",
    lastMessageTime: "۰۹:۱۵",
    unreadCount: 3,
    isPinned: false,
    isMuted: false,
  },
  {
    id: 4,
    title: "محمد رضایی",
    type: "PERSONAL",
    lastMessage: "ممنون، منتظرم.",
    lastMessageTime: "۱۰:۱۷",
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isOnline: true,
  },
];

export const useChatStore = create<ChatStore>((set) => ({
  activeTab: "ALL",
  setActiveTab: (tab) => set({ activeTab: tab }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  activeConversationId: null,

  setActiveConversation: (id) =>
    set({
      activeConversationId: id,
      replyingTo: null,
    }),

  markAsRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        String(c.id) === String(conversationId) ? { ...c, unreadCount: 0 } : c,
      ),
    })),
  setConversations: (conversations) => set({ conversations }),

  conversations: INITIAL_CONVERSATIONS,

  // با شروع خالی کردنِ state، دیگر دیتای تست روی دیتای سرور رونویسی نمی‌شود
  messages: {},

  setMessagesForConversation: (conversationId, newMessages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: newMessages,
      },
    })),

  replyingTo: null,
  setReplyingTo: (message) => set({ replyingTo: message }),

  sendMessage: (conversationId, text) =>
    set((state) => {
      const timeNow = new Date().toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const newMsg: MessageItem = {
        id: Date.now(),
        conversationId,
        senderId: 1,
        text,
        createdAt: timeNow,
        isOutgoing: true,
        status: "sent",
        replyRefMessageId: state.replyingTo ? state.replyingTo.id : undefined,
        replyToMessage: state.replyingTo
          ? {
              id: state.replyingTo.id,
              text: state.replyingTo.text,
              senderName: state.replyingTo.senderName,
              isOutgoing: state.replyingTo.isOutgoing,
            }
          : undefined,
      };

      const currentMsgs =
        state.messages[conversationId] ||
        state.messages[String(conversationId)] ||
        [];

      const updatedConversations = state.conversations.map((c) =>
        String(c.id) === String(conversationId)
          ? { ...c, lastMessage: text, lastMessageTime: timeNow }
          : c,
      );

      return {
        messages: {
          ...state.messages,
          [conversationId]: [...currentMsgs, newMsg],
        },
        conversations: updatedConversations,
        replyingTo: null,
      };
    }),

  receiveLiveMessage: (payload: any, currentUserId: number | string) => {
    const conversationId = payload.conversationId || payload.chatId;
    if (!conversationId) return;

    const isMe =
      Number(payload.senderId || payload.userId) === Number(currentUserId);

    const newMsg: MessageItem = {
      id: payload.id || Date.now(),
      isOutgoing: isMe,
      text: payload.content || payload.message || payload.text || "",
      isMe,
      createdAt: payload.createdAt
        ? new Date(payload.createdAt).toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : new Date().toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
      status: "delivered",
      replyToMessage: payload.replyRef
        ? {
            id: payload.replyRef.id,
            text: payload.replyRef.content || payload.replyRef.text || "",
            senderName: payload.replyRef.senderName || "",
          }
        : undefined,
    };

    set((state) => {
      const currentList = state.messages[conversationId] || [];
      // جلوگیری از ثبت پیام تکراری
      if (currentList.some((m) => m.id === newMsg.id)) {
        return state;
      }

      const updatedMessages = [...currentList, newMsg];
      const isCurrentActive = state.activeConversationId === conversationId;

      const updatedConversations = state.conversations.map((c) => {
        if (String(c.id) === String(conversationId)) {
          return {
            ...c,
            lastMessage: newMsg.text,
            lastMessageTime: newMsg.createdAt,
            unreadCount:
              isCurrentActive || isMe
                ? c.unreadCount
                : (c.unreadCount || 0) + 1,
          };
        }
        return c;
      });

      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedMessages,
        },
        conversations: updatedConversations,
      };
    });
  },

  deleteConversation: (conversationId) =>
    set((state) => {
      const idStr = String(conversationId);
      const newMessages = { ...state.messages };
      delete newMessages[idStr];
      delete newMessages[conversationId];

      return {
        conversations: state.conversations.filter(
          (c) => String(c.id) !== idStr,
        ),
        messages: newMessages,
        activeConversationId:
          String(state.activeConversationId) === idStr
            ? null
            : state.activeConversationId,
      };
    }),

  leaveConversation: (conversationId) =>
    set((state) => {
      const idStr = String(conversationId);
      const newMessages = { ...state.messages };
      delete newMessages[idStr];
      delete newMessages[conversationId];

      return {
        conversations: state.conversations.filter(
          (c) => String(c.id) !== idStr,
        ),
        messages: newMessages,
        activeConversationId:
          String(state.activeConversationId) === idStr
            ? null
            : state.activeConversationId,
      };
    }),

  clearChat: (conversationId) =>
    set((state) => {
      const idStr = String(conversationId);
      return {
        messages: {
          ...state.messages,
          [idStr]: [],
          [conversationId]: [],
        },
        conversations: state.conversations.map((c) =>
          String(c.id) === idStr
            ? { ...c, lastMessage: "", lastMessageTime: "" }
            : c,
        ),
      };
    }),

  editMessage: (conversationId, messageId, newText) =>
    set((state) => {
      const currentMsgs =
        state.messages[conversationId] ||
        state.messages[String(conversationId)] ||
        [];
      const updatedMsgs = currentMsgs.map((msg) =>
        String(msg.id) === String(messageId)
          ? { ...msg, text: newText, isEdited: true }
          : msg,
      );

      const lastMsg = updatedMsgs[updatedMsgs.length - 1];
      const updatedConversations = state.conversations.map((c) => {
        if (
          String(c.id) === String(conversationId) &&
          String(lastMsg?.id) === String(messageId)
        ) {
          return {
            ...c,
            lastMessage: newText,
          };
        }
        return c;
      });

      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedMsgs,
        },
        conversations: updatedConversations,
      };
    }),

  deleteMessage: (conversationId, messageId) =>
    set((state) => {
      const currentMsgs =
        state.messages[conversationId] ||
        state.messages[String(conversationId)] ||
        [];
      const updatedMsgs = currentMsgs.filter(
        (msg) => String(msg.id) !== String(messageId),
      );

      const lastMsg = updatedMsgs[updatedMsgs.length - 1];
      const updatedConversations = state.conversations.map((c) => {
        if (String(c.id) === String(conversationId)) {
          return {
            ...c,
            lastMessage: lastMsg ? lastMsg.text : "",
            lastMessageTime: lastMsg ? lastMsg.createdAt : "",
          };
        }
        return c;
      });

      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedMsgs,
        },
        conversations: updatedConversations,
        replyingTo:
          state.replyingTo && String(state.replyingTo.id) === String(messageId)
            ? null
            : state.replyingTo,
      };
    }),

  forwardMessage: (targetConversationId, message, fromChatTitle) =>
    set((state) => {
      const timeNow = new Date().toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const newMsg: MessageItem = {
        id: Date.now(),
        conversationId: targetConversationId,
        senderId: 1,
        text: message.text,
        createdAt: timeNow,
        isOutgoing: true,
        status: "sent",
        forwardFrom: {
          id: message.id,
          name: message.senderName || "ناشناس",
          chatTitle: fromChatTitle,
        },
      };

      const currentMsgs =
        state.messages[targetConversationId] ||
        state.messages[String(targetConversationId)] ||
        [];
      const updatedConversations = state.conversations.map((c) =>
        String(c.id) === String(targetConversationId)
          ? { ...c, lastMessage: message.text, lastMessageTime: timeNow }
          : c,
      );

      return {
        messages: {
          ...state.messages,
          [targetConversationId]: [...currentMsgs, newMsg],
        },
        conversations: updatedConversations,
      };
    }),

  togglePinConversation: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        String(c.id) === String(conversationId)
          ? { ...c, isPinned: !c.isPinned }
          : c,
      ),
    })),

  toggleMuteConversation: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        String(c.id) === String(conversationId)
          ? { ...c, isMuted: !c.isMuted }
          : c,
      ),
    })),

  toggleUnreadConversation: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        String(c.id) === String(conversationId)
          ? { ...c, unreadCount: (c.unreadCount ?? 0) > 0 ? 0 : 1 }
          : c,
      ),
    })),
}));
