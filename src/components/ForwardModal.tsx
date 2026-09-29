import React, { useState } from "react";
import {
  X,
  Search,
  Forward,
  Users,
  User,
  Megaphone,
  Check,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import type { MessageItem } from "../types/chat";

interface ForwardModalProps {
  isOpen: boolean;
  message: MessageItem | null;
  currentChatTitle?: string;
  onClose: () => void;
  onForwardSuccess?: (targetTitle: string) => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({
  isOpen,
  message,
  currentChatTitle = "",
  onClose,
  onForwardSuccess,
}) => {
  const { conversations, forwardMessage } = useChatStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | number | null>(
    null,
  );

  if (!isOpen || !message) return null;

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSendForward = () => {
    if (!selectedChatId) return;

    const targetChat = conversations.find((c) => c.id === selectedChatId);
    forwardMessage(selectedChatId, message, currentChatTitle);

    if (onForwardSuccess && targetChat) {
      onForwardSuccess(targetChat.title);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 space-x-reverse text-gray-800 dark:text-gray-100 font-semibold">
            <Forward className="w-5 h-5 text-emerald-500" />
            <span>بازارسال پیام به...</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* پیش‌نمایش پیام */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/40 border-b border-gray-100 dark:border-gray-700">
          <div className="border-r-2 border-emerald-500 pr-2.5">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mb-0.5">
              پیام انتخابی:
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-sm">
              {message.text}
            </p>
          </div>
        </div>

        {/* جستجو */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی گفتگو یا مخاطب..."
              className="w-full bg-gray-100 dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 text-xs rounded-xl pr-9 pl-3 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* لیست چت‌ها */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/40 p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              گفتگویی یافت نشد
            </div>
          ) : (
            filteredConversations.map((chat) => {
              const isSelected = selectedChatId === chat.id;
              const chatType =
                (chat as any).chatType ||
                (chat as any).type?.toLowerCase?.() ||
                "pv";

              return (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                      {chat.title.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {chat.title}
                      </h4>
                      <div className="flex items-center text-[11px] text-gray-400 space-x-1 space-x-reverse mt-0.5">
                        {chatType === "channel" ? (
                          <Megaphone className="w-3 h-3 text-sky-500" />
                        ) : chatType === "group" ? (
                          <Users className="w-3 h-3 text-amber-500" />
                        ) : (
                          <User className="w-3 h-3 text-emerald-500" />
                        )}
                        <span>
                          {chatType === "channel"
                            ? "کانال"
                            : chatType === "group"
                              ? "گروه"
                              : "کاربر"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* فوتر (دکمه‌ها) */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex items-center justify-end space-x-2 space-x-reverse">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition"
          >
            انصراف
          </button>
          <button
            type="button"
            disabled={!selectedChatId}
            onClick={handleSendForward}
            className="px-5 py-2 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl shadow-sm transition flex items-center space-x-1.5 space-x-reverse"
          >
            <Forward className="w-3.5 h-3.5" />
            <span>ارسال</span>
          </button>
        </div>
      </div>
    </div>
  );
};
