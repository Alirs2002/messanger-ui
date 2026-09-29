import React from "react";
import { Check, CheckCheck, Clock } from "lucide-react";
import type { MessageItem } from "../types/chat";

interface MessageBubbleProps {
  message: MessageItem;
  onReplyClick?: (replyMessageId: string | number) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onReplyClick,
}) => {
  const { isOutgoing, text, createdAt, status, replyToMessage, senderName } =
    message;

  return (
    <div
      id={`message-${message.id}`}
      className={`flex w-full transition-all duration-500 rounded-2xl ${
        isOutgoing ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`relative max-w-[80%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl px-3.5 py-2 text-sm shadow-sm transition-all ${
          isOutgoing
            ? "bg-emerald-600 text-white rounded-bl-none"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-br-none border border-gray-100 dark:border-gray-700/60"
        }`}
      >
        {/* نام فرستنده در چت‌های گروهی اگر پیام دریافتی باشد */}
        {!isOutgoing && senderName && (
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
                isOutgoing ? "text-emerald-100" : "text-emerald-600 dark:text-emerald-400"
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
          className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
            isOutgoing ? "text-emerald-100/80" : "text-gray-400"
          }`}
        >
          <span>{createdAt}</span>

          {isOutgoing && (
            <span className="inline-flex items-center">
              {status === "read" && (
                <CheckCheck className="w-3.5 h-3.5 text-white" />
              )}
              {status === "delivered" && (
                <CheckCheck className="w-3.5 h-3.5 opacity-80" />
              )}
              {status === "sent" && (
                <Check className="w-3.5 h-3.5 opacity-80" />
              )}
              {status === "sending" && (
                <Clock className="w-3 h-3 opacity-80 animate-pulse" />
              )}
              {!status && <Check className="w-3.5 h-3.5 opacity-80" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
