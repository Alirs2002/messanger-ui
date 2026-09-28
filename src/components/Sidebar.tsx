import React from "react";
import { Search, Menu, Pin } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import type { ConversationType } from "../types/chat";

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
  } = useChatStore();

  const filteredConversations = conversations.filter((item) => {
    const matchesTab = activeTab === "ALL" || item.type === activeTab;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lastMessage &&
        item.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <aside className="w-full md:w-96 h-screen flex flex-col bg-white border-l border-slate-200 select-none">
      {/* هدر و سرچ */}
      <div className="p-3 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600">
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="جستجو در گفتگوها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-sm rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition text-slate-800 placeholder-slate-400"
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
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* لیست چت‌ها */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
            گفتگویی یافت نشد
          </div>
        ) : (
          filteredConversations.map((chat) => {
            const isSelected = activeConversationId === chat.id;

            return (
              <div
                key={chat.id}
                onClick={() => setActiveConversation(chat.id)}
                className={`flex items-center gap-3 p-3 cursor-pointer transition relative ${
                  isSelected
                    ? "bg-emerald-50/70 border-r-4 border-emerald-600"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-base shadow-sm">
                    {chat.title.charAt(0)}
                  </div>
                  {chat.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-semibold text-sm text-slate-800 truncate">
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

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <p className="truncate text-slate-500 text-xs max-w-[200px]">
                      {chat.lastMessage}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {chat.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-slate-400 rotate-45" />
                      )}
                      {chat.unreadCount && chat.unreadCount > 0 ? (
                        <span className="px-1.5 py-0.5 min-w-5 text-center text-[10px] font-bold rounded-full bg-emerald-600 text-white">
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
    </aside>
  );
};
