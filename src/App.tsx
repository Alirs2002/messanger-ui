import React from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { useChatStore } from "./store/useChatStore";

export default function App() {
  const { activeConversationId } = useChatStore();

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
