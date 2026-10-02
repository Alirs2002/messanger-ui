import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import { useChatStore } from "./store/useChatStore";
import { useConversations } from "./hooks/useConversations";
import { useChatSocket } from "./hooks/useChatSocket";

export default function App() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);

  // دریافت لیست کانورسیشن‌ها از API
  useConversations();
  // اتصال به WebSocket برای پیام‌های لایو
  useChatSocket();

  return (
    <div
      dir="rtl"
      className="flex h-screen w-screen overflow-hidden bg-gray-100"
    >
      {/* Sidebar — روی موبایل وقتی چت باز باشه مخفی میشه */}
      <div
        className={`${
          activeConversationId ? "hidden md:flex" : "flex"
        } w-full md:w-96 flex-col`}
      >
        <Sidebar />
      </div>

      {/* Chat area — روی موبایل وقتی چت باز نباشه مخفی میشه */}
      <div
        className={`${
          activeConversationId ? "flex" : "hidden md:flex"
        } flex-1 flex-col`}
      >
        <ChatArea />
      </div>
    </div>
  );
}
