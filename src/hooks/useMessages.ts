import { useState, useEffect, useCallback, useRef } from "react";
import { messagesApi } from "../services/apiService";
import type { Message, Conversation, ConversationDetail, PersianDate } from "../types/messenger";
import { db } from "../services/db";

const toNum = (t: PersianDate | undefined): number => {
  if (!t) return 0;
  return (
    +t.year * 1e10 +
    +t.month * 1e8 +
    +t.day * 1e6 +
    +t.hour * 1e4 +
    +t.minute * 1e2 +
    +t.second
  );
};

interface UseMessagesState {
  messages: Message[];
  conversation: Conversation | null;
  opponentStatus: "ONLINE" | "OFFLINE";
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

export function useMessages(conversationId: string | null) {
  const [state, setState] = useState<UseMessagesState>({
    messages: [],
    conversation: null,
    opponentStatus: "OFFLINE",
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: false,
    page: 0,
  });

  const activeConvId = useRef<string | null>(null);

  const applyDetail = useCallback(
    (detail: ConversationDetail, pageNo: number, prepend = false) => {
      const newMessages = detail.messages.content;
      
      setState((prev) => {
        const merged = prepend
          ? [...newMessages, ...prev.messages]
          : newMessages;

        const sorted = [...merged].sort((a, b) => {
          const timeA = toNum((a as any).createdAt || a.timestamp);
          const timeB = toNum((b as any).createdAt || b.timestamp);
          return timeA - timeB;
        });

        return {
          messages: sorted,
          conversation: detail.conversation,
          opponentStatus: detail.opponentStatus,
          loading: false,
          loadingMore: false,
          error: null,
          hasMore: detail.hasPrevious,
          page: pageNo,
        };
      });

      return newMessages;
    },
    []
  );

  useEffect(() => {
    if (!conversationId) return;

    activeConvId.current = conversationId;
    let isSubscribed = true;

    async function initializeMessages() {
      if (!conversationId) return;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // 1. Instant Load from Dexie Cache
        const cachedMessages = await db.messages
          .where("conversationId")
          .equals(conversationId)
          .toArray();

        if (isSubscribed && cachedMessages.length > 0) {
          setState((prev) => ({
            ...prev,
            messages: cachedMessages as any, // Loading cache immediately
            loading: false,
          }));
        }

        // 2. Fetch fresh data from network
        const detail = await messagesApi.getConversationDetail(conversationId, 0);

        if (isSubscribed && activeConvId.current === conversationId) {
          const fetchedMessages = applyDetail(detail, 0, false);

          // 3. Sync fetched data back to Dexie cache
          if (fetchedMessages.length > 0) {
            const cacheableMessages = fetchedMessages.map((msg: any) => ({
              ...msg,
              id: msg.messageId || msg.id,
              timestamp: msg.createdAt || msg.timestamp,
              conversationId: conversationId
            }));
            await db.messages.bulkPut(cacheableMessages as any);
          }
        }
      } catch (err) {
        if (isSubscribed && activeConvId.current === conversationId) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : "خطا در دریافت پیام‌ها",
          }));
        }
      }
    }

    initializeMessages();

    return () => {
      isSubscribed = false;
      activeConvId.current = null;
    };
  }, [conversationId, applyDetail]);

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || state.loadingMore || !state.hasMore) return;

    setState((prev) => ({ ...prev, loadingMore: true }));

    try {
      const nextPage = state.page + 1;
      const detail = await messagesApi.getNextPage(conversationId, nextPage);
      
      if (activeConvId.current === conversationId) {
         const olderMessages = applyDetail(detail, nextPage, true);

         // Sync older messages to cache
         if (olderMessages.length > 0) {
            const cacheableMessages = olderMessages.map((msg: any) => ({
              ...msg,
              id: msg.messageId || msg.id,
              timestamp: msg.createdAt || msg.timestamp,
              conversationId: conversationId
            }));
            await db.messages.bulkPut(cacheableMessages as any);
         }
      }
    } catch (err) {
      if (activeConvId.current === conversationId) {
        setState((prev) => ({
          ...prev,
          loadingMore: false,
          error: err instanceof Error ? err.message : "خطا در بارگذاری بیشتر",
        }));
      }
    }
  }, [
    conversationId,
    state.loadingMore,
    state.hasMore,
    state.page,
    applyDetail,
  ]);

  const refresh = useCallback(async () => {
    if (!conversationId) return;
    setState((prev) => ({ ...prev, loading: true, error: null, messages: [] }));
    
    try {
       const detail = await messagesApi.getConversationDetail(conversationId, 0);
       if (activeConvId.current === conversationId) {
          const freshMessages = applyDetail(detail, 0, false);
          
          if (freshMessages.length > 0) {
            const cacheableMessages = freshMessages.map((msg: any) => ({
              ...msg,
              id: msg.messageId || msg.id,
              timestamp: msg.createdAt || msg.timestamp,
              conversationId: conversationId
            }));
            await db.messages.bulkPut(cacheableMessages as any);
          }
       }
    } catch (err) {
      if (activeConvId.current === conversationId) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "خطا",
        }));
      }
    }
  }, [conversationId, applyDetail]);

  return {
    messages: state.messages,
    conversation: state.conversation,
    opponentStatus: state.opponentStatus,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    hasMore: state.hasMore,
    loadOlderMessages,
    refresh,
  };
}
