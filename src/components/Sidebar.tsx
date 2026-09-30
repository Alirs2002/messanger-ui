import React, { useState } from "react";
import { Search, Menu, Pin, VolumeX, X, User, Info } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import ConversationContextMenu from "./ConversationContextMenu";
import type { ConversationItem } from "../types/chat";

const TABS = [
  { id: "ALL", label: "همه" },
  { id: "PERSONAL", label: "شخصی" },
  { id: "GROUP", label: "گروه" },
  { id: "CHANNEL", label: "کانال" },
  { id: "SUPPORT", label: "پشتیبانی" },
];

export const Sidebar: React.FC = () => {
  // استفاده از as any برای جلوگیری از خطاهای تایپ‌اسکریپت مربوط به فیلدهای اضافه شده در استور
  const store = useChatStore() as any;
  const conversations: ConversationItem[] = store.conversations || [];
  const messages = store.messages || {};
  const activeConversationId = store.activeConversationId;
  const setActiveConversation = store.setActiveConversation;
  
  // استفاده از استیت داخلی در صورتی که در استور تعریف نشده باشند
  const [activeTab, setActiveTab] = useState(store.activeTab || "ALL");
  const [searchQuery, setSearchQuery] = useState(store.searchQuery || "");

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    conversation: ConversationItem;
  } | null>(null);

  const [profileModalChat, setProfileModalChat] = useState<ConversationItem | null>(null);

  const filteredSortedConversations = [...conversations]
    .filter((item) => {
      const conv = item as any;
      const matchesTab = activeTab === "ALL" || conv.type === activeTab;
      const matchesSearch =
        conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTab && matchesSearch;
    })
    .sort((a: any, b: any) => {
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

  const closeContextMenu = () => setContextMenu(null);

  return (
    <aside className="w-full md:w-96 h-screen flex flex-col bg-white dark:bg-gray-900 border-l border-slate-200 dark:border-gray-800 select-none">
      {/* هدر و جستجو */}
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (store.setSearchQuery) store.setSearchQuery(e.target.value);
              }}
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
                onClick={() => {
                  setActiveTab(tab.id);
                  if (store.setActiveTab) store.setActiveTab(tab.id);
                }}
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
        {filteredSortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
            گفتگویی یافت نشد
          </div>
        ) : (
          filteredSortedConversations.map((chat) => {
            const c = chat as any;
            const isSelected = String(activeConversationId) === String(c.id);

            const chatMessages = messages[c.id] || messages[String(c.id)] || [];
            const realLastMsg =
              chatMessages.length > 0
                ? chatMessages[chatMessages.length - 1]
                : null;

            const displayLastMessage = realLastMsg ? realLastMsg.text : c.lastMessage;
            const displayLastTime = realLastMsg ? realLastMsg.createdAt : c.lastMessageTime;

            return (
              <div
                key={c.id}
                onClick={() => setActiveConversation(c.id)}
                onContextMenu={(e) => handleContextMenu(e, chat)}
                className={`flex items-center gap-3 p-3 cursor-pointer transition relative ${
                  isSelected
                    ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-r-4 border-emerald-600"
                    : "hover:bg-slate-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <div 
                  className="relative flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileModalChat(chat);
                  }}
                  title="مشاهده مشخصات"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-base shadow-sm hover:opacity-90 transition-opacity">
                    {c.title.charAt(0)}
                  </div>
                  {c.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-semibold text-sm text-slate-800 dark:text-gray-200 truncate">
                        {c.title}
                      </span>
                      {c.isVerified && (
                        <span className="w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {displayLastTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
                    <p className="truncate text-xs max-w-[200px]">
                      {displayLastMessage}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {c.isMuted && <VolumeX className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />}
                      {c.isPinned && <Pin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 rotate-45" />}
                      {c.unreadCount && c.unreadCount > 0 ? (
                        <span className={`px-1.5 py-0.5 min-w-[20px] text-center text-[10px] font-bold rounded-full ${c.isMuted ? "bg-slate-400 dark:bg-slate-600 text-white" : "bg-emerald-600 text-white"}`}>
                          {c.unreadCount}
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

      {contextMenu && (
        <ConversationContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          conversation={contextMenu.conversation}
          onClose={closeContextMenu}
          onViewProfile={(c) => {
            setProfileModalChat(c);
            closeContextMenu();
          }}
          onTogglePin={(c) => store.togglePinConversation?.(c.id)}
          onToggleMute={(c) => store.toggleMuteConversation?.(c.id)}
          onToggleUnread={(c) => store.toggleUnreadConversation?.(c.id)}
          onClearHistory={(c) => {
            if (window.confirm("آیا از پاکسازی تمام پیام‌های این گفتگو اطمینان دارید؟")) {
              store.clearChat?.(c.id);
            }
          }}
          onDelete={(c) => {
            if (window.confirm("آیا از حذف کامل این گفتگو اطمینان دارید؟")) {
              store.deleteConversation?.(c.id);
            }
          }}
        />
      )}

      {profileModalChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="h-24 bg-gradient-to-r from-emerald-600 to-teal-500"></div>
            <button onClick={() => setProfileModalChat(null)} className="absolute top-4 left-4 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="px-6 pb-6 relative -mt-12">
              <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-emerald-500 to-teal-400 border-4 border-white dark:border-gray-800 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-md">
                {profileModalChat.title.charAt(0)}
              </div>
              <div className="text-center mt-3 space-y-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {profileModalChat.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveConversation(profileModalChat.id);
                  setProfileModalChat(null);
                }}
                className="w-full mt-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
              >
                ارسال پیام
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
