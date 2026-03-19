"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Message } from "@ai-sdk/react";
import { supabase } from "@/supabase-client";

type SelectedChatContextType = {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  history: Message[] | undefined;
  setHistory: (messages: Message[] | undefined) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  isDesktopSidebarCollapsed: boolean;
  setIsDesktopSidebarCollapsed: (collapsed: boolean) => void;
  refreshSelectedChat: (chatId?: string | null) => Promise<Message[]>;
  refreshSelectedChatRaceProof: (chatId?: string | null) => Promise<Message[]>;
};

const SelectedChatContext = createContext<SelectedChatContextType | undefined>(undefined);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function SelectedChatProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<Message[] | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  const refreshSelectedChat = useCallback(
    async (chatId?: string | null) => {
      const idToLoad = chatId ?? selectedId;

      if (!idToLoad) {
        setHistory([]);
        return [];
      }

      const { data, error } = await supabase
        .from("chats")
        .select("id, message_history")
        .eq("id", idToLoad)
        .single();

      if (error) {
        throw error;
      }

      const nextHistory = (data?.message_history ?? []) as Message[];
      setHistory(nextHistory);
      return nextHistory;
    },
    [selectedId]
  );

  const refreshSelectedChatRaceProof = useCallback(
    async (chatId?: string | null) => {
      const first = await refreshSelectedChat(chatId);
      await sleep(250);
      const second = await refreshSelectedChat(chatId);

      return second.length >= first.length ? second : first;
    },
    [refreshSelectedChat]
  );

  const value = useMemo(
    () => ({
      selectedId,
      setSelectedId,
      history,
      setHistory,
      isMobileSidebarOpen,
      setIsMobileSidebarOpen,
      isDesktopSidebarCollapsed,
      setIsDesktopSidebarCollapsed,
      refreshSelectedChat,
      refreshSelectedChatRaceProof,
    }),
    [
      selectedId,
      history,
      isMobileSidebarOpen,
      isDesktopSidebarCollapsed,
      refreshSelectedChat,
      refreshSelectedChatRaceProof,
    ]
  );

  return <SelectedChatContext.Provider value={value}>{children}</SelectedChatContext.Provider>;
}

export function useSelectedChat() {
  const context = useContext(SelectedChatContext);

  if (!context) {
    throw new Error("useSelectedChat must be used within a SelectedChatProvider");
  }

  return context;
}