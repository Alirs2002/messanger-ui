import React, { useState, useRef, useEffect } from "react";
import { MessageContextMenu } from "./MessageContextMenu";
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Check,
  CheckCheck,
  ArrowRight,
  Reply,
  X,
  Trash2,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";

export const ChatArea: React.FC = () => {
  // متغیرهای استور (بدون فیلدهای اضافی reply)
  const {
    activeConversationId,
    setActiveConversation,
    conversations,
    messages,
    sendMessage,
    deleteMessage,
  } = useChatStore();

  // استیت‌های محلی برای ورودی و ریپلای
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<any | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    message: any;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    message: null,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // استیت‌های مودال حذف
  const [deleteModalMsg, setDeleteModalMsg] = useState<any | null>(null);
  const [deleteForAll, setDeleteForAll] = useState(false);

  // اطلاعات گفتگوی فعال
  const activeChat = conversations.find((c) => c.id === activeConversationId);
  const isChannel = activeChat?.type?.toUpperCase() === "CHANNEL";
  const isGroup = activeChat?.type?.toUpperCase() === "GROUP";

  // لایه کنترل دسترسی (Permission Layer)
  const isAdmin = false;

  const canWriteMessage = !isChannel || isAdmin;
  const canDeleteMessage = !isChannel || isAdmin;

  const currentMessages = activeConversationId
    ? messages[activeConversationId] || []
    : [];

  // اسکرول خودکار به آخرین پیام
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // فوکوس روی اینپوت بعد از کلیک روی ریپلای
  useEffect(() => {
    if (replyingTo && canWriteMessage) {
      inputRef.current?.focus();
    }
  }, [replyingTo, canWriteMessage]);

  const handleContextMenu = (e: React.MouseEvent, message: any) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      message,
    });
  };

  // اسکرول به پیام ریپلای‌شده و هایلایت موقت
  const scrollToMessage = (messageId: string | number) => {
    const targetElement = document.getElementById(`message-${messageId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      targetElement.classList.add("bg-emerald-100/70", "transition-colors", "duration-500");
      setTimeout(() => {
        targetElement.classList.remove("bg-emerald-100/70");
      }, 1200);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversationId || !canWriteMessage) return;

    sendMessage(activeConversationId, inputText.trim());
    setInputText("");
    setReplyingTo(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteModalMsg || !activeConversationId) return;

    if (typeof deleteMessage === "function") {
      deleteMessage(activeConversationId, deleteModalMsg.id);
    }

    setDeleteModalMsg(null);
    setDeleteForAll(false);
  };

  if (!activeConversationId) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-4">
        <div className="w-16 h-16 rounded-full bg-slate-200/60 flex items-center justify-center mb-3">
          <Send className="w-7 h-7 text-slate-400 -rotate-45 ml-1" />
        </div>
        <p className="text-sm font-medium">
          یک گفتگو را برای مشاهده و ارسال پیام انتخاب کنید
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-screen bg-[#f0f2f5] relative select-none">
      {/* هدر */}
      <header className="h-16 px-4 bg-white border-b border-slate-200 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveConversation(null);
              setReplyingTo(null);
            }}
            className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {activeChat?.title?.charAt(0) || "چ"}
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {activeChat?.title || `گفتگو (${activeConversationId})`}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          {!isChannel && (
            <button className="p-2 hover:bg-slate-100 rounded-xl transition">
              <Phone className="w-5 h-5" />
            </button>
          )}
          <button className="p-2 hover:bg-slate-100 rounded-xl transition">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* لیست پیام‌ها */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {Array.isArray(currentMessages) &&
          currentMessages.map((msg: any) => (
            <div
              key={msg.id}
              id={`message-${msg.id}`}
              onContextMenu={(e) => handleContextMenu(e, msg)}
              className={`group flex items-end gap-1.5 transition-colors duration-300 rounded-xl p-1 ${
                msg.isOutgoing ? "justify-end" : "justify-start"
              }`}
            >
              {/* دکمه ریپلای پیام‌های خودمان */}
              {msg.isOutgoing && canWriteMessage && (
                <button
                  type="button"
                  onClick={() => setReplyingTo(msg)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-200/60 rounded-full"
                  title="پاسخ"
                >
                  <Reply className="w-4 h-4" />
                </button>
              )}

              <div
                className={`max-w-[75%] sm:max-w-md px-3.5 py-2.5 rounded-2xl shadow-xs text-sm relative leading-relaxed ${
                  msg.isOutgoing
                    ? "bg-emerald-600 text-white rounded-bl-xs"
                    : "bg-white text-slate-800 border border-slate-100 rounded-br-xs"
                }`}
              >
                {!msg.isOutgoing && msg.senderName && !isChannel && (
                  <span className="block text-xs font-bold text-emerald-700 mb-1">
                    {msg.senderName}
                  </span>
                )}

                {/* نمایش باکس نقل‌قول در صورت ریپلای بودن */}
                {msg.replyToMessage && (
                  <div
                    onClick={() => scrollToMessage(msg.replyToMessage.id)}
                    className={`mb-2 p-1.5 px-2.5 rounded-lg border-r-3 text-xs cursor-pointer transition ${
                      msg.isOutgoing
                        ? "bg-emerald-700/50 border-emerald-300 text-emerald-50 hover:bg-emerald-700/70"
                        : "bg-slate-100 border-emerald-500 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span className="font-semibold block text-[11px] mb-0.5">
                      {msg.replyToMessage.senderName || "پیام"}
                    </span>
                    <p className="line-clamp-1 italic text-[11px] opacity-80">
                      {msg.replyToMessage.text}
                    </p>
                  </div>
                )}

                <p className="whitespace-pre-wrap select-text break-words">
                  {msg.text}
                </p>

                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                    msg.isOutgoing ? "text-emerald-100" : "text-slate-400"
                  }`}
                >
                  <span>{msg.createdAt}</span>
                  {msg.isOutgoing && (
                    <span>
                      {msg.status === "read" ? (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-200 inline" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-white inline" />
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* دکمه ریپلای پیام‌های مخاطب */}
              {!msg.isOutgoing && canWriteMessage && (
                <button
                  type="button"
                  onClick={() => setReplyingTo(msg)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-200/60 rounded-full"
                  title="پاسخ"
                >
                  <Reply className="w-4 h-4 scale-x-[-1]" />
                </button>
              )}
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      {/* بخش پایین صفحه (فوتر) */}
      {!canWriteMessage ? (
        <footer className="p-3.5 bg-white border-t border-slate-200 flex justify-center items-center shrink-0">
          <p className="text-xs sm:text-sm text-slate-500 font-medium py-1">
            فقط مدیران امکان ارسال پیام در این کانال را دارند.
          </p>
        </footer>
      ) : (
        <footer className="bg-white border-t border-slate-200 shrink-0">
          {/* نوار ریپلای بالای اینپوت */}
          {replyingTo && (
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200/80 transition-all">
              <div className="flex items-center gap-2 overflow-hidden border-r-2 border-emerald-500 pr-2">
                <Reply className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex flex-col text-xs overflow-hidden">
                  <span className="font-semibold text-emerald-700">
                    پاسخ به{" "}
                    {replyingTo.isOutgoing
                      ? "خودتان"
                      : replyingTo.senderName || "پیام"}
                  </span>
                  <span className="text-slate-500 truncate max-w-xs sm:max-w-md md:max-w-xl">
                    {replyingTo.text}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
                title="لغو پاسخ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="p-3 flex items-center gap-2 max-w-4xl mx-auto"
          >
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              placeholder="پیام خود را بنویسید..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-100 focus:bg-white text-slate-800 text-sm py-2 px-4 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-xl transition shadow-sm ${
                inputText.trim()
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4 -rotate-90" />
            </button>
          </form>
        </footer>
      )}

      {/* منوی کلیک راست */}
      {contextMenu.isOpen && contextMenu.message && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          message={contextMenu.message}
          onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
          onReply={canWriteMessage ? (msg) => setReplyingTo(msg) : undefined}
          onDelete={
            canDeleteMessage
              ? (msg) => {
                  setDeleteModalMsg(msg);
                  setDeleteForAll(false);
                }
              : undefined
          }
        />
      )}

      {/* مودال حذف */}
      {deleteModalMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">حذف پیام</h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              آیا از حذف این پیام اطمینان دارید؟
            </p>

            {isChannel ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200/60">
                توجه: این پیام از کانال برای تمام دنبال‌کنندگان حذف خواهد شد.
              </p>
            ) : isGroup ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200/60">
                توجه: این پیام برای تمام اعضای گروه حذف خواهد شد.
              </p>
            ) : deleteModalMsg.isOutgoing ? (
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={deleteForAll}
                  onChange={(e) => setDeleteForAll(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-slate-700 font-medium">
                  حذف برای طرف مقابل هم انجام شود
                </span>
              </label>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalMsg(null);
                  setDeleteForAll(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition"
              >
                حذف پیام
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
