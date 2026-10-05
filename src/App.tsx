import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import { useChatStore } from "./store/useChatStore";
import { useConversations } from "./hooks/useConversations";
import { useChatSocket } from "./hooks/useChatSocket";

export default function App() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  useConversations();
  useChatSocket();

  return (
    <div dir="rtl" className="flex h-screen w-screen overflow-hidden bg-gray-100">
      
      {/* Sidebar: Takes full width on mobile if no chat is open, 
          but is a fixed width (w-96) on desktop (md) */}
      <div className={`${activeConversationId ? "hidden md:flex" : "flex"} w-full md:w-96 flex-col border-l border-gray-200`}>
        <Sidebar />
      </div>

      {/* Chat area: Hidden on mobile if no chat is open, 
          takes remaining space on desktop */}
      <div className={`${activeConversationId ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
        <ChatArea />
      </div>
      
    </div>
  );
}
