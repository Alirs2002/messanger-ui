import { useEffect, useCallback } from "react";
import { authStorage } from "../services/auth";
import { conversationsApi, mapConversation } from "../services/apiService";
import { useChatStore } from "../store/useChatStore";

export function useConversations() {
  const setConversations = useChatStore((s) => s.setConversations);

  const fetchConversations = useCallback(async () => {
    const token = authStorage.getToken();
    if (!token) {
      console.warn("[useConversations] no token — skipping fetch");
      return;
    }

    try {
      const page = await conversationsApi.list(0, 100, "");
      setConversations(page.content.map(mapConversation));
    } catch (err) {
      console.error("[useConversations] fetch failed:", err);
    }
  }, [setConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { refetch: fetchConversations };
}
