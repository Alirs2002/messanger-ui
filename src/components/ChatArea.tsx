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
  ChevronDown,
  ArrowRight,
  User,
  Info
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import MessageBubble from "./MessageBubble";
import { MessageContextMenu } from "./MessageContextMenu";
import { ChatHeaderMenu, type ChatType } from "./ChatHeaderMenu";
import { ForwardModal } from "./ForwardModal";
import { EmojiPicker } from "./EmojiPicker";
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
    leaveConversation,
    clearChat,
    toggleMuteConversation,
    markAsRead,
  } = useChatStore();

  const [messageText, setMessageText] = useState("");
  const [editingMessage, setEditingMessage] = useState<MessageItem | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<MessageItem | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // استیت‌های مربوط به ویژگی‌های جدید
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
    (c) => String(c.id) === String(activeConversationId),
  );

  const currentMessages: MessageItem[] = activeConversationId
    ? messages[activeConversationId] ||
      messages[String(activeConversationId)] ||
      []
    : [];

  // فیلتر کردن پیام‌ها بر اساس جستجو
  const displayedMessages = (isSearching && searchQuery.trim())
    ? currentMessages.filter((msg) =>
        msg.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentMessages;

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

  // لغو جستجو هنگام تغییر چت
  useEffect(() => {
    setIsSearching(false);
    setSearchQuery("");
  }, [activeConversationId]);

  // فوکوس روی اینپوت سرچ وقتی جستجو فعال میشه
  useEffect(() => {
    if (isSearching) {
      searchInputRef.current?.focus();
    }
  }, [isSearching]);

  useEffect(() => {
    if (editingMessage || !activeConversation) return;

    const timer = setTimeout(() => {
      const container = messagesContainerRef.current;
      if (!container) return;

      const unread = activeConversation.unreadCount ?? 0;
      const isScrollable = container.scrollHeight > container.clientHeight + 40;

      if (unread > 0 && isScrollable) {
        container.scrollTop = 0;
        setShowScrollBottom(true);
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        setShowScrollBottom(false);

        if (unread > 0) {
          markAsRead(activeConversation.id);
        }
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [activeConversationId, markAsRead]);

  const handleScroll = () => {
    if (!messagesContainerRef.current || !activeConversation) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom > 100) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
      if ((activeConversation.unreadCount ?? 0) > 0 && distanceFromBottom <= 40) {
        markAsRead(activeConversation.id);
      }
    }
  };

  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (activeConversation && (activeConversation.unreadCount ?? 0) > 0) {
      markAsRead(activeConversation.id);
    }
    setShowScrollBottom(false);
  };

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
    setContextMenu({ x: e.clientX, y: e.clientY, message });
  };

  const closeContextMenu = () => setContextMenu(null);

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

  const handleSelectEmoji = (emoji: string) => {
    if (inputRef.current) {
      const input = inputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newText = messageText.substring(0, start) + emoji + messageText.substring(end);
      setMessageText(newText);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setMessageText((prev) => prev + emoji);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;
    if (isChannel && !canPostInChannel) return;

    if (editingMessage) {
      editMessage(activeConversation.id, editingMessage.id, messageText.trim());
      setEditingMessage(null);
    } else {
      sendMessage(activeConversation.id, messageText.trim());
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
      
      {/* هدر چت (نرمال یا در حال جستجو) */}
      {isSearching ? (
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center gap-3 bg-white dark:bg-gray-800 shadow-sm z-10">
          <button
            onClick={() => { setIsSearching(false); setSearchQuery(""); }}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="بازگشت"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در این گفتگو..."
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-full outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
          />
        </div>
      ) : (
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between bg-white dark:bg-gray-800 shadow-sm z-10">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-1.5 -ml-1.5 rounded-xl transition-colors"
            onClick={() => setShowProfileModal(true)}
            title="مشاهده پروفایل"
          >
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
                  isBlocked ? <span className="text-rose-500">مسدود شده</span> : 
                  activeConversation.isOnline ? <span className="text-emerald-500 font-medium">آنلاین</span> : "آخرین بازدید اخیراً"
                ) : currentChatType === "group" ? "گروه" : "کانال"}
              </span>
            </div>
          </div>

          <ChatHeaderMenu
            chatType={currentChatType}
            isMuted={isMuted}
            isBlocked={isBlocked}
            onMuteToggle={() => toggleMuteConversation(activeConversation.id)}
            onBlockToggle={() => setIsBlocked(!isBlocked)}
            onSearch={() => setIsSearching(true)}
            onReport={() => alert("گزارش تخلف ثبت گردید.")}
            onInfo={() => setShowProfileModal(true)}
            onClearChat={() => {
              if (window.confirm("از پاکسازی پیام‌ها اطمینان دارید؟")) clearChat(activeConversation.id);
            }}
            onLeave={() => leaveConversation(activeConversation.id)}
            onSelectMessages={() => alert("انتخاب پیام‌ها")}
          />
        </div>
      )}

      {/* لیست پیام‌ها */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {displayedMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
             <MessageSquare className="w-10 h-10 opacity-30" />
             <span className="text-sm">
               {isSearching ? "پیامی یافت نشد." : "پیامی در این گفتگو وجود ندارد."}
             </span>
          </div>
        ) : (
          displayedMessages.map((msg) => (
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

      {/* ... سایر بخش‌ها مثل دکمه اسکرول، فرم ارسال و غیره دست نخورده باقی می‌ماند ... */}
      
      {/* دکمه شناور اسکرول به پایین */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={handleScrollToBottom}
          className={`absolute left-6 z-20 w-11 h-11 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-200 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none group hover:scale-105 active:scale-95 ${
            replyingTo || editingMessage ? "bottom-32" : "bottom-20"
          }`}
        >
          <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* فرم ورودی پیام */}
      {isBlocked ? (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 text-center text-rose-500 dark:text-rose-400 text-sm font-medium border-t border-gray-200 dark:border-gray-700">
          این کاربر مسدود شده است.
        </div>
      ) : isChannel && !canPostInChannel ? (
        <div className="p-4 bg-gray-100 dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">
          <Lock className="w-4 h-4 text-gray-400" />
          <span>فقط مدیران می‌توانند در این کانال پیام ارسال کنند.</span>
        </div>
      ) : (
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 relative"
        >
          <button type="button" onClick={() => setShowEmojiPicker((prev) => !prev)} className="w-10 h-10 flex items-center justify-center shrink-0 text-gray-500 hover:text-gray-700 rounded-full"><Smile className="w-5 h-5" /></button>
          <button type="button" className="w-10 h-10 flex items-center justify-center shrink-0 text-gray-500 hover:text-gray-700 rounded-full"><Paperclip className="w-5 h-5" /></button>
          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={editingMessage ? "ویرایش پیام..." : "پیام خود را بنویسید..."}
            className="flex-1 min-w-0 bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 px-4 py-2.5 rounded-full text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-gray-400"
          />
          {editingMessage ? (
            <button type="submit" disabled={!messageText.trim()} className="w-10 h-10 flex items-center justify-center shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"><Check className="w-5 h-5" /></button>
          ) : messageText.trim() ? (
            <button type="submit" className="w-10 h-10 flex items-center justify-center shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"><Send className="w-5 h-5 transform -rotate-90" /></button>
          ) : (
            <button type="button" className="w-10 h-10 flex items-center justify-center shrink-0 text-gray-500 hover:text-gray-700 rounded-full"><Mic className="w-5 h-5" /></button>
          )}
        </form>
      )}

      <EmojiPicker isOpen={showEmojiPicker} onClose={() => setShowEmojiPicker(false)} onSelectEmoji={handleSelectEmoji} />

      {/* مودال پروفایل کاربر / گروه */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="h-24 bg-emerald-500 dark:bg-emerald-600"></div>
            <button 
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 left-4 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="px-6 pb-6 relative -mt-12">
              <div className="w-24 h-24 mx-auto bg-emerald-100 dark:bg-emerald-900 border-4 border-white dark:border-gray-800 rounded-full flex items-center justify-center text-4xl font-bold text-emerald-600 dark:text-emerald-400 shadow-md">
                {activeConversation.title.charAt(0)}
              </div>
              
              <div className="text-center mt-4 space-y-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeConversation.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentChatType === "pv" ? "مخاطب" : currentChatType === "group" ? "گروه" : "کانال"}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                   <Info className="w-5 h-5 text-gray-400" />
                   <div>
                     <p className="text-xs text-gray-500 dark:text-gray-400">توضیحات / درباره</p>
                     <p className="text-sm text-gray-800 dark:text-gray-200">لورم ایپسوم متن ساختگی با تولید سادگی...</p>
                   </div>
                </div>
                {currentChatType === "pv" && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">نام کاربری</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">@user_name</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* منوی کلیک راست پیام‌ها */}
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

      {/* مودال فوروارد */}
      <ForwardModal
        isOpen={Boolean(forwardingMessage)}
        message={forwardingMessage}
        currentChatTitle={activeConversation?.title}
        onClose={() => setForwardingMessage(null)}
      />
    </div>
  );
};
