import React, { useEffect, useRef } from "react";
import {
  User,
  Pin,
  PinOff,
  Volume2,
  VolumeX,
  CheckCheck,
  MessageSquare,
  Eraser,
  Trash2,
} from "lucide-react";
import type { ConversationItem } from "../types/chat";

interface ConversationContextMenuProps {
  x: number;
  y: number;
  conversation: ConversationItem;
  onClose: () => void;
  onViewProfile?: (conversation: ConversationItem) => void;
  onTogglePin?: (conversation: ConversationItem) => void;
  onToggleMute?: (conversation: ConversationItem) => void;
  onToggleUnread?: (conversation: ConversationItem) => void;
  onClearHistory?: (conversation: ConversationItem) => void;
  onDelete?: (conversation: ConversationItem) => void;
}

export const ConversationContextMenu: React.FC<
  ConversationContextMenuProps
> = ({
  x,
  y,
  conversation,
  onClose,
  onViewProfile,
  onTogglePin,
  onToggleMute,
  onToggleUnread,
  onClearHistory,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

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

  // جلوگیری از خروج منو از صفحه
  const menuWidth = 190;
  const menuHeight = 260;
  const adjustedX =
    x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : x;
  const adjustedY =
    y + menuHeight > window.innerHeight
      ? window.innerHeight - menuHeight - 10
      : y;

  const handleAction = (callback?: (conv: ConversationItem) => void) => {
    if (callback) {
      callback(conversation);
    }
    onClose();
  };

  const isUnread = (conversation.unreadCount ?? 0) > 0;

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-48 rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700/80 p-1 text-sm text-gray-700 dark:text-gray-200 select-none animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-100 dark:divide-gray-700/50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-0.5">
        {/* مشاهده مشخصات / پروفایل */}
        {onViewProfile && (
          <button
            onClick={() => handleAction(onViewProfile)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition text-right"
          >
            <span>مشاهده مشخصات</span>
            <User className="w-4 h-4 text-emerald-500" />
          </button>
        )}

        {/* پین / برداشتن پین */}
        {onTogglePin && (
          <button
            onClick={() => handleAction(onTogglePin)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition text-right"
          >
            <span>
              {conversation.isPinned ? "برداشتن سنجاق" : "سنجاق کردن"}
            </span>
            {conversation.isPinned ? (
              <PinOff className="w-4 h-4 text-gray-400" />
            ) : (
              <Pin className="w-4 h-4 text-emerald-500" />
            )}
          </button>
        )}

        {/* بی‌صدا / صدادار کردن */}
        {onToggleMute && (
          <button
            onClick={() => handleAction(onToggleMute)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition text-right"
          >
            <span>
              {conversation.isMuted ? "فعال کردن صدا" : "بی‌صدا کردن"}
            </span>
            {conversation.isMuted ? (
              <Volume2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}

        {/* خوانده / خوانده‌نشده */}
        {onToggleUnread && (
          <button
            onClick={() => handleAction(onToggleUnread)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition text-right"
          >
            <span>
              {isUnread
                ? "علامت به عنوان خوانده‌شده"
                : "علامت به عنوان خوانده‌نشده"}
            </span>
            {isUnread ? (
              <CheckCheck className="w-4 h-4 text-emerald-500" />
            ) : (
              <MessageSquare className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}
      </div>

      <div className="py-0.5">
        {/* پاکسازی تاریخچه پیام‌ها */}
        {onClearHistory && (
          <button
            onClick={() => handleAction(onClearHistory)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition text-right text-amber-600 dark:text-amber-400"
          >
            <span>پاکسازی گفتگو</span>
            <Eraser className="w-4 h-4 opacity-80" />
          </button>
        )}

        {/* حذف گفتگو */}
        {onDelete && (
          <button
            onClick={() => handleAction(onDelete)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition text-right"
          >
            <span>حذف گفتگو</span>
            <Trash2 className="w-4 h-4 opacity-80" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ConversationContextMenu;
