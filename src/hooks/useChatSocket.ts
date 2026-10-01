// codes/src/hooks/useChatSocket.ts
import { useEffect } from "react";
import stompService from "../services/stompService";
import { useChatStore } from "../store/useChatStore";

export const useChatSocket = (
  token?: string | null,
  userId?: number | string | null,
) => {
  const receiveLiveMessage = useChatStore((state) => state.receiveLiveMessage);

  useEffect(() => {
    // اگر توکن یا آیدی کاربر موجود نیست، اتصال برقرار نشود
    if (!token || !userId) return;

    // برقراری اتصال و دریافت آنی پیام‌ها
    stompService.connect(token, userId, (socketData) => {
      receiveLiveMessage(socketData, userId);
    });

    // هنگام Unmount شدن، اتصال قطع شود
    return () => {
      stompService.disconnect();
    };
  }, [token, userId, receiveLiveMessage]);
};
