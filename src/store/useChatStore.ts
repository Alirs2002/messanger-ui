import { create } from "zustand";
import type {
  ConversationItem,
  ConversationType,
  MessageItem,
  SocketEnvelope,
} from "../types/chat";
import { authStorage } from "../services/auth";
import { messagesApi } from "../services/apiService";
import { v4 as uuidv4 } from "uuid";

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
      createdAt: new Date().toISOString(), // بهتر است استاندارد ذخیره شود، فرمت نمایش سمت کامپوننت انجام شود
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOutgoing: true,
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
      replyRefUserId: "",
      replyRefUserNickname: replyingTo ? replyingTo.senderName || "" : "",
      replyRefMessageType: "",
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

  /**
   * Main Router for incoming STOMP messages.
   * Dispatches to relevant logic based on `type`.
   */
  receiveLiveMessage: (
    envelope: SocketEnvelope,
    currentUserId: number | string,
  ) => {
    if (!envelope || !envelope.type) return;

    const { type, content } = envelope;

    switch (type.toUpperCase()) {
      // 1. New incoming message
      case "NEW_MESSAGE":
      case "SEND_MESSAGE":
      case "MESSAGE_SEND":
      case "MESSAGE.SEND": {
        // تایپ کانتنت را به نوع `any` می‌گیریم تا بتوانیم فیلدهای داینامیک سرور را چک کنیم
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

        const newMsg: MessageItem = {
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

          // ۱. جستجوی پیام موقت قبلی با tempId
          const existingPendingIndex = currentList.findIndex((m) => {
            if (returnedTempId && String(m.id) === String(returnedTempId))
              return true;
            if (realMessageId && String(m.id) === String(realMessageId))
              return true;
            return false;
          });

          let updatedList: MessageItem[];

          if (existingPendingIndex !== -1) {
            // جایگزینی پیام موقت با پیام تایید شده از سرور
            updatedList = [...currentList];
            updatedList[existingPendingIndex] = {
              ...updatedList[existingPendingIndex],
              ...newMsg,
              id: realMessageId || updatedList[existingPendingIndex].id,
              status: "delivered",
            };
          } else {
            // پیام جدید است
            updatedList = [...currentList, newMsg];
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
              [conversationId]: updatedList,
            },
            conversations: updatedConversations,
          };
        });
        break;
      }

      // 2. Edit existing message
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

      // 3. Delete message
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

      // 4. Conversation / User removed or left
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

  forwardMessage: (targetConversationId, message, fromChatTitle) =>
    set((state) => {
      const timeNow = new Date().toISOString();

      const newMsg: MessageItem = {
        id: Date.now(),
        conversationId: targetConversationId,
        senderId: 1,
        text: message.text,
        createdAt: timeNow,
        isOutgoing: true,
        status: "sent",
        forwardFrom: {
          id: String(message.id),
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
