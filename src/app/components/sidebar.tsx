"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  X,
} from "lucide-react";
import { Message } from "@ai-sdk/react";
import { supabase } from "@/supabase-client";
import { useSelectedChat } from "@/hooks/selected-chat-provider";

type ChatRow = {
  id: string;
  updated_at: string;
  message_history?: Message[];
};

function getChatTitle(chat: ChatRow) {
  const firstUserMessage = chat.message_history?.find((m) => m.role === "user")?.content?.trim();
  return firstUserMessage || "New conversation";
}

export default function ChatHistorySidebar() {
  const {
    selectedId,
    setSelectedId,
    setHistory,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isDesktopSidebarCollapsed,
    setIsDesktopSidebarCollapsed,
    refreshSelectedChat,
  } = useSelectedChat();

  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingChatId, setSelectingChatId] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const rows = (data as ChatRow[]) || [];
      setChats(rows);

      if (rows.length === 0) {
        await handleNewChat();
        return;
      }

      if (!selectedId) {
        await handleSelectChat(rows[0].id, { closeMobile: false });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      setCreatingChat(true);
      setError(null);

      const { data, error } = await supabase.from("chats").insert([{}]).select().single();

      if (error) throw error;

      const newChat = data as ChatRow;

      setChats((prev) => [newChat, ...prev]);
      setSelectedId(newChat.id);
      setHistory(newChat.message_history ?? []);
      setIsMobileSidebarOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create chat");
    } finally {
      setCreatingChat(false);
    }
  };

  const handleSelectChat = async (
    chatId: string,
    options?: { closeMobile?: boolean }
  ) => {
    try {
      setSelectingChatId(chatId);
      setError(null);
      setSelectedId(chatId);

      const freshHistory = await refreshSelectedChat(chatId);

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                message_history: freshHistory,
                updated_at: new Date().toISOString(),
              }
            : chat
        )
      );

      if (options?.closeMobile !== false) {
        setIsMobileSidebarOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chat");
    } finally {
      setSelectingChatId(null);
    }
  };

  const desktopWidthClass = isDesktopSidebarCollapsed ? "lg:w-20" : "lg:w-72";

  return (
    <>
      {isMobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close chat history overlay"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex h-[100dvh] flex-col border-r border-gray-200 bg-white transition-all duration-300",
          "w-[85vw] max-w-[20rem] lg:static lg:z-0",
          desktopWidthClass,
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <header className="flex h-14 items-center justify-between border-b px-3 sm:h-16 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            {!isDesktopSidebarCollapsed && (
              <span className="truncate text-xl font-semibold text-amber-700">Chat History</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50 hover:text-amber-800 disabled:opacity-50"
              title="New conversation"
              onClick={() => void handleNewChat()}
              disabled={creatingChat}
            >
              <Plus size={18} />
            </button>

            <button
              type="button"
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:inline-flex"
              title={isDesktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            >
              {isDesktopSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
              title="Close sidebar"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <nav className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="px-3 py-4 text-sm text-gray-500">Loading chats...</div>
          ) : error ? (
            <div className="px-3 py-4 text-sm text-red-600">{error}</div>
          ) : chats.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500">No chats yet.</div>
          ) : (
            <ul className="space-y-1">
              {chats.map((chat) => {
                const active = chat.id === selectedId;
                const isBusy = selectingChatId === chat.id;

                return (
                  <li key={chat.id}>
                    <button
                      type="button"
                      onClick={() => void handleSelectChat(chat.id)}
                      disabled={isBusy}
                      className={[
                        "w-full rounded-xl text-left transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-70",
                        active ? "bg-amber-50 text-amber-900" : "text-gray-700 hover:bg-gray-50",
                        isDesktopSidebarCollapsed
                          ? "flex h-12 items-center justify-center px-2"
                          : "flex items-start gap-3 px-3 py-3",
                      ].join(" ")}
                      title={isDesktopSidebarCollapsed ? getChatTitle(chat) : undefined}
                    >
                      <MessageSquare
                        size={18}
                        className={`shrink-0 ${active ? "text-amber-600" : "text-gray-400"}`}
                      />

                      {!isDesktopSidebarCollapsed && (
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{getChatTitle(chat)}</div>
                          <div className="mt-1 truncate text-xs text-gray-500">
                            {isBusy
                              ? "Loading latest messages..."
                              : new Date(chat.updated_at).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        <div className="hidden border-t p-2 lg:block">
          <button
            type="button"
            onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            className="flex w-full items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            {isDesktopSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Collapse
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}