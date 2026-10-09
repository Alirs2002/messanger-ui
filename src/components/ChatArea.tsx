import React, { useState, useRef, useEffect } from "react";
import {
  Paperclip,
  Smile,
  Mic,
  Send,
  X,
  Reply,
  MessageSquare,
  ChevronDown,
  ArrowRight,
  Edit2,
  Heart,
  ThumbsUp,
  Sparkles,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { authStorage } from "../services/auth";
import MessageBubble from "./MessageBubble";
import { MessageContextMenu } from "./MessageContextMenu";
import { ChatHeaderMenu, type ChatType } from "./ChatHeaderMenu";
import { ForwardModal } from "./ForwardModal";
import { UserProfileModal } from "./UserProfileModal";
import { DeleteMessageModal } from "./DeleteMessageModal"; // <--- مودال حذف پیام
import { deleteMessages } from "../services/apiService"; // <--- ایمپورت متد API
import type { MessageItem } from "../types/chat";
import type { Message } from "../types/messenger";
import { useMessages } from "../hooks/useMessages";
import { useCurrentUserUuid } from "../hooks/useCurrentUserUuid";

// ==========================
// تبدیل پیام API به فرمت UI
// ==========================
function formatPersianTime(ts: any): string {
  if (ts && typeof ts === "object" && "hour" in ts && "minute" in ts) {
    const h = String(ts.hour).padStart(2, "0");
    const m = String(ts.minute).padStart(2, "0");
    return `${h}:${m}`.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
  }
  const d = new Date(ts);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return "";
}

function formatPersianDate(ts: any): string {
  if (ts && typeof ts === "object" && "year" in ts) {
    const { year, month, day } = ts;
    return `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
  }
  const d = new Date(ts);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("fa-IR");
  }
  return "";
}

const stateToStatus = (state?: string): MessageItem["status"] => {
  switch (state) {
    case "SEEN":
      return "read";
    case "DELIVERED":
      return "delivered";
    case "SENT":
      return "sent";
    case "PENDING":
      return "sending";
    default:
      return undefined;
  }
};
const mapApiMessage = (
  msg: Message | any,
  currentUserId: string | number | undefined,
  conversationId: string | number | undefined,
  allApiMessages: Message[],
): MessageItem => {
  const actualSenderId = msg.authorUserId || msg.senderId;
  const actualSenderName = msg.authorNickname || msg.senderNickname;

  const isOutgoing = currentUserId
    ? String(actualSenderId) === String(currentUserId)
    : false;

  const replyRefId = String(
    msg.replyRefMessageId ?? msg.replyToMessageId ?? "",
  );
  const replied = replyRefId
    ? allApiMessages.find((m) => String(m.id) === String(replyRefId))
    : undefined;

  let replyToMessage = null;
  if (replyRefId) {
    replyToMessage = {
      id: replyRefId,
      text: msg.replyRefMessageText || replied?.text || "",
      senderName:
        msg.replyRefUserNickname ||
        replied?.authorNickname ||
        replied?.senderNickname ||
        "کاربر",
      isOutgoing: currentUserId
        ? String(
            msg.replyRefSenderId || replied?.authorUserId || replied?.senderId,
          ) === String(currentUserId)
        : false,
    };
  }

  return {
    id: msg.id,
    conversationId: msg.conversationId ?? conversationId,
    senderId: actualSenderId,
    senderName: actualSenderName,
    text: msg.text ?? "",
    createdAt: formatPersianTime(
      (msg as any).createdAt || (msg as any).timestamp,
    ),
    timestamp: formatPersianDate(
      (msg as any).createdAt || (msg as any).timestamp,
    ),
    isOutgoing,
    isMe: isOutgoing,
    isEdited: Boolean(msg.isEdited),
    status: stateToStatus((msg as any).messageState ?? msg.state),
    replyToId: replyRefId ?? null,
    replyRefMessageId: replyRefId ?? null,
    replyToMessage,
    forwardFrom: null,
  };
};

// ==========================
// کامپوننت داخلی ایموجی‌پیکر
// ==========================
interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    icon: Smile,
    name: "صورتک‌ها",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "😂",
      "🤣",
      "🥲",
      "🥹",
      "😊",
      "😇",
      "🙂",
      "🙃",
      "😉",
      "😌",
      "😍",
      "🥰",
      "😘",
      "😗",
      "😋",
      "😛",
      "😜",
      "🤪",
      "😝",
      "🤑",
      "🤗",
      "🫢",
      "🫣",
      "🤫",
      "🤔",
      "🫡",
      "🤐",
      "🤨",
      "😐",
      "😑",
      "😶",
      "🫥",
      "😏",
      "😒",
      "🙄",
      "😬",
      "😮‍💨",
      "🤥",
      "😌",
      "😴",
      "😷",
      "🤒",
      "🤕",
      "🤢",
      "🤮",
      "🤧",
      "🥵",
      "🥶",
      "🥴",
      "😵",
      "😵‍💫",
      "🤯",
      "🤠",
      "🥳",
      "🥸",
      "😎",
      "🤓",
      "🧐",
      "😕",
      "🫤",
      "😟",
      "🙁",
      "😮",
      "😯",
      "😲",
      "😳",
      "🥺",
      "🥹",
      "😦",
      "😧",
      "😨",
      "😰",
      "😥",
      "😢",
      "😭",
      "😱",
      "😖",
      "😣",
      "😞",
      "😓",
      "😩",
      "😫",
      "🥱",
      "😤",
      "😡",
      "😠",
      "🤬",
      "😈",
      "👿",
      "💀",
      "☠️",
      "💩",
      "🤡",
      "👻",
    ],
  },
  {
    id: "gestures",
    icon: ThumbsUp,
    name: "دست‌ها و بدن",
    emojis: [
      "👋",
      "🤚",
      "🖐️",
      "✋",
      "🖖",
      "🫱",
      "🫲",
      "🫸",
      "🫷",
      "🫳",
      "🫴",
      "👌",
      "🤌",
      "🤏",
      "✌️",
      "🤞",
      "🫰",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "🖕",
      "👇",
      "☝️",
      "👍",
      "👎",
      "✊",
      "👊",
      "🤛",
      "🤜",
      "👏",
      "🙌",
      "🫶",
      "👐",
      "🤲",
      "🤝",
      "🙏",
      "✍️",
      "💪",
      "🦾",
      "🦿",
      "🦵",
      "🦶",
      "👂",
      "🦻",
      "👃",
      "🧠",
      "🫀",
    ],
  },
  {
    id: "hearts",
    icon: Heart,
    name: "قلب‌ها و عواطف",
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❤️‍🔥",
      "❤️‍🩹",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "💌",
      "💋",
      "💯",
      "💢",
      "💥",
      "💫",
      "💦",
      "💨",
      "🕳️",
    ],
  },
  {
    id: "objects",
    icon: Sparkles,
    name: "نمادها و علامت‌ها",
    emojis: [
      "✨",
      "⭐",
      "🌟",
      "⚡",
      "🔥",
      "🎉",
      "🎊",
      "🎯",
      "🏆",
      "🥇",
      "🥈",
      "🥉",
      "🎁",
      "🎈",
      "💡",
      "🔔",
      "📢",
      "💬",
      "💭",
      "☕",
      "🍕",
      "🍔",
      "🍟",
      "🍰",
      "🚀",
      "✈️",
      "🚗",
      "🛵",
      "💻",
      "📱",
      "✅",
      "❌",
      "❓",
      "❗",
      "⚠️",
      "⛔",
      "🟢",
      "🔴",
      "🔵",
      "🟡",
    ],
  },
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const [activeCategory, setActiveCategory] = useState("smileys");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentEmojis =
    EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis || [];

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-20 right-6 z-40 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden select-none"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80">
        <div className="flex items-center space-x-1 space-x-reverse">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                title={cat.name}
                className={`p-2 rounded-xl transition-all ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700/60"
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-3 max-h-56 overflow-y-auto grid grid-cols-7 sm:grid-cols-8 gap-1.5">
        {currentEmojis.map((emoji, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelectEmoji(emoji)}
            className="w-9 h-9 flex items-center justify-center text-xl rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-125 transition-transform duration-100 active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

// ==========================
// کامپوننت اصلی ChatArea
// ==========================
export const ChatArea: React.FC = () => {
  const store = useChatStore() as any;
  const conversations = store.conversations || [];
  const activeConversationId = store.activeConversationId;
  const messages = store.messages || {};
  const replyingTo = store.replyingTo;
  const setReplyingTo = store.setReplyingTo;

  const [messageText, setMessageText] = useState("");
  const [editingMessage, setEditingMessage] = useState<MessageItem | null>(
    null,
  );
  const [forwardingMessage, setForwardingMessage] =
    useState<MessageItem | null>(null);

  // استیت مربوط به مودال حذف پیام
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    message: MessageItem | null;
    canDeleteForAll: boolean;
  }>({
    isOpen: false,
    message: null,
    canDeleteForAll: false,
  });

  const [isBlocked, setIsBlocked] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: MessageItem;
  } | null>(null);

  const activeConversation = conversations.find(
    (c: any) => String(c.id) === String(activeConversationId),
  );

  const apiConversationId: string | null =
    (activeConversation as any)?.conversationId ??
    (activeConversationId != null ? String(activeConversationId) : null);

  const {
    messages: apiMessages,
    loading: messagesLoading,
    loadingMore: loadingMoreMessages,
    error: messagesError,
    hasMore,
    loadOlderMessages,
    refresh: refreshMessages,
  } = useMessages(apiConversationId);

  const currentUserId = useCurrentUserUuid();

  const mappedApiMessages: MessageItem[] = apiMessages.map((m) =>
    mapApiMessage(
      m,
      currentUserId,
      apiConversationId ?? undefined,
      apiMessages,
    ),
  );

  const localMessages: MessageItem[] = activeConversationId
    ? messages[activeConversationId] ||
      messages[String(activeConversationId)] ||
      []
    : [];

  const optimisticOnly = localMessages.filter(
    (m) => !mappedApiMessages.some((api) => String(api.id) === String(m.id)),
  );

  const sortedOptimistic = [...optimisticOnly].sort((a, b) => {
    const idA = Number(a.id);
    const idB = Number(b.id);
    if (!isNaN(idA) && !isNaN(idB)) return idA - idB;
    return 0;
  });

  const currentMessages: MessageItem[] = [
    ...mappedApiMessages,
    ...sortedOptimistic,
  ];

  const displayedMessages =
    isSearching && searchQuery.trim()
      ? currentMessages.filter((msg) =>
          msg.text?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : currentMessages;

  const rawType = String(
    (activeConversation as any)?.type ||
      (activeConversation as any)?.targetType ||
      "",
  ).toUpperCase();
  const currentChatType: ChatType =
    rawType === "CHANNEL" ? "channel" : rawType === "GROUP" ? "group" : "pv";

  const isChannel = currentChatType === "channel";
  const canPostInChannel =
    Boolean((activeConversation as any)?.isAdmin) ||
    (activeConversation as any)?.role === "ADMIN" ||
    (activeConversation as any)?.role === "OWNER";
  const isMuted = Boolean((activeConversation as any)?.isMuted);

  useEffect(() => {
    setIsSearching(false);
    setSearchQuery("");
  }, [activeConversationId]);

  useEffect(() => {
    if (isSearching) searchInputRef.current?.focus();
  }, [isSearching]);

  useEffect(() => {
    if (editingMessage || !activeConversation) return;
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      setShowScrollBottom(false);
      if (((activeConversation as any).unreadCount ?? 0) > 0) {
        store.markAsRead?.(activeConversation.id);
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [activeConversationId, store.markAsRead]);

  const previousMessageCountRef = useRef<{
    conversationId: string;
    count: number;
  } | null>(null);

  useEffect(() => {
    if (!activeConversation) return;
    const conversationKey = String(activeConversation.id);
    const previous = previousMessageCountRef.current;
    const messageCount = displayedMessages.length;

    if (!previous || previous.conversationId !== conversationKey) {
      previousMessageCountRef.current = {
        conversationId: conversationKey,
        count: messageCount,
      };
      return;
    }

    previousMessageCountRef.current = {
      conversationId: conversationKey,
      count: messageCount,
    };
    if (messageCount <= previous.count) return;

    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom <= 100) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      store.markAsRead?.(activeConversation.id);
      setShowScrollBottom(false);
    }
  }, [
    displayedMessages.length,
    activeConversationId,
    activeConversation?.id,
    store.markAsRead,
  ]);

  const handleScroll = () => {
    if (!messagesContainerRef.current || !activeConversation) return;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom > 100) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
      if (
        ((activeConversation as any).unreadCount ?? 0) > 0 &&
        distanceFromBottom <= 40
      ) {
        store.markAsRead?.(activeConversation.id);
      }
    }
  };

  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (
      activeConversation &&
      ((activeConversation as any).unreadCount ?? 0) > 0
    ) {
      store.markAsRead?.(activeConversation.id);
    }
    setShowScrollBottom(false);
  };

  const handleScrollToMessage = (messageId: string | number) => {
    const targetElement = document.getElementById(`msg-${messageId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      targetElement.classList.add(
        "bg-amber-100/60",
        "dark:bg-amber-900/30",
        "transition-colors",
        "duration-300",
        "rounded-2xl",
      );
      setTimeout(() => {
        targetElement.classList.remove(
          "bg-amber-100/60",
          "dark:bg-amber-900/30",
        );
      }, 1500);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, message: MessageItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, message });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleReplyMessage = (message: MessageItem) => {
    setEditingMessage(null);
    if (setReplyingTo) setReplyingTo(message);
    inputRef.current?.focus();
    closeContextMenu();
  };

  const handleEditMessage = (message: MessageItem) => {
    if (!message.isOutgoing) {
      alert("شما فقط می‌توانید پیام‌های ارسالی خود را ویرایش کنید.");
      closeContextMenu();
      return;
    }
    if (setReplyingTo) setReplyingTo(null);
    setEditingMessage(message);
    setMessageText(message.text || "");
    inputRef.current?.focus();
    closeContextMenu();
  };

  // ==========================
  // توابع بررسی و حذف پیام
  // ==========================
  const checkCanDelete = (
    message: MessageItem,
    chatType: ChatType,
    role?: string,
  ) => {
    if (chatType === "pv") return true; // در پیوی میشه هر پیامی رو (حداقل برای خودم) پاک کرد
    if (message.isOutgoing) return true; // پیام‌های ارسالی خودم همیشه قابل حذفن
    if (role === "ADMIN" || role === "OWNER") return true; // ادمین میتونه پیام بقیه رو هم حذف کنه
    return false;
  };

  const checkCanDeleteForAll = (
    message: MessageItem,
    chatType: ChatType,
    role?: string,
  ) => {
    const isPrivileged = role === "ADMIN" || role === "OWNER";

    if (message.isOutgoing) {
      if (chatType === "pv" || chatType === "group") return true;
      if (chatType === "channel" && isPrivileged) return true;
    } else {
      if (chatType === "pv") return true; // دو طرفه در پیوی
      if ((chatType === "group" || chatType === "channel") && isPrivileged)
        return true;
    }
    return false;
  };

  const handleDeleteMessage = (message: MessageItem) => {
    const role = (activeConversation as any)?.role;
    const canForAll = checkCanDeleteForAll(message, currentChatType, role);

    setDeleteModal({
      isOpen: true,
      message,
      canDeleteForAll: canForAll,
    });
    closeContextMenu();
  };

  const handleConfirmDelete = async (tagDelete: "FOR_ALL" | "FOR_ME") => {
    if (!deleteModal.message || !activeConversation) return;

    try {
      // پیدا کردن تایپ برای بک اند بر اساس نوع چت موجود
      // پیدا کردن تایپ برای بک اند بر اساس نوع چت موجود
      const targetTypeMap: Record<string, "PERSONAL" | "GROUP" | "CHANNEL"> = {
        pv: "PERSONAL",
        group: "GROUP",
        channel: "CHANNEL",
      };
      const backendTargetType = targetTypeMap[currentChatType] || "PERSONAL";

      // فراخوانی API استاندارد بدون اکشن
      // فراخوانی API استاندارد بدون اکشن
      await deleteMessages(
        [String(deleteModal.message.id)],
        tagDelete,
        backendTargetType,
      );

      // پاک کردن پیام از UI به صورت آنی
      if (store.deleteMessage) {
        store.deleteMessage(activeConversation.id, deleteModal.message.id);
      }
    } catch (err) {
      console.error("خطا در حذف پیام:", err);
      alert("مشکلی در حذف پیام به وجود آمد.");
    } finally {
      setDeleteModal({ isOpen: false, message: null, canDeleteForAll: false });
    }
  };
  // ==========================

  const handleForwardMessage = (message: MessageItem) => {
    setForwardingMessage(message);
    closeContextMenu();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;
    if (isChannel && !canPostInChannel) return;

    if (editingMessage && store.editMessage) {
      store.editMessage(
        activeConversation.id,
        editingMessage.id,
        messageText.trim(),
      );
      setEditingMessage(null);
    } else if (store.sendMessage) {
      store.sendMessage(activeConversation.id, messageText.trim());
    }
    setMessageText("");
    setShowEmojiPicker(false);
    handleScrollToBottom();
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
        <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <MessageSquare className="w-12 h-12 text-gray-400" />
        </div>
        <p className="text-lg font-medium">یک گفتگو را برای شروع انتخاب کنید</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative">
      {/* هدر گفتگو */}
      {isSearching ? (
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center gap-3 bg-white dark:bg-gray-800 shadow-sm z-10">
          <button
            onClick={() => {
              setIsSearching(false);
              setSearchQuery("");
            }}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در این گفتگو..."
            className="flex-1 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
      ) : (
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between bg-white dark:bg-gray-800 shadow-sm z-10">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-1.5 -ml-1.5 rounded-xl transition-colors"
            onClick={() => setShowProfileModal(true)}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              {activeConversation.title?.charAt(0)}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {activeConversation.title}
              </h2>
            </div>
          </div>
          <ChatHeaderMenu
            chatType={currentChatType}
            isMuted={isMuted}
            isBlocked={isBlocked}
            onMuteToggle={() =>
              store.toggleMuteConversation?.(activeConversation.id)
            }
            onBlockToggle={() => setIsBlocked(!isBlocked)}
            onSearch={() => setIsSearching(true)}
            onReport={() => alert("گزارش تخلف ثبت گردید.")}
            onInfo={() => setShowProfileModal(true)}
            onClearChat={() => {
              if (window.confirm("از پاکسازی پیام‌ها اطمینان دارید؟"))
                store.clearChat?.(activeConversation.id);
            }}
            onLeave={() => store.leaveConversation?.(activeConversation.id)}
            onSelectMessages={() => {}}
          />
        </div>
      )}

      {/* ناحیه نمایش پیام‌ها */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={(e) => {
          handleScroll();
          const el = e.currentTarget;
          if (el.scrollTop <= 10 && hasMore && !loadingMoreMessages) {
            loadOlderMessages();
          }
        }}
      >
        {messagesError ? (
          <div className="h-full flex flex-col items-center justify-center text-red-500 gap-3 px-4 text-center">
            <MessageSquare className="w-10 h-10 opacity-40" />
            <span className="text-sm font-medium">
              خطا در دریافت پیام‌ها: {messagesError}
            </span>
            <button
              onClick={refreshMessages}
              className="px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition"
            >
              تلاش مجدد
            </button>
          </div>
        ) : messagesLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">در حال دریافت پیام‌ها...</span>
          </div>
        ) : displayedMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <span className="text-sm">
              {isSearching
                ? "پیامی یافت نشد."
                : "پیامی در این گفتگو وجود ندارد."}
            </span>
          </div>
        ) : (
          displayedMessages.map((msg) => (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              onContextMenu={(e) => handleContextMenu(e, msg)}
              className="transition-colors duration-300"
            >
              <MessageBubble
                message={msg}
                isChannel={isChannel}
                onReplyClick={handleScrollToMessage}
                onForwardClick={handleForwardMessage}
              />
            </div>
          ))
        )}
        {loadingMoreMessages && (
          <div className="flex justify-center py-2">
            <div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollBottom && (
        <button
          onClick={handleScrollToBottom}
          className="absolute bottom-20 left-6 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 border border-gray-100 z-10"
        >
          <ChevronDown className="w-5 h-5" />
          {((activeConversation as any).unreadCount ?? 0) > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              {(activeConversation as any).unreadCount}
            </span>
          )}
        </button>
      )}

      {/* پاپ‌آپ ایموجی‌پیکر */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={(emoji) => {
          setMessageText((prev) => prev + emoji);
          inputRef.current?.focus();
        }}
      />

      {/* بنر ریپلای یا ویرایش */}
      {(replyingTo || editingMessage) && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs truncate">
            {editingMessage ? (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <Edit2 className="w-3.5 h-3.5" /> در حال ویرایش:
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <Reply className="w-3.5 h-3.5" /> پاسخ به:
              </span>
            )}
            <span className="text-slate-600 dark:text-gray-300 truncate max-w-xs">
              {editingMessage ? editingMessage.text : replyingTo?.text}
            </span>
          </div>
          <button
            onClick={() => {
              setEditingMessage(null);
              if (setReplyingTo) setReplyingTo(null);
              if (editingMessage) setMessageText("");
            }}
            className="p-1 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-full text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* نوار ارسال پیام */}
      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmojiPicker((prev) => !prev);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition"
          >
            <Smile className="w-6 h-6" />
          </button>
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition"
          >
            <Paperclip className="w-6 h-6" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="پیام خود را بنویسید..."
            disabled={isBlocked || (isChannel && !canPostInChannel)}
            className="flex-1 bg-gray-100 dark:bg-gray-700 px-4 py-2.5 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 dark:text-white disabled:opacity-50"
          />
          {messageText.trim() ? (
            <button
              type="submit"
              className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full hover:bg-gray-200 transition"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
      </div>

      {contextMenu && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          message={contextMenu.message}
          onClose={closeContextMenu}
          onReply={handleReplyMessage}
          onEdit={handleEditMessage}
          onDelete={
            checkCanDelete(
              contextMenu.message,
              currentChatType,
              (activeConversation as any)?.role,
            )
              ? handleDeleteMessage
              : undefined
          }
          onForward={handleForwardMessage}
        />
      )}

      {/* نمایش مودال تایید حذف در صورت نیاز */}
      {deleteModal.isOpen && (
        <DeleteMessageModal
          isOpen={deleteModal.isOpen}
          canDeleteForAll={deleteModal.canDeleteForAll}
          onClose={() =>
            setDeleteModal({
              isOpen: false,
              message: null,
              canDeleteForAll: false,
            })
          }
          onConfirm={handleConfirmDelete}
        />
      )}

      {forwardingMessage && (
        <ForwardModal
          isOpen={true}
          message={forwardingMessage}
          currentChatTitle={activeConversation.title}
          onClose={() => setForwardingMessage(null)}
        />
      )}

      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          conversation={activeConversation}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};

export default ChatArea;
