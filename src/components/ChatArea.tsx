import React, { useState, useRef, useEffect } from "react";
import {
  Paperclip,
  Smile,
  Mic,
  Send,
  X,
  Reply,
  MessageSquare,
  Check,
  Edit2,
  Lock,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import MessageBubble from "./MessageBubble";
import { MessageContextMenu } from "./MessageContextMenu";
import { ChatHeaderMenu, type ChatType } from "./ChatHeaderMenu";
import { ForwardModal } from "./ForwardModal";
import type { MessageItem } from "../types/chat";

export const ChatArea: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    messages,
    replyingTo,
    setReplyingTo,
    sendMessage,
    editMessage,
    deleteMessage,
    leaveConversation, // 👈 اضافه شد
    clearChat,
    toggleMuteConversation,
  } = useChatStore();

  const [messageText, setMessageText] = useState("");
  const [editingMessage, setEditingMessage] = useState<MessageItem | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<MessageItem | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: MessageItem;
  } | null>(null);

  const activeConversation = conversations.find(
    (c) => String(c.id) === String(activeConversationId),
  );

  // دریافت پیام‌های چت فعال
  const currentMessages: MessageItem[] = activeConversationId
    ? messages[activeConversationId] ||
      messages[String(activeConversationId)] ||
      []
    : [];

  // تشخیص نوع چت
  const rawType = String(activeConversation?.type || "").toUpperCase();
  const currentChatType: ChatType =
    rawType === "CHANNEL"
      ? "channel"
      : rawType === "GROUP"
      ? "group"
      : "pv";

  const isChannel = currentChatType === "channel";

  const canPostInChannel =
    Boolean((activeConversation as any)?.isAdmin) ||
    (activeConversation as any)?.role === "ADMIN" ||
    (activeConversation as any)?.role === "OWNER";

  const isMuted = Boolean(activeConversation?.isMuted);

  useEffect(() => {
    if (!editingMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages, editingMessage, activeConversationId]);

  useEffect(() => {
    if (editingMessage) {
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  const handleScrollToMessage = (messageId: string | number) => {
    const targetElement = document.getElementById(`message-${messageId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      targetElement.classList.add(
        "bg-amber-100/60",
        "dark:bg-amber-900/30",
        "p-1",
        "rounded-2xl",
      );
      setTimeout(() => {
        targetElement.classList.remove(
          "bg-amber-100/60",
          "dark:bg-amber-900/30",
          "p-1",
          "rounded-2xl",
        );
      }, 1200);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, message: MessageItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleReplyMessage = (message: MessageItem) => {
    setEditingMessage(null);
    setReplyingTo(message);
    inputRef.current?.focus();
    closeContextMenu();
  };

  const handleEditMessage = (message: MessageItem) => {
    if (!message.isOutgoing) {
      alert("شما فقط می‌توانید پیام‌های ارسالی خود را ویرایش کنید.");
      closeContextMenu();
      return;
    }
    setReplyingTo(null);
    setEditingMessage(message);
    setMessageText(message.text);
    inputRef.current?.focus();
    closeContextMenu();
  };

  const handleDeleteMessage = (message: MessageItem) => {
    if (!message.isOutgoing) {
      alert("امکان حذف پیام‌های سایر اعضا وجود ندارد.");
      closeContextMenu();
      return;
    }
    if (activeConversation) {
      deleteMessage(activeConversation.id, message.id);
    }
    closeContextMenu();
  };

  const handleForwardMessage = (message: MessageItem) => {
    setForwardingMessage(message);
    closeContextMenu();
  };

  const handleCancelAction = () => {
    setEditingMessage(null);
    setReplyingTo(null);
    setMessageText("");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;

    if (isChannel && !canPostInChannel) return;

    if (editingMessage) {
      editMessage(activeConversation.id, editingMessage.id, messageText.trim());
      setEditingMessage(null);
      setMessageText("");
    } else {
      sendMessage(activeConversation.id, messageText.trim());
      setMessageText("");
    }
  };

  const handleClearChat = () => {
    if (
      activeConversation &&
      window.confirm("آیا از پاکسازی تمام پیام‌های این گفتگو اطمینان دارید؟")
    ) {
      clearChat(activeConversation.id);
    }
  };

  // 👈 رفع باگ خروج از گروه یا کانال
  const handleLeaveGroup = () => {
    if (!activeConversation) return;

    const chatTypeName =
      currentChatType === "channel"
        ? "کانال"
        : currentChatType === "group"
        ? "گروه"
        : "گفتگو";

    if (window.confirm(`آیا از ترک این ${chatTypeName} اطمینان دارید؟`)) {
      leaveConversation(activeConversation.id);
    }
  };

  const handleBlockToggle = () => {
    if (isBlocked) {
      setIsBlocked(false);
      alert("کاربر از حالت مسدود خارج شد.");
    } else {
      if (window.confirm("آیا از مسدود کردن این کاربر اطمینان دارید؟")) {
        setIsBlocked(true);
        alert("کاربر مسدود شد.");
      }
    }
  };

  const handleReport = () => {
    alert("گزارش تخلف برای این گفتگو ثبت گردید.");
  };

  const handleSearch = () => {
    inputRef.current?.focus();
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
      {/* Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between bg-white dark:bg-gray-800 shadow-sm z-10">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              {activeConversation.title.charAt(0)}
            </div>
            {activeConversation.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {activeConversation.title}
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {currentChatType === "pv" ? (
                isBlocked ? (
                  <span className="text-rose-500">مسدود شده</span>
                ) : activeConversation.isOnline ? (
                  <span className="text-emerald-500 font-medium">آنلاین</span>
                ) : (
                  "آخرین بازدید اخیراً"
                )
              ) : currentChatType === "group" ? (
                "گروه"
              ) : (
                "کانال"
              )}
            </span>
          </div>
        </div>

        <ChatHeaderMenu
          chatType={currentChatType}
          isMuted={isMuted}
          isBlocked={isBlocked}
          onMuteToggle={() => toggleMuteConversation(activeConversation.id)}
          onBlockToggle={handleBlockToggle}
          onSearch={handleSearch}
          onReport={handleReport}
          onInfo={() => alert(`اطلاعات: ${activeConversation.title}`)}
          onClearChat={handleClearChat}
          onLeave={handleLeaveGroup}
          onSelectMessages={() => alert("حالت انتخاب پیام‌ها فعال شد")}
        />
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400">
            پیامی در این گفتگو وجود ندارد.
          </div>
        ) : (
          currentMessages.map((msg) => (
            <div key={msg.id} onContextMenu={(e) => handleContextMenu(e, msg)}>
              <MessageBubble
                message={msg}
                onReplyClick={handleScrollToMessage}
                isChannel={currentChatType === "channel"}
                onForwardClick={handleForwardMessage}
              />
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Edit bar */}
      {editingMessage && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse overflow-hidden">
            <Edit2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="border-r-2 border-emerald-500 pr-2 truncate">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                ویرایش پیام
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-md">
                {editingMessage.text}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancelAction}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reply bar */}
      {replyingTo && !editingMessage && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse overflow-hidden">
            <Reply className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="border-r-2 border-emerald-500 pr-2 truncate">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                پاسخ به{" "}
                {replyingTo.senderName ||
                  (replyingTo.isOutgoing ? "شما" : "کاربر")}
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-md">
                {replyingTo.text}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancelAction}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input or Restricted Banner */}
      {isBlocked ? (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 text-center text-rose-500 dark:text-rose-400 text-sm font-medium border-t border-gray-200 dark:border-gray-700">
          این کاربر مسدود شده است. امکان ارسال پیام وجود ندارد.
        </div>
      ) : isChannel && !canPostInChannel ? (
        <div className="p-4 bg-gray-100 dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center space-x-2 space-x-reverse text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium select-none">
          <Lock className="w-4 h-4 text-gray-400" />
          <span>فقط مدیران می‌توانند در این کانال پیام ارسال کنند.</span>
        </div>
      ) : (
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-800 flex items-center space-x-2 space-x-reverse"
        >
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={
              editingMessage ? "ویرایش پیام..." : "پیام خود را بنویسید..."
            }
            className="flex-1 bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 px-4 py-2.5 rounded-full text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-gray-400"
          />

          {editingMessage ? (
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors shadow-sm disabled:opacity-50"
              title="ذخیره ویرایش"
            >
              <Check className="w-5 h-5" />
            </button>
          ) : messageText.trim() ? (
            <button
              type="submit"
              className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors shadow-sm"
              title="ارسال"
            >
              <Send className="w-5 h-5 transform -rotate-90" />
            </button>
          ) : (
            <button
              type="button"
              className="p-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
      )}

      {/* Context menu */}
      {contextMenu && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          message={contextMenu.message}
          onClose={closeContextMenu}
          onReply={() => handleReplyMessage(contextMenu.message)}
          onEdit={() => handleEditMessage(contextMenu.message)}
          onDelete={() => handleDeleteMessage(contextMenu.message)}
          onForward={() => handleForwardMessage(contextMenu.message)}
        />
      )}

      {/* Forward Modal */}
      <ForwardModal
        isOpen={Boolean(forwardingMessage)}
        message={forwardingMessage}
        currentChatTitle={activeConversation?.title}
        onClose={() => setForwardingMessage(null)}
      />
    </div>
  );
};
