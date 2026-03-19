"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Message } from "@ai-sdk/react";
import { useSelectedChat } from "@/hooks/selected-chat-provider";
import { supabase } from "@/supabase-client";

export default function RealtimeChat() {
  const { selectedId, history } = useSelectedChat();
  const chatKey = selectedId || "none";

  return <ChatInner key={chatKey} selectedId={selectedId} initialMessages={history} />;
}

function ChatInner({
  selectedId,
  initialMessages,
}: {
  selectedId: string | null;
  initialMessages: Message[] | undefined;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"ready" | "streaming" | "submitted">("ready");
  const [isComposing, setIsComposing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingInterval = useRef<NodeJS.Timeout | null>(null);
  const lastAssistantContentRef = useRef<string | null>(null);

  useEffect(() => {
    setMessages(initialMessages || []);
    setStatus("ready");

    const assistantMessages = (initialMessages || []).filter((m) => m.role === "assistant");
    const lastAssistant = assistantMessages[assistantMessages.length - 1];
    lastAssistantContentRef.current = lastAssistant?.content ?? null;

    if (typingInterval.current) {
      clearInterval(typingInterval.current);
      typingInterval.current = null;
    }
  }, [selectedId, initialMessages]);

  useEffect(() => {
    if (!selectedId) return;

    const channel = supabase
      .channel(`schema-db-changes-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chats",
          filter: `id=eq.${selectedId}`,
        },
        (payload) => {
          const messageHistory = payload.new.message_history as Message[] | undefined;
          if (!messageHistory || messageHistory.length === 0) return;

          const lastMessage = messageHistory[messageHistory.length - 1];
          if (!lastMessage || lastMessage.role !== "assistant") return;

          const lastAssistantContent = lastMessage.content ?? "";

          // Ignore replay of the same assistant message already present
          if (lastAssistantContentRef.current === lastAssistantContent) {
            return;
          }

          // If DB now has the full message history, sync to it first
          setMessages(messageHistory);
          lastAssistantContentRef.current = lastAssistantContent;
          setStatus("ready");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingInterval.current) {
        clearInterval(typingInterval.current);
        typingInterval.current = null;
      }
    };
  }, [selectedId]);

  const onSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault?.();
    if (!input.trim() || isComposing) return;

    setStatus("submitted");

    const outgoingMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, outgoingMessage]);

    const content = input;
    const role = "user";
    setInput("");

    try {
      await fetch("/api/chat/websocket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedId,
          role,
          content,
        }),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setStatus("ready");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      void onSubmit();
    }
  };

  const stopStreaming = () => {
    if (typingInterval.current) {
      clearInterval(typingInterval.current);
      typingInterval.current = null;
    }
    setStatus("ready");
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          {messages.length === 0 && (
            <div className="py-16 text-center sm:py-24">
              <h1 className="mb-2 text-2xl font-normal text-gray-900">
                Welcome to AI chat example
              </h1>
              <p className="text-gray-600">Start a conversation</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={message.id ?? index} className="mb-6">
              {message.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-3xl bg-gray-100 px-4 py-3 sm:max-w-[75%] sm:px-5">
                    <p className="whitespace-pre-wrap text-sm text-gray-900 sm:text-[15px]">
                      {message.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex">
                  <div className="max-w-[95%] sm:max-w-[80%]">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600">
                        <span className="text-xs font-medium text-white">AI</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">Pizza Assistant</span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-7 text-gray-900 sm:text-[15px]">
                      {message.content}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white">
        <div className="mx-auto w-full max-w-4xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              name="prompt"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              disabled={status !== "ready"}
              placeholder="Message AI..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 pr-14 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ minHeight: "56px", maxHeight: "200px" }}
            />

            <button
              type="button"
              onClick={onSubmit}
              disabled={status !== "ready" || !input.trim()}
              className="absolute bottom-2 right-2 p-1"
            >
              {status === "submitted" || status === "streaming" ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    stopStreaming();
                  }}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-amber-600 text-white transition-colors hover:bg-amber-700"
                >
                  <Square className="h-4 w-4 fill-current" />
                </span>
              ) : (
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                    input.trim() && status === "ready"
                      ? "cursor-pointer bg-amber-600 text-white hover:bg-amber-700"
                      : "cursor-not-allowed bg-gray-300 text-gray-500"
                  }`}
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={3} />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}