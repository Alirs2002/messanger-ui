import React, { useState, useEffect, useRef } from "react";
import { Smile, Heart, ThumbsUp, Sparkles, X } from "lucide-react";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    icon: Smile,
    name: "صورتک‌ها",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "🥹",
      "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗",
      "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🫢", "🫣", "🤫",
      "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒",
      "🙄", "😬", "😮‍💨", "🤥", "😌", "😴", "😷", "🤒", "🤕", "🤢",
      "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "😵‍💫", "🤯", "🤠", "🥳",
      "🥸", "😎", "🤓", "🧐", "😕", "🫤", "😟", "🙁", "😮", "😯",
      "😲", "😳", "🥺", "🥹", "😦", "😧", "😨", "😰", "😥", "😢",
      "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤",
      "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👻",
    ],
  },
  {
    id: "gestures",
    icon: ThumbsUp,
    name: "دست‌ها و بدن",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫸", "🫷", "🫳",
      "🫴", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙",
      "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊",
      "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️",
      "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀",
    ],
  },
  {
    id: "hearts",
    icon: Heart,
    name: "قلب‌ها و عواطف",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝",
      "💟", "💌", "💋", "💯", "💢", "💥", "💫", "💦", "💨", "🕳️",
    ],
  },
  {
    id: "objects",
    icon: Sparkles,
    name: "نمادها و علامت‌ها",
    emojis: [
      "✨", "⭐", "🌟", "⚡", "🔥", "🎉", "🎊", "🎯", "🏆", "🥇",
      "🥈", "🥉", "🎁", "🎈", "💡", "🔔", "📢", "💬", "💭", "☕",
      "🍕", "🍔", "🍟", "🍰", "🚀", "✈️", "🚗", "🛵", "💻", "📱",
      "✅", "❌", "❓", "❗", "⚠️", "⛔", "🟢", "🔴", "🔵", "🟡",
    ],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const [activeCategory, setActiveCategory] = useState("smileys");
  const pickerRef = useRef<HTMLDivElement>(null);

  // بستن منو با کلیک بیرون از آن
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentEmojis =
    EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis || [];

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-20 right-6 z-30 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* هدر دسته‌بندی‌ها */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80">
        <div className="flex items-center space-x-1 space-x-reverse">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                title={cat.name}
                className={`p-2 rounded-xl transition-all ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700/60"
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* شبکه ایموجی‌ها */}
      <div className="p-3 max-h-56 overflow-y-auto grid grid-cols-7 sm:grid-cols-8 gap-1.5 scrollbar-thin">
        {currentEmojis.map((emoji, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelectEmoji(emoji)}
            className="w-9 h-9 flex items-center justify-center text-xl rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-125 transition-transform duration-100 select-none active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
