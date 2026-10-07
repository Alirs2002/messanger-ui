import { useEffect, useRef } from "react";
import { authStorage } from "../services/auth";
import { stompService } from "../services/stompService";
import { useChatStore } from "../store/useChatStore";

export const useChatSocket = () => {
  const receiveLiveMessage = useChatStore((state) => state.receiveLiveMessage);
  const connectedRef = useRef(false);

  useEffect(() => {
    const currentUserId = authStorage.getUserUuid() || authStorage.getUserId();

    if (!currentUserId) {
      console.warn("[useChatSocket] Missing currentUserId in authStorage.");
      return;
    }

    if (connectedRef.current) return;
    connectedRef.current = true;

    stompService.connect((envelope) => {
      receiveLiveMessage(envelope, currentUserId);
    });

    return () => {
      stompService.disconnect();
      connectedRef.current = false;
    };
  }, [receiveLiveMessage]);
};
