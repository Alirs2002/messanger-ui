// src/hooks/useMessages.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { messagesApi } from "../services/apiService";
import type {
  Message,
  Conversation,
  ConversationDetail,
} from "../types/messenger";
import type { PersianDate } from "../types/messenger";

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
      setState((prev) => {
        const newMessages = detail.messages.content;
        const merged = prepend
          ? [...newMessages, ...prev.messages]
          : newMessages;

        //const sorted = [...merged].sort(
        //(a, b) => toNum(a.timestamp) - toNum(b.timestamp),
        //);
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
    },
    [],
  );

  useEffect(() => {
    if (!conversationId) return;

    activeConvId.current = conversationId;
    setState((prev) => ({ ...prev, loading: true, error: null, messages: [] }));

    messagesApi
      .getConversationDetail(conversationId, 0)
      .then((detail) => {
        if (activeConvId.current !== conversationId) return;
        applyDetail(detail, 0, false);
      })
      .catch((err) => {
        if (activeConvId.current !== conversationId) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "خطا در دریافت پیام‌ها",
        }));
      });

    return () => {
      activeConvId.current = null;
    };
  }, [conversationId, applyDetail]);

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || state.loadingMore || !state.hasMore) return;

    setState((prev) => ({ ...prev, loadingMore: true }));

    try {
      const nextPage = state.page + 1;
      const detail = await messagesApi.getNextPage(conversationId, nextPage);
      applyDetail(detail, nextPage, true);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loadingMore: false,
        error: err instanceof Error ? err.message : "خطا در بارگذاری بیشتر",
      }));
    }
  }, [
    conversationId,
    state.loadingMore,
    state.hasMore,
    state.page,
    applyDetail,
  ]);

  const refresh = useCallback(() => {
    if (!conversationId) return;
    setState((prev) => ({ ...prev, loading: true, error: null, messages: [] }));
    messagesApi
      .getConversationDetail(conversationId, 0)
      .then((detail) => applyDetail(detail, 0, false))
      .catch((err) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "خطا",
        }));
      });
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
