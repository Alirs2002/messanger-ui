import { useEffect, useRef } from "react";
import { stompService } from "../services/stompService";
import { authStorage } from "../services/auth";
import { useChatStore } from "../store/useChatStore";

export function useChatSocket() {
  const receiveLiveMessage = useChatStore((s) => s.receiveLiveMessage);
  const connectedRef = useRef(false);

  useEffect(() => {
    const token = authStorage.getToken();
    const userId = authStorage.getUserId();

    if (!token || !userId) {
      console.warn(
        "[useChatSocket] missing token or userId — socket not started",
      );
      return;
    }

    if (connectedRef.current) return;
    connectedRef.current = true;

    stompService.connect(token, userId, (payload) => {
      receiveLiveMessage(payload, userId);
    });

    return () => {
      stompService.disconnect();
      connectedRef.current = false;
    };
  }, [receiveLiveMessage]);
}
