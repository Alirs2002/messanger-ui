import React, { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Search,
  VolumeX,
  Volume2,
  AlertCircle,
  Users,
  Eraser,
  LogOut,
  CheckSquare,
  Ban,
  Trash2,
} from "lucide-react";

export type ChatType = "pv" | "group" | "channel";

export interface ChatHeaderMenuProps {
  chatType?: ChatType;
  isMuted?: boolean;
  isBlocked?: boolean;
  onSearch?: () => void;
  onMuteToggle?: () => void;
  onBlockToggle?: () => void;
  onReport?: () => void;
  onInfo?: () => void;
  onClearChat?: () => void;
  onDeleteChat?: () => void;
  onLeave?: () => void;
  onSelectMessages?: () => void;
}

export const ChatHeaderMenu: React.FC<ChatHeaderMenuProps> = ({
  chatType = "pv",
  isMuted = false,
  isBlocked = false,
  onSearch,
  onMuteToggle,
  onBlockToggle,
  onReport,
  onInfo,
  onClearChat,
  onDeleteChat,
  onLeave,
  onSelectMessages,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // بستن منو با کلیک در بیرون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action?: () => void) => {
    if (action) action();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-right" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700/40 transition-colors"
        aria-label="گزینه‌ها"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-100 dark:divide-gray-700/40 select-none">
          {/* حالت گروه */}
          {chatType === "group" ? (
            <div className="py-1">
              <button
                type="button"
                onClick={() => handleAction(onInfo)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              >
                <span>اطلاعات گروه</span>
                <Users className="w-4 h-4 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => handleAction(onMuteToggle)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              >
                <span>{isMuted ? "دریافت اعلان" : "عدم دریافت اعلان"}</span>
                {isMuted ? (
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleAction(onClearChat)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              >
                <span>پاکسازی گفتگو</span>
                <Eraser className="w-4 h-4 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => handleAction(onLeave)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <span>ترک گروه</span>
                <LogOut className="w-4 h-4 text-rose-500" />
              </button>

              <button
                type="button"
                onClick={() => handleAction(onSelectMessages)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              >
                <span>انتخاب</span>
                <CheckSquare className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ) : chatType === "channel" ? (
            /* حالت کانال */
            <div className="py-1">
              <button
                type="button"
                onClick={() => handleAction(onInfo)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              >
                <span>اطلاعات کانال</span>
                <Users className="w-4 h-4 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => handleAction(onMuteToggle)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              >
                <span>{isMuted ? "دریافت اعلان" : "عدم دریافت اعلان"}</span>
                {isMuted ? (
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleAction(onLeave)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <span>ترک کانال</span>
                <LogOut className="w-4 h-4 text-rose-500" />
              </button>

              <button
                type="button"
                onClick={() => handleAction(onSelectMessages)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              >
                <span>انتخاب</span>
                <CheckSquare className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ) : (
            /* حالت چت شخصی (PV) - مطابق تصویر ۴۰ */
            <div className="py-1">
              {/* جستجو */}
              <button
                type="button"
                onClick={() => handleAction(onSearch)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              >
                <span>جستجو</span>
                <Search className="w-4 h-4 text-gray-400" />
              </button>

              {/* مسدود کردن */}
              <button
                type="button"
                onClick={() => handleAction(onBlockToggle)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <span>{isBlocked ? "رفع مسدودیت" : "مسدود کردن"}</span>
                <Ban className="w-4 h-4 text-rose-500" />
              </button>

              {/* اعلان / بی‌صدا */}
              <button
                type="button"
                onClick={() => handleAction(onMuteToggle)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              >
                <span>{isMuted ? "دریافت اعلان" : "عدم دریافت اعلان"}</span>
                {isMuted ? (
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* پاکسازی گفتگو */}
              <button
                type="button"
                onClick={() => handleAction(onClearChat)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              >
                <span>پاکسازی گفتگو</span>
                <Eraser className="w-4 h-4 text-gray-400" />
              </button>

              {/* گزارش گفتگو */}
              <button
                type="button"
                onClick={() => handleAction(onReport)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
              >
                <span>گزارش گفتگو</span>
                <AlertCircle className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatHeaderMenu;
