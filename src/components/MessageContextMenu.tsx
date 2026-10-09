import React, { useEffect, useRef, useState } from "react";
import { Reply, Forward, Copy, Check, Edit3, Trash2 } from "lucide-react";
import type { MessageItem } from "../types/chat";
import { useChatStore } from "../store/useChatStore";

interface MessageContextMenuProps {
  x: number;
  y: number;
  message: MessageItem;
  onClose: () => void;
  onReply?: (message: MessageItem) => void;
  onEdit?: (message: MessageItem) => void; // این پراپ را نگه داشتیم تا ساختار نشکند، اما کار اصلی را Store انجام می‌دهد
  onDelete?: (message: MessageItem) => void;
  onForward?: (message: MessageItem) => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  x,
  y,
  message,
  onClose,
  onReply,
  onDelete,
  onForward,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const setMessageToEdit = useChatStore((state) => state.setMessageToEdit);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", onClose, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  // تنظیم موقعیت منو جهت جلوگیری از بیرون‌زدگی از لبه‌های صفحه
  const menuWidth = 165;
  // یک تخمین ارتفاع بر اساس تعداد آپشن‌هایی که فعال خواهند بود:
  const baseHeight = 130;
  const extraHeight = (message.isOutgoing ? 40 : 0) + (onDelete ? 45 : 0);
  const menuHeight = baseHeight + extraHeight;

  const adjustedX =
    x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 12 : x;
  const adjustedY =
    y + menuHeight > window.innerHeight
      ? window.innerHeight - menuHeight - 12
      : y;

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 800);
    }
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-40 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700/80 p-1 text-sm text-gray-700 dark:text-gray-200 select-none animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* پاسخ دادن */}
      {onReply && (
        <button
          onClick={() => {
            onReply(message);
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition"
        >
          <span>پاسخ</span>
          <Reply className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      )}

      {/* بازارسال (Forward) */}
      {onForward && (
        <button
          onClick={() => {
            onForward(message);
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition"
        >
          <span>بازارسال</span>
          <Forward className="w-4 h-4 text-sky-500" />
        </button>
      )}

      {/* کپی متن */}
      {message.text && (
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition"
        >
          <span>{copied ? "کپی شد" : "کپی متن"}</span>
          {copied ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
        </button>
      )}

      {/* ویرایش (فقط پیام‌های ارسال‌شده توسط کاربر جاری) */}
      {message.isOutgoing && (
        <button
          onClick={() => {
            setMessageToEdit(message); // پیام در استیت ثبت می‌شود
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition"
        >
          <span>ویرایش</span>
          <Edit3 className="w-4 h-4 text-amber-500" />
        </button>
      )}

      {/* خط جداکننده قبل از حذف */}
      {onDelete && (
        <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
      )}

      {/* حذف پیام */}
      {onDelete && (
        <button
          onClick={() => {
            onDelete(message);
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition"
        >
          <span>حذف پیام</span>
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
