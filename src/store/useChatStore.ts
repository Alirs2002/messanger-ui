import { create } from "zustand";
import type {
  ConversationItem,
  ConversationType,
  MessageItem,
  SocketEnvelope,
} from "../types/chat";
import { authStorage } from "../services/auth";

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
  ) => void;

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
          ? { ...c, lastMessageText: text, lastMessageTime: timeNow }
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

  /**
   * Main Router for incoming STOMP messages.
   * Dispatches to relevant logic based on `type`.
   */
  receiveLiveMessage: (
    envelope: SocketEnvelope,
    currentUserId: number | string,
  ) => {
    if (!envelope || !envelope.type) return;

    const { type, content, isResponse } = envelope;

    switch (type.toUpperCase()) {
      // 1. New incoming message
      case "NEW_MESSAGE":
      case "SEND_MESSAGE":
      case "MESSAGE_SEND":
      case "MESSAGE.SEND": {
        // ۱. پیدا کردن Conversation ID اصلی از دیتای سوکت
        const receivedConversationId = content.conversationId || content.chatId;

        // ۲. تلاش برای پیدا کردن چت معادل از استیت
        // گاهی سوکت uuid می‌دهد ولی استیت بر اساس targetId کاربر ذخیره شده است (یا بالعکس)
        // 2. پیدا کردن چت معادل از استیت
        const matchedConversation = get().conversations.find((c) => {
          // ما فقط بررسی می‌کنیم که id چت در استیت با id یا targetId سوکت مچ شود
          return (
            String(c.id) === String(receivedConversationId) ||
            String(c.id) === String(content.targetId) ||
            String(c.id) === String(content.chatId)
          );
        });

        // اگر چتی پیدا کردیم، کلید آن را برمی‌داریم که دقیقاً با کلیدی که ChatArea روی آن قرار دارد یکی شود
        const conversationId = matchedConversation
          ? matchedConversation.id
          : receivedConversationId;

        if (!conversationId) return;

        const actualSenderId =
          content.authorUserId || content.senderId || content.userId;
        const currentUserUuid = authStorage.getUserUuid();
        const isMe = String(actualSenderId) === String(currentUserUuid);

        // توجه: این شرط باید کامنت بماند تا پیام‌های ارسالی خودمان در صفحه ظاهر شوند
        // if (isMe && isResponse) {
        //   return;
        // }

        const newMsg: MessageItem = {
          id: content.id || content.messageId || content.tempId || Date.now(),
          conversationId: conversationId,
          senderId: actualSenderId || null,
          isOutgoing: isMe,
          isMe,
          text: content.text || content.content || "",
          createdAt: new Date().toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          senderName: content.senderName || content.authorNickname || "",
          status: "delivered",
          replyToId: content.replyRef?.id ?? content.replyRefMessageId ?? null,
          forwardFrom: null,
          replyRefMessageId: content.replyRef?.id || content.replyRefMessageId,
        };

        set((state) => {
          // ذخیره با کلید conversationId پیدا شده که با کامپوننت ChatArea همخوانی دارد
          const currentList =
            state.messages[conversationId] ||
            state.messages[String(conversationId)] ||
            [];

          if (currentList.some((m) => String(m.id) === String(newMsg.id))) {
            return state;
          }

          const updatedConversations = state.conversations.map((c) => {
            if (String(c.id) === String(conversationId)) {
              return {
                ...c,
                lastMessageText: newMsg.text,
                unreadCount:
                  String(state.activeConversationId) ===
                    String(conversationId) || isMe
                    ? c.unreadCount
                    : (c.unreadCount || 0) + 1,
              };
            }
            return c;
          });

          return {
            messages: {
              ...state.messages,
              [conversationId]: [...currentList, newMsg],
            },
            conversations: updatedConversations,
          };
        });
        break;
      }

      // 2. Edit existing message
      case "EDIT_MESSAGE":
      case "MESSAGE_EDIT": {
        const conversationId = content.conversationId || content.chatId;
        const messageId = content.id || content.messageId;
        const newText = content.text || content.content || "";
        if (conversationId && messageId) {
          get().editMessage(conversationId, messageId, newText);
        }
        break;
      }

      // 3. Delete message
      case "DELETE_MESSAGE":
      case "MESSAGE_DELETE": {
        const conversationId = content.conversationId || content.chatId;
        const messageId = content.id || content.messageId;
        if (conversationId && messageId) {
          get().deleteMessage(conversationId, messageId);
        }
        break;
      }

      // 4. Conversation / User removed or left
      case "DELETE_CONVERSATION":
      case "LEAVE_CONVERSATION": {
        const conversationId = content.conversationId || content.id;
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
          ? { ...c, lastMessageText: message.text, lastMessageTime: timeNow }
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
