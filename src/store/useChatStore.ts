import { create } from "zustand";
import type {
  ConversationItem,
  ConversationType,
  MessageItem,
  SocketEnvelope,
} from "../types/chat";
import { authStorage } from "../services/auth";
import { messagesApi, isMessageDeleted } from "../services/apiService";
import { v4 as uuidv4 } from "uuid";
import { forwardMessagesApi } from '../services/apiService';

// اگر mapper پیام حذف‌شده را null برگرداند، آن را حذف می‌کنیم
// و در غیر این صورت پرچم isDeleted را تضمین می‌کنیم.
const filterDeleted = (msgs: MessageItem[]): MessageItem[] =>
  msgs
    .filter((m): m is MessageItem => m != null && !isMessageDeleted(m))
    .map((m) => ({ ...m, isDeleted: false }));

interface ChatStore {
  activeTab: ConversationType;
  setActiveTab: (tab: ConversationType) => void;
  searchQuery: string;
  messageToEdit: MessageItem | null;
  setMessageToEdit: (message: MessageItem | null) => void;
  setSearchQuery: (query: string) => void;
  activeConversationId: string | number | null;
  setActiveConversation: (id: string | number | null) => void;
  conversations: ConversationItem[];
  messages: Record<string | number, MessageItem[]>;
  setConversations: (conversations: ConversationItem[]) => void;

  setMessagesForConversation: (
    conversationId: string | number,
    newMessages: MessageItem[],
  ) => void;

  replyingTo: MessageItem | null;
  setReplyingTo: (message: MessageItem | null) => void;

  // Optimistic UI Actions
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
  ) => Promise<void>; // تغییر تایپ به Promise به خاطر async بودن

  // Conversations Actions
  deleteConversation: (conversationId: string | number) => void;
  leaveConversation: (conversationId: string | number) => void;
  clearChat: (conversationId: string | number) => void;
  togglePinConversation: (conversationId: string | number) => void;
  toggleMuteConversation: (conversationId: string | number) => void;
  toggleUnreadConversation: (conversationId: string | number) => void;
  markAsRead: (conversationId: string | number) => void;

  // Central Socket Event Router
  receiveLiveMessage: (
    envelope: SocketEnvelope,
    currentUserId: number | string,
  ) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  activeTab: "ALL",
  setActiveTab: (tab) => set({ activeTab: tab }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  activeConversationId: null,
  messageToEdit: null,
  setMessageToEdit: (message) => set({ messageToEdit: message }),
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
  conversations: [],
  messages: {},

  setMessagesForConversation: (conversationId, newMessages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: filterDeleted(newMessages),
      },
    })),

  replyingTo: null,
  setReplyingTo: (message) => set({ replyingTo: message }),

  sendMessage: async (conversationId: string | number, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const replyingTo = get().replyingTo;
    const tempId = uuidv4();

    // ۱. آپدیت فوری لوکال (Optimistic UI)
    const optimisticMessage: MessageItem = {
      id: tempId,
      conversationId: conversationId,
      text: trimmed,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOutgoing: true,
      isDeleted: false,
      status: "sending",
      replyToMessage: replyingTo
        ? {
            id: String(replyingTo.id),
            senderName: replyingTo.senderName || "",
            text: replyingTo.text,
          }
        : null,
    };

    set((state) => {
      const convMessages =
        state.messages[conversationId] ||
        state.messages[String(conversationId)] ||
        [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...convMessages, optimisticMessage],
        },
        replyingTo: null,
      };
    });

    // ۲. پیلود کامل پیام
    const payload = {
      tempId: tempId,
      conversationId: String(conversationId),
      text: trimmed,
      encodedText: "",
      attachment: { id: "", url: "" },
      attachmentThumbnail: { id: "", url: "" },
      albums: [],
      albumsThumbnail: [],
      albumsTypes: [],
      extra: "",
      forwarderId: "",
      forwarderNickname: "",
      replyRefMessageId: replyingTo ? String(replyingTo.id) : "",
      replyRefMessageText: replyingTo ? replyingTo.text : "",
      replyRefUserId: replyingTo && replyingTo.senderId ? String(replyingTo.senderId) : "",
      replyRefUserNickname: replyingTo ? (replyingTo.senderName || "") : "",
      replyRefMessageType: replyingTo ? "TEXT" : "",
      replyRefUserAvatarThumbnail: { id: "", url: "" },
      messageState: "SENT",
      opponentIds: [],
      messageType: "TEXT",
    };

    // ۳. ارسال پیام از طریق HTTP POST
    try {
      await messagesApi.sendMessage(String(conversationId), payload);
      // تغییر وضعیت از sending به sent
      set((state) => {
        const msgs = state.messages[conversationId] || [];
        return {
          messages: {
            ...state.messages,
            [conversationId]: msgs.map((m: MessageItem) =>
              m.id === tempId ? { ...m, status: "sent" as const } : m,
            ),
          },
        };
      });
    } catch (error) {
      console.error("Failed to send message via REST API:", error);
    }
  },

  receiveLiveMessage: (
    envelope: SocketEnvelope,
    currentUserId: number | string,
  ) => {
    if (!envelope || !envelope.type) return;

    const { type, content } = envelope;

    switch (type.toUpperCase()) {
      case "NEW_MESSAGE":
      case "SEND_MESSAGE":
      case "MESSAGE_SEND":
      case "MESSAGE.SEND": {
        const msgContent = content as any;
        const receivedConversationId =
          msgContent.conversationId || msgContent.chatId;

        const matchedConversation = get().conversations.find((c) => {
          return (
            String(c.id) === String(receivedConversationId) ||
            String(c.id) === String(msgContent.targetId) ||
            String(c.id) === String(msgContent.chatId)
          );
        });

        const conversationId = matchedConversation
          ? matchedConversation.id
          : receivedConversationId;

        if (!conversationId) return;

        const actualSenderId =
          msgContent.authorUserId || msgContent.senderId || msgContent.userId;
        const currentUserUuid = authStorage.getUserUuid();
        const isMe = String(actualSenderId) === String(currentUserUuid);

        const realMessageId = msgContent.id || msgContent.messageId;
        const returnedTempId = msgContent.tempId;

        if (isMessageDeleted(msgContent)) {
          get().deleteMessage(conversationId, realMessageId || returnedTempId);
          break;
        }

        const newMsg: MessageItem = {
          isDeleted: false,
          id: realMessageId || returnedTempId || Date.now(),
          conversationId: conversationId,
          senderId: actualSenderId || null,
          isOutgoing: isMe,
          isMe,
          text: msgContent.text || msgContent.content || "",
          createdAt: new Date().toISOString(),
          senderName: msgContent.senderName || msgContent.authorNickname || "",
          status: "delivered",
          replyToId:
            msgContent.replyRef?.id ?? msgContent.replyRefMessageId ?? null,
          forwardFrom: null,
          replyRefMessageId:
            msgContent.replyRef?.id || msgContent.replyRefMessageId,
        };

        set((state) => {
          const currentList =
            state.messages[conversationId] ||
            state.messages[String(conversationId)] ||
            [];

          const existingPendingIndex = currentList.findIndex((m) => {
            if (returnedTempId && String(m.id) === String(returnedTempId))
              return true;
            if (realMessageId && String(m.id) === String(realMessageId))
              return true;
            return false;
          });

          let updatedList: MessageItem[];

          if (existingPendingIndex !== -1) {
            updatedList = [...currentList];
            updatedList[existingPendingIndex] = {
              ...updatedList[existingPendingIndex],
              ...newMsg,
              id: realMessageId || updatedList[existingPendingIndex].id,
              status: "delivered",
            };
          } else {
            updatedList = [...currentList, newMsg];
          }

          const updatedConversations = state.conversations.map((c) => {
            if (String(c.id) === String(conversationId)) {
              return {
                ...c,
                lastMessageText: newMsg.text,
                unreadCount: isMe ? c.unreadCount : (c.unreadCount || 0) + 1,
              };
            }
            return c;
          });

          return {
            messages: {
              ...state.messages,
              [conversationId]: updatedList,
            },
            conversations: updatedConversations,
          };
        });
        break;
      }

      case "EDIT_MESSAGE":
      case "MESSAGE_EDIT": {
        const msgContent = content as any;
        const conversationId = msgContent.conversationId || msgContent.chatId;
        const messageId = msgContent.id || msgContent.messageId;
        const newText = msgContent.text || msgContent.content || "";
        if (conversationId && messageId) {
          get().editMessage(conversationId, messageId, newText);
        }
        break;
      }

      case "DELETE_MESSAGE":
      case "MESSAGE_DELETE": {
        const msgContent = content as any;
        const conversationId = msgContent.conversationId || msgContent.chatId;
        const messageId = msgContent.id || msgContent.messageId;
        if (conversationId && messageId) {
          get().deleteMessage(conversationId, messageId);
        }
        break;
      }

      case "DELETE_CONVERSATION":
      case "LEAVE_CONVERSATION": {
        const msgContent = content as any;
        const conversationId = msgContent.conversationId || msgContent.id;
        if (conversationId) {
          get().deleteConversation(conversationId);
        }
        break;
      }

      default:
        console.log(`[Socket Envelope]: Unhandled type '${type}'`, content);
        break;
    }
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
            ? { ...c, lastMessageText: "", lastMessageTime: "" }
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
            lastMessageText: newText,
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
            lastMessageText: lastMsg ? lastMsg.text : "",
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

  forwardMessage: async (targetConversationId, message, fromChatTitle) => {
    const timeNow = new Date().toISOString();
    const tempId = Date.now();

    // دریافت وضعیت فعلی Store برای پیدا کردن چت مقصد
    const state = get();
    const targetChat = state.conversations.find((c) => String(c.id) === String(targetConversationId));
    
    // مشخص کردن نوع چت مقصد
    let targetType: "PERSONAL" | "GROUP" | "CHANNEL" = "PERSONAL";
    if (targetChat) {
      const chatType = (targetChat as any).chatType || (targetChat as any).type;
      if (chatType?.toUpperCase() === 'GROUP') {
        targetType = "GROUP";
      } else if (chatType?.toUpperCase() === 'CHANNEL') {
        targetType = "CHANNEL";
      }
    }

    const newMsg: MessageItem = {
      id: tempId,
      conversationId: targetConversationId,
      senderId: 1, // یا دریافت از state احراز هویت
      text: message.text,
      createdAt: timeNow,
      isOutgoing: true,
      isDeleted: false,
      status: "sending", // وضعیت در حال ارسال (آپدیت خوش‌بینانه)
      forwardFrom: {
        id: String(message.id),
        name: message.senderName || "ناشناس",
        chatTitle: fromChatTitle,
      },
    };

    // ۱. آپدیت رابط کاربری به صورت محلی و فوری
    set((currentState) => {
      const currentMsgs =
        currentState.messages[targetConversationId] ||
        currentState.messages[String(targetConversationId)] ||
        [];
      const updatedConversations = currentState.conversations.map((c) =>
        String(c.id) === String(targetConversationId)
          ? { ...c, lastMessageText: message.text, lastMessageTime: timeNow }
          : c,
      );

      return {
        messages: {
          ...currentState.messages,
          [targetConversationId]: [...currentMsgs, newMsg],
        },
        conversations: updatedConversations,
      };
    });

    // ۲. ارسال درخواست API به سرور
    try {
      await forwardMessagesApi(
        [String(message.id)],
        [String(targetConversationId)],
        targetType
      );

      // در صورت ارسال موفق، وضعیت پیام را به sent تغییر می‌دهیم
      set((currentState) => {
        const currentMsgs =
          currentState.messages[targetConversationId] ||
          currentState.messages[String(targetConversationId)] ||
          [];
        
        return {
          messages: {
            ...currentState.messages,
            [targetConversationId]: currentMsgs.map((m: MessageItem) =>
              m.id === tempId ? { ...m, status: "sent" as const } : m,
            ),
          },
        };
      });
    } catch (error) {
      console.error("Failed to forward message via REST API:", error);
      // در صورت نیاز می‌توانید پیام موقت را پاک کنید یا وضعیت failed به آن بدهید
    }
  },

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
