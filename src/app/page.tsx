"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { SelectedChatProvider, useSelectedChat } from "@/hooks/selected-chat-provider";
import Chatbot from "./components/chatbot";
import ChatHistorySidebar from "./components/sidebar";
import ChatbotWebsocket from "./components/chatbot-websocket";

type ChatbotType = "direct-response" | "websocket";

function HomeContent() {
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotType | null>(null);
  const { setIsMobileSidebarOpen, selectedId, refreshSelectedChatRaceProof } = useSelectedChat();
  const [switchingType, setSwitchingType] = useState(false);

  const handleSetChatType = async (type: ChatbotType | null) => {
    try {
      setSwitchingType(true);

      if (selectedId) {
        await refreshSelectedChatRaceProof(selectedId);
      }

      setSelectedChatbot(type);
    } finally {
      setSwitchingType(false);
    }
  };

  const renderChatbotSelection = () => (
    <div className="flex h-full items-center justify-center px-4 py-6">
      <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Choose Chatbot Type
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          Pick how you want to interact with the assistant.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => void handleSetChatType("direct-response")}
            disabled={switchingType}
            className="rounded-2xl bg-blue-600 px-5 py-4 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            Direct Response Chatbot
          </button>
          <button
            onClick={() => void handleSetChatType("websocket")}
            disabled={switchingType}
            className="rounded-2xl bg-green-600 px-5 py-4 text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            WebSocket Chatbot
          </button>
        </div>
      </div>
    </div>
  );

  const renderSelectedChatbot = () => {
    if (selectedChatbot === "direct-response") return <Chatbot />;
    if (selectedChatbot === "websocket") return <ChatbotWebsocket />;
    return null;
  };

  return (
    <div className="flex h-[100dvh] bg-gray-100 text-gray-900">
      <ChatHistorySidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        {selectedChatbot ? (
          <>
            <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-gray-200 bg-white/95 px-3 backdrop-blur sm:h-16 sm:px-4 lg:px-6">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 lg:hidden"
                  aria-label="Open chat history"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <h3 className="truncate text-sm font-semibold sm:text-base lg:text-lg">
                  {selectedChatbot === "direct-response"
                    ? "Direct Response Chatbot"
                    : "WebSocket Chatbot"}
                </h3>
              </div>

              <button
                onClick={() => void handleSetChatType(null)}
                disabled={switchingType}
                className="shrink-0 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                Change Type
              </button>
            </header>

            <div className="min-h-0 flex-1">{renderSelectedChatbot()}</div>
          </>
        ) : (
          renderChatbotSelection()
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <SelectedChatProvider>
      <HomeContent />
    </SelectedChatProvider>
  );
}