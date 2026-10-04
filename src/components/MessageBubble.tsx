import React from "react";
import { Check, CheckCheck, Clock, Forward, Share2 } from "lucide-react";
import type { MessageItem } from "../types/chat";

interface MessageBubbleProps {
  message: MessageItem;
  onReplyClick?: (replyMessageId: string | number) => void;
  isChannel?: boolean;
  onForwardClick?: (message: MessageItem) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onReplyClick,
  isChannel,
  onForwardClick,
}) => {
  const {
    isOutgoing,
    text,
    createdAt,
    status,
    replyToMessage,
    senderName,
    forwardFrom,
  } = message;

  return (
    <div
      id={`message-${message.id}`}
      className={`flex w-full gap-2 transition-all duration-500 items-end ${
        isOutgoing ? "justify-start" : "justify-end"
      }`}
    >
      {/* دکمه بازارسال برای پیام‌های ارسالی کانال */}
      {isOutgoing && isChannel && onForwardClick && (
        <button
          onClick={() => onForwardClick(message)}
          title="بازارسال سریع"
          className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded-full transition mb-0.5"
        >
          <Share2 className="w-4 h-4 transform -scale-x-100" />
        </button>
      )}

      {/* حباب پیام */}
      <div
        className={`relative max-w-[80%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl px-3.5 py-2 text-sm shadow-sm transition-all ${
          isOutgoing
            ? "bg-emerald-600 text-white rounded-bl-none"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-br-none border border-gray-100 dark:border-gray-700/60"
        }`}
      >
        {/* نمایش تگ بازارسال (فوروارد) */}
        {(forwardFrom as any) && (
          <div className="flex items-center space-x-1 space-x-reverse text-[11px] font-medium mb-1.5 pb-1 border-b border-black/10 dark:border-white/10 opacity-90">
            <Forward className="w-3 h-3" />
            <span>بازارسال از:</span>
            <span className="font-semibold cursor-pointer truncate max-w-[120px]">
              {(forwardFrom as any).chatTitle || (forwardFrom as any).name}
            </span>
          </div>
        )}

        {/* نام فرستنده در چت‌های گروهی اگر پیام دریافتی باشد */}
        {!isOutgoing && senderName && !(forwardFrom as any) && (
          <span className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            {senderName}
          </span>
        )}

        {/* باکس نمایش ریپلای (قابل کلیک) */}
        {replyToMessage && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (replyToMessage.id && onReplyClick) {
                onReplyClick(replyToMessage.id);
              }
            }}
            className={`mb-2 p-2 rounded-lg border-r-2 text-xs leading-tight cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all ${
              isOutgoing
                ? "bg-black/15 border-white text-white/90 hover:bg-black/25"
                : "bg-gray-100 dark:bg-gray-700/50 border-emerald-500 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <span
              className={`font-semibold block text-[11px] mb-0.5 ${
                isOutgoing
                  ? "text-emerald-100"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              پاسخ به{" "}
              {replyToMessage.senderName ||
                (replyToMessage.isOutgoing ? "شما" : "کاربر")}
            </span>
            <p className="truncate opacity-80">{replyToMessage.text}</p>
          </div>
        )}

        {/* متن پیام */}
        <p className="whitespace-pre-wrap break-words leading-relaxed text-[13.5px]">
          {text}
        </p>

        {/* زمان ارسال و آیکون وضعیت */}
        <div
          className={`flex items-center gap-1 mt-1 text-xs ${
            message.isOutgoing
              ? "justify-end text-white/70"
              : "justify-start text-gray-400"
          }`}
        >
          {message.createdAt && <span>{message.createdAt}</span>}
          {message.isOutgoing && (
            <>
              {message.status === "read" && <CheckCheck size={14} />}
              {message.status === "delivered" && (
                <CheckCheck size={14} className="opacity-50" />
              )}
              {message.status === "sent" && <Check size={14} />}
              {message.status === "sending" && (
                <Clock size={14} className="animate-pulse" />
              )}
              {!message.status && <Check size={14} />}
            </>
          )}
        </div>
      </div>

      {/* دکمه بازارسال برای پیام‌های دریافتی کانال */}
      {!isOutgoing && isChannel && onForwardClick && (
        <button
          onClick={() => onForwardClick(message)}
          title="بازارسال سریع"
          className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded-full transition mb-0.5"
        >
          <Share2 className="w-4 h-4 transform -scale-x-100" />
        </button>
      )}
    </div>
  );
};

export default MessageBubble;
