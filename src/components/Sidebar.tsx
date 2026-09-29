import React, { useState } from "react";
import { Search, Menu, Pin, VolumeX } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import ConversationContextMenu from "./ConversationContextMenu";
import type { ConversationItem, ConversationType } from "../types/chat";

const TABS: { id: ConversationType; label: string }[] = [
  { id: "ALL", label: "همه" },
  { id: "PERSONAL", label: "شخصی" },
  { id: "GROUP", label: "گروه" },
  { id: "CHANNEL", label: "کانال" },
  { id: "SUPPORT", label: "پشتیبانی" },
];

export const Sidebar: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    togglePinConversation,
    toggleMuteConversation,
    toggleUnreadConversation,
    clearChat,
    deleteConversation,
  } = useChatStore();

  // استیت نگهداری موقعیت و گفتگوی منوی راست‌کلیک
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    conversation: ConversationItem;
  } | null>(null);

  // فیلتر و مرتب‌سازی: گفتگوهای پین‌شده همواره در بالای لیست قرار می‌گیرند
  const filteredAndSortedConversations = [...conversations]
    .filter((item) => {
      const matchesTab = activeTab === "ALL" || item.type === activeTab;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.lastMessage &&
          item.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTab && matchesSearch;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  const handleContextMenu = (e: React.MouseEvent, chat: ConversationItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      conversation: chat,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  return (
    <aside className="w-full md:w-96 h-screen flex flex-col bg-white dark:bg-gray-900 border-l border-slate-200 dark:border-gray-800 select-none">
      {/* هدر و سرچ */}
      <div className="p-3 border-b border-slate-100 dark:border-gray-800 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-xl transition text-slate-600 dark:text-gray-300">
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="جستجو در گفتگوها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200/70 dark:hover:bg-gray-700/60 focus:bg-white dark:focus:bg-gray-800 text-sm rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition text-slate-800 dark:text-gray-100 placeholder-slate-400"
            />
          </div>
        </div>

        {/* تب‌ها */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                    : "text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* لیست گفتگوها */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-gray-800/60">
        {filteredAndSortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
            گفتگویی یافت نشد
          </div>
        ) : (
          filteredAndSortedConversations.map((chat) => {
            const isSelected = String(activeConversationId) === String(chat.id);

            return (
              <div
                key={chat.id}
                onClick={() => setActiveConversation(chat.id)}
                onContextMenu={(e) => handleContextMenu(e, chat)}
                className={`flex items-center gap-3 p-3 cursor-pointer transition relative ${
                  isSelected
                    ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-r-4 border-emerald-600"
                    : "hover:bg-slate-50 dark:hover:bg-gray-800/50"
                }`}
              >
                {/* آواتار */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-base shadow-sm">
                    {chat.title.charAt(0)}
                  </div>
                  {chat.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                  )}
                </div>

                {/* مشخصات گفتگو */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-semibold text-sm text-slate-800 dark:text-gray-200 truncate">
                        {chat.title}
                      </span>
                      {chat.isVerified && (
                        <span className="w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {chat.lastMessageTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
                    <p className="truncate text-xs max-w-[200px]">
                      {chat.lastMessage}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {chat.isMuted && (
                        <VolumeX className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                      )}
                      {chat.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 rotate-45" />
                      )}
                      {chat.unreadCount && chat.unreadCount > 0 ? (
                        <span
                          className={`px-1.5 py-0.5 min-w-5 text-center text-[10px] font-bold rounded-full ${
                            chat.isMuted
                              ? "bg-slate-400 dark:bg-slate-600 text-white"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {chat.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* منوی راست‌کلیک گفتگو */}
      {contextMenu && (
        <ConversationContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          conversation={contextMenu.conversation}
          onClose={closeContextMenu}
          onTogglePin={(c) => togglePinConversation?.(c.id)}
          onToggleMute={(c) => toggleMuteConversation?.(c.id)}
          onToggleUnread={(c) => toggleUnreadConversation?.(c.id)}
          onClearHistory={(c) => {
            if (
              window.confirm(
                "آیا از پاکسازی تمام پیام‌های این گفتگو اطمینان دارید؟",
              )
            ) {
              clearChat?.(c.id);
            }
          }}
          onDelete={(c) => {
            if (window.confirm("آیا از حذف کامل این گفتگو اطمینان دارید؟")) {
              deleteConversation?.(c.id);
            }
          }}
        />
      )}
    </aside>
  );
};
