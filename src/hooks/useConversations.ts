// src/hooks/useConversations.ts
import { useEffect, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { conversationsApi, mapConversation } from "../services/apiService";
import { authStorage } from "../services/auth";
import { db } from "../services/db"; // <-- Import the database

export const useConversations = () => {
  const setConversations = useChatStore((state) => state.setConversations);

  const fetchConversations = useCallback(async () => {
    try {
      const token = authStorage.getToken(); // Using your current token getter
      if (!token) return;

      const response = await conversationsApi.list(0, 100, "");
      const rawItems = response.conversations?.content ?? [];
      const items = rawItems.map(mapConversation);

      // 1. Save fresh data to IndexedDB
      await db.conversations.bulkPut(items);

      // 2. Update Zustand store for the UI
      setConversations(items);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  }, [setConversations]);

  useEffect(() => {
    // A. Load from Cache first (Instant UI load)
    db.conversations.toArray().then((cached) => {
      if (cached.length > 0) {
        // Optional: sort by last message time before setting
        cached.sort((a, b) => {
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return timeB - timeA;
        });
        setConversations(cached);
      }
    });

    // B. Fetch fresh data from API in background
    fetchConversations();
  }, [fetchConversations, setConversations]);

  return { refetch: fetchConversations };
};
