import React, { useEffect, useRef, useState } from "react";
import type { MessageItem } from "../types/chat"; // اگر مسیر تایپ‌ها متفاوت است اصلاح کنید

interface MessageContextMenuProps {
  x: number;
  y: number;
  message: MessageItem;
  onClose: () => void;
  onReply: (message: MessageItem) => void;
  onEdit?: (message: MessageItem) => void;
  onDelete?: (messageId: string | number) => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  x,
  y,
  message,
  onClose,
  onReply,
  onEdit,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // بستن منو با کلیک بیرون، اسکرول یا زدن Esc
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

  // جلوگیری از بیرون زدن منو از کادر مانیتور
  const menuWidth = 160;
  const menuHeight = 180;
  const adjustedX = x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : x;
  const adjustedY = y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : y;

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-40 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 p-1 text-sm text-gray-700 dark:text-gray-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* دکمه پاسخ */}
      <button
        onClick={() => {
          onReply(message);
          onClose();
        }}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        <span>پاسخ</span>
        <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
      </button>

      {/* دکمه کپی */}
      {message.text && (
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <span>{copied ? "کپی شد" : "کپی متن"}</span>
          <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        </button>
      )}

      {/* دکمه ویرایش (فقط پیام‌های ارسالی) */}
      {message.isOutgoing && onEdit && (
        <button
          onClick={() => {
            onEdit(message);
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <span>ویرایش</span>
          <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        </button>
      )}

      <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

      {/* دکمه حذف */}
      {onDelete && (
        <button
          onClick={() => {
            onDelete(message.id);
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 dark:hover:bg-red-900/30 dark:text-red-400 transition"
        >
          <span>حذف پیام</span>
          <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      )}
    </div>
  );
};
