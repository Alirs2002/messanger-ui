import { create } from "zustand";
import type {
  ConversationItem,
  ConversationType,
  MessageItem,
  SocketEnvelope,
} from "../types/chat";
import { authStorage } from "../services/auth";
import { messagesApi } from "../services/apiService";
import { stompService } from "../services/stompService";

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
  // sendMessage: async (conversationId: string | number, text: string) => {
  //   const trimmed = text.trim();
  //   if (!trimmed) return;

  //   const replyingTo = get().replyingTo;
  //   const tempId = `temp-${Date.now()}`;

  //   // ۱. آپدیت فوری لوکال (Optimistic Update)
  //   // ۱. آپدیت فوری لوکال
  //   const optimisticMessage: MessageItem = {
  //     id: Date.now(),
  //     text: trimmed,
  //     createdAt: new Date().toISOString(),
  //     timestamp: new Date().toLocaleTimeString([], {
  //       hour: "2-digit",
  //       minute: "2-digit",
  //     }),
  //     isOutgoing: true,
  //     status: "sending",
  //     replyToMessage: replyingTo
  //       ? {
  //           id: replyingTo.id,
  //           senderName: replyingTo.senderName,
  //           text: replyingTo.text,
  //         }
  //       : null,
  //   };

  //   set((state) => {
  //     const convMessages = state.messages[conversationId] || [];
  //     return {
  //       messages: {
  //         ...state.messages,
  //         [conversationId]: [...convMessages, optimisticMessage],
  //       },
  //       replyingTo: null,
  //     };
  //   });

  //   // ۲. ارسال پیام با POST به سرور
  //   try {
  //     const payload = {
  //       tempId: tempId,
  //       text: trimmed,
  //       encodedText: "",
  //       attachment: { id: "", url: "" },
  //       attachmentThumbnail: { id: "", url: "" },
  //       albums: [],
  //       albumsThumbnail: [],
  //       albumsTypes: [],
  //       extra: "",
  //       forwarderId: "",
  //       forwarderNickname: "",
  //       replyRefMessageId: replyingTo ? String(replyingTo.id) : "",
  //       replyRefMessageText: replyingTo ? replyingTo.text : "",
  //       replyRefUserId: "",
  //       replyRefUserNickname: replyingTo ? replyingTo.senderName : "",
  //       replyRefMessageType: "",
  //       replyRefUserAvatarThumbnail: { id: "", url: "" },
  //       messageState: "SENT",
  //       opponentIds: [],
  //       messageType: "TEXT",
  //     };

  //     await messagesApi.sendMessage(conversationId, payload);
  //   } catch (error) {
  //     console.error("Failed to send message to server:", error);
  //     // در صورت نیاز می‌تونی وضعیت پیام رو به failed تغییر بدی
  //   }
  // },
  sendMessage: (conversationId: string | number, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const replyingTo = get().replyingTo;
    const tempId = `temp-${Date.now()}`;

    // ۱. آپدیت فوری لوکال (Optimistic UI)
    const optimisticMessage: MessageItem = {
      id: tempId, // <--- به جای Date.now() قرار دهید تا با tempId پیلود یکی باشد
      conversationId: conversationId,
      text: trimmed,
      createdAt: new Date().toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOutgoing: true,
      status: "sending",
      replyToMessage: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
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
      conversationId: conversationId,
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
      replyRefUserNickname: replyingTo ? replyingTo.senderName : "",
      replyRefMessageType: "",
      replyRefUserAvatarThumbnail: { id: "", url: "" },
      messageState: "SENT",
      opponentIds: [],
      messageType: "TEXT",
    };

    const destination = "message.send";
    const success = stompService.sendMessage(destination, payload);

    if (!success) {
      console.error("Failed to publish message via STOMP broker.");
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

    const { type, content, isResponse } = envelope;

    switch (type.toUpperCase()) {
      // 1. New incoming message
      case "NEW_MESSAGE":
      case "SEND_MESSAGE":
      case "MESSAGE_SEND":
      case "MESSAGE.SEND": {
        const receivedConversationId = content.conversationId || content.chatId;

        const matchedConversation = get().conversations.find((c) => {
          return (
            String(c.id) === String(receivedConversationId) ||
            String(c.id) === String(content.targetId) ||
            String(c.id) === String(content.chatId)
          );
        });

        const conversationId = matchedConversation
          ? matchedConversation.id
          : receivedConversationId;

        if (!conversationId) return;

        const actualSenderId =
          content.authorUserId || content.senderId || content.userId;
        const currentUserUuid = authStorage.getUserUuid();
        const isMe = String(actualSenderId) === String(currentUserUuid);

        const realMessageId = content.id || content.messageId;
        const returnedTempId = content.tempId;

        const newMsg: MessageItem = {
          id: realMessageId || returnedTempId || Date.now(),
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
          const currentList =
            state.messages[conversationId] ||
            state.messages[String(conversationId)] ||
            [];

          // ۱. جستجوی پیام موقت قبلی با tempId یا شناسه موقت
          const existingPendingIndex = currentList.findIndex((m) => {
            if (returnedTempId && String(m.id) === String(returnedTempId))
              return true;
            // در صورتی که پیام از قبل با realMessageId ثبت شده باشد
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
            // پیام جدید است (پیام دریافتی از طرف مقابل یا پیامی که در استیت نبوده)
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
