import React, { useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { useChatStore } from "./store/useChatStore";
import stompService from "./services/stompService";

export default function App() {
  const { activeConversationId, receiveLiveMessage } = useChatStore();

  useEffect(() => {
    // 1. لاگین کردن یا دریافت توکن و آیدی کاربر باید قبلش انجام بشه
    // این مقادیر رو از استور احراز هویت یا لوکال استوریج بخون.
    // اینجا به عنوان مثال از مقادیر تستی استفاده کردیم:
    const token = "YOUR_ACCESS_TOKEN";
    const currentUserId = 12345;

    // 2. اتصال به STOMP
    stompService.connect(token, currentUserId, (message) => {
      // 3. وقتی پیام جدید از سوکت میاد، می‌فرستیمش تو استور
      receiveLiveMessage(message, currentUserId);
    });

    // 4. قطع اتصال هنگام از بین رفتن کامپوننت (unmount)
    return () => {
      stompService.disconnect();
    };
  }, [receiveLiveMessage]);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans"
      dir="rtl"
    >
      {/* در موبایل اگر چت باز بود سایدبار پنهان شود */}
      <div
        className={`${activeConversationId ? "hidden md:flex" : "flex"} w-full md:w-96 flex-shrink-0`}
      >
        <Sidebar />
      </div>

      {/* پنجره چت */}
      <div
        className={`${!activeConversationId ? "hidden md:flex" : "flex"} flex-1`}
      >
        <ChatArea />
      </div>
    </div>
  );
}
