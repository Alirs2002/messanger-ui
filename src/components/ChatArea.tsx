import React, { useState, useRef, useEffect } from "react";
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  X,
  Reply,
  MessageSquare,
  Check,
  Edit2,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import MessageBubble from "./MessageBubble";
import { MessageContextMenu } from "./MessageContextMenu";
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
  } = useChatStore();

  const [messageText, setMessageText] = useState("");
  const [editingMessage, setEditingMessage] = useState<MessageItem | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: MessageItem;
  } | null>(null);

  const activeConversation = conversations.find(
    (c) => String(c.id) === String(activeConversationId)
  );

  const currentMessages = activeConversationId
    ? messages[activeConversationId] || []
    : [];

  // اسکرول خودکار به آخرین پیام در صورت نبودن در حالت ویرایش
  useEffect(() => {
    if (!editingMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages, editingMessage]);

  // فوکوس روی اینپوت هنگام فعال شدن حالت ویرایش
  useEffect(() => {
    if (editingMessage) {
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  // اسکرول نرم به پیام مرجع ریپلای و های‌لایت کردن آن
  const handleScrollToMessage = (messageId: string | number) => {
    const targetElement = document.getElementById(`message-${messageId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });

      targetElement.classList.add(
        "bg-amber-100/60",
        "dark:bg-amber-900/30",
        "p-1",
        "rounded-2xl"
      );
      setTimeout(() => {
        targetElement.classList.remove(
          "bg-amber-100/60",
          "dark:bg-amber-900/30",
          "p-1",
          "rounded-2xl"
        );
      }, 1200);
    }
  };

  // مدیریت منوی راست‌کلیک
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
    setReplyingTo(null);
    setEditingMessage(message);
    setMessageText(message.text);
    inputRef.current?.focus();
    closeContextMenu();
  };

  const handleDeleteMessage = (message: MessageItem) => {
    if (activeConversationId) {
      deleteMessage(activeConversationId, message.id);
    }
    closeContextMenu();
  };

  // لغو حالت ویرایش یا ریپلای
  const handleCancelAction = () => {
    setEditingMessage(null);
    setReplyingTo(null);
    setMessageText("");
  };

  // ارسال پیام یا ذخیره ویرایش
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;

    if (editingMessage) {
      editMessage(activeConversation.id, editingMessage.id, messageText.trim());
      setEditingMessage(null);
      setMessageText("");
    } else {
      sendMessage(activeConversation.id, messageText.trim());
      setMessageText("");
    }
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
      {/* هدر چت */}
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
              {activeConversation.isOnline ? "آنلاین" : "آخرین بازدید اخیراً"}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1 space-x-reverse text-gray-500 dark:text-gray-400">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* لیست پیام‌ها */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentMessages.map((msg) => (
          <div
            key={msg.id}
            onContextMenu={(e) => handleContextMenu(e, msg)}
          >
            <MessageBubble
              message={msg}
              onReplyClick={handleScrollToMessage}
            />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* نوار وضعیت ویرایش پیام */}
      {editingMessage && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between transition-all">
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
            type="button"
            onClick={handleCancelAction}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* نوار پیش‌نمایش ریپلای (در صورتی که در حالت ویرایش نباشیم) */}
      {replyingTo && !editingMessage && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between transition-all">
          <div className="flex items-center space-x-3 space-x-reverse overflow-hidden">
            <Reply className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="border-r-2 border-emerald-500 pr-2 truncate">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                پاسخ به {replyingTo.senderName || (replyingTo.isOutgoing ? "شما" : "کاربر")}
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-md">
                {replyingTo.text}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelAction}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* فرم ارسال یا ویرایش پیام */}
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
          placeholder={editingMessage ? "ویرایش پیام..." : "پیام خود را بنویسید..."}
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

      {/* منوی کلیک راست */}
      {contextMenu && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          message={contextMenu.message}
          onClose={closeContextMenu}
          onReply={() => handleReplyMessage(contextMenu.message)}
          onEdit={() => handleEditMessage(contextMenu.message)}
          onDelete={() => handleDeleteMessage(contextMenu.message)}
        />
      )}
    </div>
  );
};
