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

  // اکشن‌های مدیریت گفتگوها و سایدبار
  deleteConversation: (conversationId: string | number) => void;
  leaveConversation: (conversationId: string | number) => void; // 👈 اضافه شد
  clearChat: (conversationId: string | number) => void;
  togglePinConversation: (conversationId: string | number) => void;
  toggleMuteConversation: (conversationId: string | number) => void;
  toggleUnreadConversation: (conversationId: string | number) => void;
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
    lastMessage: "🔒 توجه: به منظور ارتقای امنیت، لطفاً نسبت به فعال‌سازی تایید دو مرحله‌ای اقدام فرمایید.",
    lastMessageTime: "۱۶:۱۰",
    unreadCount: 0,
    isPinned: true,
    isMuted: true,
    isVerified: true,
  },
  {
    id: 3,
    title: "گروه توسعه نرم‌افزار",
    type: "GROUP",
    lastMessage: "علی: عالیه، اگر کامپوننت جدیدی نیاز بود بگید تا سریع اضافه کنم.",
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

  // ۲. پیام‌های کانال اطلاع‌رسانی (id: 2)
  2: [
    {
      id: 201,
      conversationId: 2,
      senderId: 99,
      senderName: "کانال اطلاع‌رسانی",
      text: "📢 به کانال رسمی اطلاع‌رسانی خوش آمدید. تمامی اطلاعیه‌ها و رویدادهای جدید از این پس از طریق این کانال منتشر خواهد شد.",
      createdAt: "۰۸:۳۰",
      isOutgoing: false,
    },
    {
      id: 202,
      conversationId: 2,
      senderId: 99,
      senderName: "کانال اطلاع‌رسانی",
      text: "⚙️ گزارش به‌روزرسانی سیستم:\nنسخه جدید پلتفرم با بهینه‌سازی سرعت و بهبود رابط کاربری منتشر شد.",
      createdAt: "۱۱:۴۵",
      isOutgoing: false,
    },
    {
      id: 203,
      conversationId: 2,
      senderId: 99,
      senderName: "کانال اطلاع‌رسانی",
      text: "🗓️ یادآوری: جلسه عمومی ارائه گزارش عملکرد ماهانه فردا ساعت ۱۰:۰۰ به صورت آنلاین برگزار خواهد شد.",
      createdAt: "۱۴:۲۰",
      isOutgoing: false,
    },
    {
      id: 204,
      conversationId: 2,
      senderId: 99,
      senderName: "کانال اطلاع‌رسانی",
      text: "🔒 توجه: به منظور ارتقای امنیت، لطفاً نسبت به فعال‌سازی تایید دو مرحله‌ای اقدام فرمایید.",
      createdAt: "۱۶:۱۰",
      isOutgoing: false,
    },
  ],

  // ۳. پیام‌های گروه توسعه نرم‌افزار (id: 3)
  3: [
    {
      id: 301,
      conversationId: 3,
      senderId: 5,
      senderName: "سارا احمدی",
      text: "سلام همگی، صبح روز سه‌شنبه بخیر 🌸",
      createdAt: "۰۹:۰۰",
      isOutgoing: false,
    },
    {
      id: 302,
      conversationId: 3,
      senderId: 6,
      senderName: "امیرحسین رضایی",
      text: "سلام سارا خانم، روزتون بخیر. بچه‌ها تغییرات تسک‌های اسپرینت روی بورد ثبت شد؟",
      createdAt: "۰۹:۰۴",
      isOutgoing: false,
    },
    {
      id: 303,
      conversationId: 3,
      senderId: 1,
      text: "سلام به همگی. بله، تسک‌های مربوط به پیام‌رسان و رفع باگ تایپ‌اسکریپت نهایی شده.",
      createdAt: "۰۹:۰۷",
      isOutgoing: true,
      status: "read",
    },
    {
      id: 304,
      conversationId: 3,
      senderId: 5,
      senderName: "سارا احمدی",
      text: "دستت درد نکنه علی جان، من بخش طراحی UI رو بازبینی کردم، عالی شده.",
      createdAt: "۰۹:۱۰",
      isOutgoing: false,
    },
    {
      id: 305,
      conversationId: 3,
      senderId: 6,
      senderName: "امیرحسین رضایی",
      text: "فقط تست اندپوینت‌های سوکت موند که تا ظهر جمعش می‌کنیم.",
      createdAt: "۰۹:۱۲",
      isOutgoing: false,
    },
    {
      id: 306,
      conversationId: 3,
      senderId: 1,
      text: "عالیه، اگر کامپوننت جدیدی نیاز بود بگید تا سریع اضافه کنم.",
      createdAt: "۰۹:۱۵",
      isOutgoing: true,
      status: "sent",
    },
  ],

  // ۴. گفتگوی شخصی محمد رضایی (id: 4)
  4: [
    {
      id: 401,
      conversationId: 4,
      senderId: 4,
      senderName: "محمد رضایی",
      text: "سلام، وقت بخیر علی جان.",
      createdAt: "۱۰:۰۰",
      isOutgoing: false,
    },
    {
      id: 402,
      conversationId: 4,
      senderId: 1,
      text: "سلام محمد جان، روزت بخیر.",
      createdAt: "۱۰:۰۵",
      isOutgoing: true,
      status: "read",
    },
    {
      id: 403,
      conversationId: 4,
      senderId: 4,
      senderName: "محمد رضایی",
      text: "سلام، فایل‌ها رو بررسی کردی؟",
      createdAt: "۱۰:۱۰",
      isOutgoing: false,
    },
    {
      id: 404,
      conversationId: 4,
      senderId: 1,
      text: "بله، بررسی کردم. فایل‌ها آماده‌ست.",
      createdAt: "۱۰:۱۲",
      isOutgoing: true,
      status: "read",
    },
    {
      id: 405,
      conversationId: 4,
      senderId: 4,
      senderName: "محمد رضایی",
      text: "عالی! کی می‌تونی برام بفرستی؟",
      createdAt: "۱۰:۱۵",
      isOutgoing: false,
    },
    {
      id: 406,
      conversationId: 4,
      senderId: 1,
      text: "همین الان برات ارسال می‌کنم.",
      createdAt: "۱۰:۱۶",
      isOutgoing: true,
      status: "sent",
    },
    {
      id: 407,
      conversationId: 4,
      senderId: 4,
      senderName: "محمد رضایی",
      text: "ممنون، منتظرم.",
      createdAt: "۱۰:۱۷",
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
        String(c.id) === String(id) ? { ...c, unreadCount: 0 } : c,
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
