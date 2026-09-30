import React, { useState, useMemo } from 'react';
import {
  X,
  Phone,
  Video,
  Bell,
  BellOff,
  Search,
  Image as ImageIcon,
  FileText,
  Mic,
  Link as LinkIcon,
  Check,
  Copy,
  Play,
  Pause,
  Download,
  ExternalLink,
  Trash2,
  UserX,
  Share2,
} from 'lucide-react';
import type { ConversationItem } from '../types/chat';
import { useChatStore } from '../store/useChatStore';

export interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation?: ConversationItem | null;
}

export interface MediaVoiceItem {
  id: string | number;
  title: string;
  sender: string;
  duration: string;
  date: string;
  url?: string;
}

export interface MediaImageItem {
  id: string | number;
  url: string;
  title: string;
  date: string;
}

export interface MediaFileItem {
  id: string | number;
  name: string;
  size: string;
  date: string;
  ext: string;
  url?: string;
}

export interface MediaLinkItem {
  id: string | number;
  url: string;
  title: string;
  date: string;
}

type TabType = 'voice' | 'media' | 'files' | 'links';

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  conversation,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('voice');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // دریافت متدها و پیام‌ها دقیقاً مطابق با استور useChatStore
  const messagesRecord = useChatStore((state) => state.messages);
  const toggleMute = useChatStore((state) => state.toggleMuteConversation);
  const clearChat = useChatStore((state) => state.clearChat);
  const deleteConversation = useChatStore((state) => state.deleteConversation);

  // استخراج فیلدها با استفاده از title (مطابق تایپ ConversationItem پروژه)
  const convId = conversation?.id;
  const convTitle = conversation?.title || 'گفتگو';
  const isOnline = Boolean(conversation?.isOnline);
  const isMuted = Boolean(conversation?.isMuted);
  const avatar = conversation?.avatar;

  // پیام‌های استخراج شده برای گفتگوی فعال
  const chatMessages = useMemo(() => {
    if (!convId || !messagesRecord) return [];
    return messagesRecord[convId] || messagesRecord[String(convId)] || [];
  }, [messagesRecord, convId]);

  // ۱. لیست ویس‌ها و پیام‌های صوتی
  const voiceItems: MediaVoiceItem[] = useMemo(() => {
    const defaultVoices: MediaVoiceItem[] = [
      {
        id: 'voc-1',
        title: 'توضیحات تکمیلی درباره نیازمندی‌های پروژه',
        sender: convTitle,
        duration: '۰۱:۱۸',
        date: 'امروز، ۱۱:۲۰',
      },
      {
        id: 'voc-2',
        title: 'پاسخ صوتی به سوالات جلسه',
        sender: 'شما',
        duration: '۰۰:۵۴',
        date: 'دیروز، ۱۸:۱۵',
      },
      {
        id: 'voc-3',
        title: 'گزارش صوتی وضعیت بررسی مستندات',
        sender: convTitle,
        duration: '۰۲:۰۵',
        date: '۱۴۰۵/۰۷/۰۴',
      },
    ];

    const fromMessages: MediaVoiceItem[] = (chatMessages as any[])
      .filter((m) => m.type === 'voice' || m.type === 'audio')
      .map((m, idx) => ({
        id: m.id || `voc-msg-${idx}`,
        title: m.fileName || m.text || `پیام صوتی ${idx + 1}`,
        sender: m.isOutgoing ? 'شما' : convTitle,
        duration: m.duration || '۰۰:۴۵',
        date: m.createdAt || 'امروز',
        url: m.fileUrl,
      }));

    return [...fromMessages, ...defaultVoices];
  }, [chatMessages, convTitle]);

  // ۲. تصاویر و ویدیوها
  const mediaItems: MediaImageItem[] = useMemo(() => {
    const defaultMedia: MediaImageItem[] = [
      {
        id: 'med-1',
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80',
        title: 'طرح معماری سامانه',
        date: 'دیروز',
      },
      {
        id: 'med-2',
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80',
        title: 'داشبورد گزارش‌ها',
        date: '۳ روز پیش',
      },
      {
        id: 'med-3',
        url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80',
        title: 'نمودار تحلیل ترافیک',
        date: '۱۴۰۵/۰۶/۲۸',
      },
    ];

    const fromMessages: MediaImageItem[] = (chatMessages as any[])
      .filter((m) => m.type === 'image' || m.type === 'video')
      .map((m, idx) => ({
        id: m.id || `med-msg-${idx}`,
        url: m.fileUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
        title: m.fileName || `رسانه ${idx + 1}`,
        date: m.createdAt || 'امروز',
      }));

    return [...fromMessages, ...defaultMedia];
  }, [chatMessages]);

  // ۳. فایل‌ها و اسناد
  const fileItems: MediaFileItem[] = useMemo(() => {
    const defaultFiles: MediaFileItem[] = [
      {
        id: 'doc-1',
        name: 'پروپوزال_فنی_پروژه_رسان.pdf',
        size: '۴.۸ مگابایت',
        date: 'دیروز، ۱۵:۴۰',
        ext: 'PDF',
      },
      {
        id: 'doc-2',
        name: 'مستندات_API_سرویس_پیام‌رسان.docx',
        size: '۱.۲ مگابایت',
        date: '۲ روز پیش',
        ext: 'DOCX',
      },
      {
        id: 'doc-3',
        name: 'آرشیو_کانفیگ‌ها_و_طراحی.zip',
        size: '۱۸.۵ مگابایت',
        date: '۱۴۰۵/۰۶/۲۵',
        ext: 'ZIP',
      },
    ];

    const fromMessages: MediaFileItem[] = (chatMessages as any[])
      .filter((m) => m.type === 'file')
      .map((m, idx) => ({
        id: m.id || `file-msg-${idx}`,
        name: m.fileName || 'document.pdf',
        size: m.fileSize || '۲.۴ مگابایت',
        date: m.createdAt || 'امروز',
        ext: (m.fileName || 'FILE').split('.').pop()?.toUpperCase() || 'FILE',
        url: m.fileUrl,
      }));

    return [...fromMessages, ...defaultFiles];
  }, [chatMessages]);

  // ۴. لینک‌ها
  const linkItems: MediaLinkItem[] = useMemo(() => {
    const defaultLinks: MediaLinkItem[] = [
      {
        id: 'lnk-1',
        url: 'https://mresalat.ir',
        title: 'سامانه یکپارچه رسالت',
        date: 'هفته گذشته',
      },
      {
        id: 'lnk-2',
        url: 'https://github.com/Alirs2002/messenger-ui',
        title: 'مخزن پروژه در گیت‌هاب',
        date: 'امروز، ۱۴:۱۵',
      },
    ];

    const fromMessages: MediaLinkItem[] = chatMessages
      .filter((m) => m.text && (m.text.includes('http://') || m.text.includes('https://')))
      .map((m, idx) => {
        const match = m.text.match(/(https?:\/\/[^\s]+)/g);
        const url = match ? match[0] : m.text;
        return {
          id: m.id || `link-msg-${idx}`,
          url,
          title: url.replace(/^https?:\/\//, '').split('/')[0] || url,
          date: m.createdAt || 'امروز',
        };
      });

    return [...fromMessages, ...defaultLinks];
  }, [chatMessages]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleMute = () => {
    if (convId !== undefined) {
      toggleMute(convId);
    }
  };

  const handleClearChat = () => {
    if (convId !== undefined) {
      clearChat(convId);
    }
    onClose();
  };

  const handleDeleteConversation = () => {
    if (convId !== undefined) {
      deleteConversation(convId);
    }
    onClose();
  };

  const togglePlayVoice = (id: string | number) => {
    setPlayingVoiceId((prev) => (prev === id ? null : id));
  };

  if (!isOpen || !conversation) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* نوار هدر */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-base text-slate-100">اطلاعات گفتگو</h3>
          </div>
          <button
            onClick={() => handleCopy(window.location.href, 'share')}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            title="اشتراک‌گذاری"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* محتوای پروفایل */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* کارت تصویر و نام */}
          <div className="flex flex-col items-center pt-6 pb-4 px-6 text-center border-b border-slate-800/60">
            <div className="relative mb-3">
              {avatar ? (
                <img
                  src={avatar}
                  alt={convTitle}
                  className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/40 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white text-3xl font-bold border-2 border-emerald-500/40 shadow-lg">
                  {convTitle.slice(0, 2)}
                </div>
              )}
              {isOnline && (
                <span
                  className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full"
                  title="آنلاین"
                />
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-100 mb-1">{convTitle}</h2>
            <p className="text-xs text-emerald-400 font-medium">
              {isOnline ? 'آنلاین' : 'آخرین بازدید اخیراً'}
            </p>

            {/* دکمه‌های اکشن */}
            <div className="grid grid-cols-4 gap-3 w-full max-w-xs mt-5">
              <button className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition-all">
                <Phone className="w-5 h-5" />
                <span className="text-[11px]">تماس</span>
              </button>
              <button className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition-all">
                <Video className="w-5 h-5" />
                <span className="text-[11px]">تصویری</span>
              </button>
              <button className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition-all">
                <Search className="w-5 h-5" />
                <span className="text-[11px]">جستجو</span>
              </button>
              <button
                onClick={handleToggleMute}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition-all"
              >
                {isMuted ? <BellOff className="w-5 h-5 text-rose-400" /> : <Bell className="w-5 h-5" />}
                <span className="text-[11px]">{isMuted ? 'صدادار' : 'بی‌صدا'}</span>
              </button>
            </div>
          </div>

          {/* اطلاعات ارتباطی */}
          <div className="p-5 space-y-4 border-b border-slate-800/60 text-sm">
            <div className="flex items-center justify-between group">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">شماره تماس ارتباطی</span>
                <span className="font-mono text-slate-200">+۹۸ ۹۱۲ ۳۴۵ ۶۷۸۹</span>
              </div>
              <button
                onClick={() => handleCopy('+989123456789', 'phone')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="کپی شماره"
              >
                {copiedField === 'phone' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between group">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">شناسه پیام‌رسان</span>
                <span className="font-mono text-emerald-400 dir-ltr text-right">@resalat_support</span>
              </div>
              <button
                onClick={() => handleCopy('@resalat_support', 'username')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="کپی شناسه"
              >
                {copiedField === 'username' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-0.5">توضیحات</span>
              <p className="text-slate-300 text-xs leading-relaxed">
                سامانه هوشمند و یکپارچه ارتباطی الگوی تعالی رسالت.
              </p>
            </div>
          </div>

          {/* تب‌های رسانه */}
          <div className="p-4">
            <div className="flex items-center bg-slate-950/60 p-1 rounded-2xl border border-slate-800/80 mb-4 text-xs font-medium">
              <button
                onClick={() => setActiveTab('voice')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'voice'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>ویس‌ها ({voiceItems.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'media'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>رسانه ({mediaItems.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'files'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>فایل‌ها ({fileItems.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('links')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'links'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>لینک‌ها ({linkItems.length})</span>
              </button>
            </div>

            {/* محتوای تب‌ها */}
            <div className="space-y-2">
              {activeTab === 'voice' && (
                <div className="space-y-2.5">
                  {voiceItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800/50 transition-all"
                    >
                      <button
                        onClick={() => togglePlayVoice(item.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                          playingVoiceId === item.id
                            ? 'bg-emerald-500 text-slate-950 shadow-md'
                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        }`}
                      >
                        {playingVoiceId === item.id ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current mr-0.5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-slate-200 truncate">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span>{item.sender}</span>
                          <span>•</span>
                          <span>{item.date}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-400 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-800/80">
                        {item.duration}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'media' && (
                <div className="grid grid-cols-3 gap-2">
                  {mediaItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-800 cursor-pointer"
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                        <span className="text-[10px] text-slate-200 truncate">{item.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'files' && (
                <div className="space-y-2">
                  {fileItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800/50 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs uppercase">
                          {item.ext}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{item.name}</p>
                          <span className="text-[11px] text-slate-400">
                            {item.size} • {item.date}
                          </span>
                        </div>
                      </div>
                      <button
                        className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-700/50 transition-colors"
                        title="دانلود فایل"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'links' && (
                <div className="space-y-2">
                  {linkItems.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800/50 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <LinkIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{item.title}</p>
                          <span className="text-[11px] text-slate-400 font-mono dir-ltr block text-right truncate">
                            {item.url}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0 mr-2 transition-colors" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* اکشن‌های پایانی با متدهای واقعی useChatStore */}
          <div className="p-4 pt-2 border-t border-slate-800/60 space-y-1.5">
            <button
              onClick={handleDeleteConversation}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-medium"
            >
              <UserX className="w-4 h-4" />
              <span>ترک یا حذف گفتگو</span>
            </button>
            <button
              onClick={handleClearChat}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors text-xs font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span>پاک‌سازی تاریخچه پیام‌ها</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
