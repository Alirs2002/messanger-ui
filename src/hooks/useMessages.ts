import { useState, useEffect, useCallback, useRef } from "react";
import { messagesApi } from "../services/apiService";
import type { Message, Conversation, ConversationDetail, PersianDate } from "../types/messenger";
import { db } from "../services/db";
import { isMessageDeleted } from '../services/apiService';

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

// Coerce every message — whether from the API or Dexie — into one consistent shape.
// The scroll-to-reply feature must use msg.messageId for DOM lookups; this guarantees
// that field is always a string and always present.
const normalizeMessage = (msg: any, conversationId: string): Message => {
  const messageId = String(msg.messageId ?? msg.id ?? "");
  const timestamp = msg.createdAt ?? msg.timestamp;
  return {
    ...msg,
    id: messageId,
    messageId,
    timestamp,
    createdAt: timestamp,
    conversationId,
  } as unknown as Message;
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
    (detail: ConversationDetail, pageNo: number, convId: string, prepend = false) => {
      // Normalize at the point of ingestion from the API
      const newMessages = detail.messages.content
      .filter((m) => !isMessageDeleted(m))
      .map((m) =>
        normalizeMessage(m, convId)
      );

      setState((prev) => {
        const merged = prepend
          ? [...newMessages, ...prev.messages]
          : newMessages;

        const sorted = [...merged].sort(
          (a, b) => toNum(a.timestamp) - toNum(b.timestamp)
        );

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
        // 1. Instant load from Dexie — normalize so shape matches API data
        const cachedRaw = await db.messages
          .where("conversationId")
          .equals(conversationId)
          .toArray();

        if (isSubscribed && cachedRaw.length > 0) {
          const cachedMessages = cachedRaw
          .filter((m) => !isMessageDeleted(m))
            .map((m) => normalizeMessage(m, conversationId))
            .sort((a, b) => toNum(a.timestamp) - toNum(b.timestamp));

          setState((prev) => ({
            ...prev,
            messages: cachedMessages,
            loading: false,
          }));
        }

        // 2. Fetch fresh data from network
        const detail = await messagesApi.getConversationDetail(conversationId, 0);

        if (isSubscribed && activeConvId.current === conversationId) {
          const fetchedMessages = applyDetail(detail, 0, conversationId, false);

          // 3. Write normalized shapes back to Dexie
          if (fetchedMessages.length > 0) {
            await db.messages.bulkPut(fetchedMessages as any);
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
        const olderMessages = applyDetail(detail, nextPage, conversationId, true);

        if (olderMessages.length > 0) {
          await db.messages.bulkPut(olderMessages as any);
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
  }, [conversationId, state.loadingMore, state.hasMore, state.page, applyDetail]);

  const refresh = useCallback(async () => {
    if (!conversationId) return;
    setState((prev) => ({ ...prev, loading: true, error: null, messages: [] }));

    try {
      const detail = await messagesApi.getConversationDetail(conversationId, 0);

      if (activeConvId.current === conversationId) {
        const freshMessages = applyDetail(detail, 0, conversationId, false);

        if (freshMessages.length > 0) {
          await db.messages.bulkPut(freshMessages as any);
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
