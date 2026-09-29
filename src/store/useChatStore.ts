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
}

const INITIAL_CONVERSATIONS: ConversationItem[] = [
  {
    id: 1,
    title: "پشتیبانی مرکزی رسالت",
    type: "SUPPORT",
    lastMessage: "درخواست شما با موفقیت ثبت شد.",
    lastMessageTime: "۱۲:۳۴",
    unreadCount: 2,
    isPinned: true,
    isVerified: true,
    isOnline: true,
  },
  {
    id: 2,
    title: "گروه توسعه نرم‌افزار",
    type: "GROUP",
    lastMessage: "علی: کامپوننت جدید سایدبار مرج شد.",
    lastMessageTime: "۱۰:۱۵",
    unreadCount: 5,
    isPinned: true,
  },
  {
    id: 3,
    title: "کانال اطلاع‌رسانی",
    type: "CHANNEL",
    lastMessage: "نسخه جدید پیام‌رسان منتشر شد.",
    lastMessageTime: "دیروز",
    unreadCount: 0,
    isVerified: true,
  },
  {
    id: 4,
    title: "محمد رضایی",
    type: "PERSONAL",
    lastMessage: "سلام، فایل‌ها رو بررسی کردی؟",
    lastMessageTime: "شنبه",
    unreadCount: 0,
    isOnline: true,
  },
];

const INITIAL_MESSAGES: Record<string | number, MessageItem[]> = {
  1: [
    {
      id: 101,
      conversationId: 1,
      senderId: 999,
      senderName: "پشتیبانی",
      text: "سلام و وقت بخیر، به سامانه پشتیبانی خوش آمدید.",
      createdAt: "۱۲:۳۰",
      isOutgoing: false,
    },
    {
      id: 102,
      conversationId: 1,
      senderId: 1,
      text: "سلام، برای پیگیری وضعیت درخواست وام سوال داشتم.",
      createdAt: "۱۲:۳۲",
      isOutgoing: true,
      status: "read",
    },
  ],
  2: [
    {
      id: 201,
      conversationId: 2,
      senderId: 2,
      senderName: "علی",
      text: "کامپوننت جدید سایدبار مرج شد و آماده تسته.",
      createdAt: "۱۰:۱۵",
      isOutgoing: false,
    },
  ],
  3: [
    {
      id: 301,
      conversationId: 3,
      senderId: 999,
      senderName: "کانال اطلاع‌رسانی",
      text: "نسخه جدید پیام‌رسان منتشر شد.",
      createdAt: "دیروز",
      isOutgoing: false,
    },
  ],
};

export const useChatStore = create<ChatStore>((set) => ({
  activeTab: "ALL",
  setActiveTab: (tab) => set({ activeTab: tab }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  activeConversationId: null,

  setActiveConversation: (id) =>
    set((state) => {
      const updatedConversations = state.conversations.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c,
      );
      return {
        activeConversationId: id,
        conversations: updatedConversations,
        replyingTo: null,
      };
    }),

  conversations: INITIAL_CONVERSATIONS,
  messages: INITIAL_MESSAGES,

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

      const currentMsgs = state.messages[conversationId] || [];

      const updatedConversations = state.conversations.map((c) =>
        c.id === conversationId
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

  editMessage: (conversationId, messageId, newText) =>
    set((state) => {
      const currentMsgs = state.messages[conversationId] || [];
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
      const currentMsgs = state.messages[conversationId] || [];
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

  // اکشن جدید برای بازارسال (Forward)
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

      const currentMsgs = state.messages[targetConversationId] || [];
      const updatedConversations = state.conversations.map((c) =>
        c.id === targetConversationId
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
}));
