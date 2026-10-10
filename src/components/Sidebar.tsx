import React, { useState } from "react";
import { Search, Menu, Pin, VolumeX, X, Clock, Check, CheckCheck, UserPlus, Users, Megaphone, ArrowRight } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import ConversationContextMenu from "./ConversationContextMenu";
import type { ConversationItem } from "../types/chat";
import { useCurrentUserUuid } from "../hooks/useCurrentUserUuid";

const TABS = [
  { id: "ALL", label: "همه" },
  { id: "PERSONAL", label: "شخصی" },
  { id: "GROUP", label: "گروه" },
  { id: "CHANNEL", label: "کانال" },
  { id: "SUPPORT", label: "پشتیبانی" },
];

const formatTime = (ts: string | undefined): string => {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts; 
  return d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
};

export const Sidebar: React.FC = () => {
  const store = useChatStore() as any;
  const conversations: ConversationItem[] = store.conversations || [];
  const messages = store.messages || {};
  const activeConversationId = store.activeConversationId;
  const setActiveConversation = store.setActiveConversation;
  const currentUserId = useCurrentUserUuid();

  const [activeTab, setActiveTab] = useState(store.activeTab || "ALL");
  const [searchQuery, setSearchQuery] = useState(store.searchQuery || "");

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    conversation: ConversationItem;
  } | null>(null);

  const [profileModalChat, setProfileModalChat] = useState<ConversationItem | null>(null);

  const [isNewChatViewOpen, setIsNewChatViewOpen] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState("");

  const filteredSortedConversations = [...conversations]
    .filter((item) => {
      const conv = item as any;
      const matchesTab = activeTab === "ALL" || conv.type === activeTab;
      const matchesSearch =
        conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.lastMessageText &&
          conv.lastMessageText.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTab && matchesSearch;
    })
    .sort((a: any, b: any) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  const handleContextMenu = (e: React.MouseEvent, chat: ConversationItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, conversation: chat });
  };

  const closeContextMenu = () => setContextMenu(null);

  const contacts = [
    { id: '1', name: 'علی', status: 'آخرین بازدید اخیراً' },
    { id: '2', name: 'رضا', status: 'آنلاین' },
  ];
  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()));


  return (
    // افزودن dir="rtl" برای راست‌چین شدن طبیعی کل سایدبار
    <aside className="w-full md:w-96 h-screen flex flex-col bg-white dark:bg-gray-900 border-l border-slate-200 dark:border-gray-800 select-none relative" dir="rtl">
      
      {!isNewChatViewOpen && (
        <>
          {/* Header + search */}
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
                  className="w-full pr-9 pl-3 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200/70 dark:hover:bg-gray-700/60 focus:bg-white dark:focus:bg-gray-800 text-sm rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition text-slate-800 dark:text-gray-100 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Tabs */}
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
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-gray-800/60">
            {filteredSortedConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
                یک گفتگو را برای شروع انتخاب کنید
              </div>
            ) : (
              filteredSortedConversations.map((chat) => {
                const c = chat as any;
                const isSelected = String(activeConversationId) === String(c.id);
                const chatMessages = messages[c.id] || messages[String(c.id)] || [];
                const realLastMsg = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;
                const displayLastMessage = realLastMsg ? realLastMsg.text : c.lastMessageText;
                const displayLastTime = formatTime(realLastMsg ? realLastMsg.createdAt : (c.lastMessageTimestamp ?? c.lastMessageTime));
                const lastIsMine = realLastMsg ? Boolean(realLastMsg.isOutgoing || realLastMsg.isMe || (realLastMsg.senderId && currentUserId && String(realLastMsg.senderId) === String(currentUserId))) : Boolean(c.lastMessageIsMine || ((c.lastMessageAuthorUserId ?? c.lastMessageSenderId) && currentUserId && String(c.lastMessageAuthorUserId ?? c.lastMessageSenderId) === String(currentUserId)));
                const isChannel = c.type === "CHANNEL";
                const isGroup = c.type === "GROUP" || c.type === "SUPPORT";
                const isPv = !isChannel && !isGroup;
                const senderName = c.lastMessageSenderName || c.lastMessageNickname || realLastMsg?.senderName;
                let senderPrefix: string | null = null;
                if (isGroup) {
                  senderPrefix = lastIsMine ? "شما" : senderName || null;
                }
                const rawStatus = realLastMsg ? (realLastMsg.state ?? realLastMsg.status ?? "").toUpperCase() : (c.lastMessageState ?? "").toUpperCase();
                const isSeen = rawStatus === "SEEN" || rawStatus === "READ" || Boolean(realLastMsg?.seen);
                const isPending = rawStatus === "SENDING" || realLastMsg?.status === "sending";
                const showStatusTicks = isPv && lastIsMine;

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
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center text-right">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-semibold text-sm text-slate-800 dark:text-gray-200 truncate">
                            {c.title}
                          </span>
                          {c.isVerified && (
                            <span className="w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                              ✓
                            </span>
                          )}
                        </div>
                        {displayLastTime && (
                          <span className="text-[11px] text-slate-400 whitespace-nowrap flex-shrink-0" dir="ltr">
                            {displayLastTime}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 gap-2">
                        <p className="truncate text-xs flex items-center gap-1">
                          {senderPrefix && (
                            <span className="font-semibold text-slate-700 dark:text-gray-300 whitespace-nowrap">
                              {senderPrefix}:{" "}
                            </span>
                          )}
                          <span className="truncate">{displayLastMessage}</span>
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {showStatusTicks && (
                            isPending ? (
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                            ) : isSeen ? (
                              <CheckCheck className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Check className="w-4 h-4 text-slate-400" />
                            )
                          )}
                          {c.isMuted && (
                            <VolumeX className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                          )}
                          {c.isPinned && (
                            <Pin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 rotate-45" />
                          )}
                          {c.unreadCount && c.unreadCount > 0 ? (
                            <span
                              className={`px-1.5 py-0.5 min-w-[20px] text-center text-[10px] font-bold rounded-full ${
                                c.isMuted
                                  ? "bg-slate-400 dark:bg-slate-600 text-white"
                                  : "bg-emerald-600 text-white"
                              }`}
                            >
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

          {/* Floating Action Button (FAB) تغییر موقعیت به سمت چپ */}
          <button 
            className="absolute bottom-6 left-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_8px_20px_-4px_rgba(16,185,129,0.5)] hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95 z-20"
            onClick={() => setIsNewChatViewOpen(true)}
            title="گفتگوی جدید"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </>
      )}

      {/* --- نمای ایجاد گفتگوی جدید --- */}
      {isNewChatViewOpen && (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 w-full animate-in slide-in-from-left-8 duration-200">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-800">
            <button onClick={() => setIsNewChatViewOpen(false)} className="p-2 ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <ArrowRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">گفتگوی جدید</h2>
          </div>

          <div className="overflow-y-auto flex-1">
            {/* Action Buttons */}
            <div className="py-2">
              <button onClick={() => console.log('Create Group')} className="w-full flex items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center ml-3">
                  <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-medium text-gray-800 dark:text-gray-200 text-right">گروه جدید</span>
              </button>
              
              <button onClick={() => console.log('Create Channel')} className="w-full flex items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center ml-3">
                  <Megaphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-medium text-gray-800 dark:text-gray-200 text-right">کانال جدید</span>
              </button>

              <button onClick={() => console.log('Add Contact')} className="w-full flex items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center ml-3">
                  <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-medium text-gray-800 dark:text-gray-200 text-right">افزودن مخاطب</span>
              </button>
            </div>

            <div className="h-2 bg-slate-50 dark:bg-gray-950 w-full border-y border-slate-100 dark:border-gray-800" />

            {/* Search Bar */}
            <div className="p-3 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 border-b border-slate-100 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجوی مخاطبین..."
                  className="w-full pr-10 pl-4 py-2 bg-slate-100 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none text-gray-800 dark:text-gray-200"
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="pb-4">
              <div className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-400 bg-slate-50/50 dark:bg-gray-900 text-right">
                مخاطبین شما
              </div>
              {filteredContacts.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-400">مخاطبی یافت نشد</div>
              ) : (
                filteredContacts.map(contact => (
                  <div key={contact.id} className="flex items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-800 cursor-pointer transition-colors border-b border-slate-50 dark:border-gray-800/50 last:border-0">
                    <div 
                      className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold ml-3 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Go to profile", contact.id);
                      }}
                    >
                      {contact.name.charAt(0)}
                    </div>
                    <div 
                      className="flex-1 text-right"
                      onClick={() => {
                        console.log("Start chat with", contact.id);
                        setIsNewChatViewOpen(false);
                      }}
                    >
                      <div className="font-semibold text-gray-800 dark:text-gray-100">{contact.name}</div>
                      <div className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{contact.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Context Menu & Profile Modal --- */}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="h-24 bg-gradient-to-r from-emerald-600 to-teal-500" />
            <button
              onClick={() => setProfileModalChat(null)}
              className="absolute top-4 left-4 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
            >
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
