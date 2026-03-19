"use client";

import { Message, useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { useSelectedChat } from "@/hooks/selected-chat-provider";

function Spinner() {
  return (
    <div className="flex items-center space-x-2 text-amber-700">
      <div className="h-2 w-2 animate-pulse rounded-full bg-amber-700" />
      <div
        className="h-2 w-2 animate-pulse rounded-full bg-amber-700"
        style={{ animationDelay: "0.2s" }}
      />
      <div
        className="h-2 w-2 animate-pulse rounded-full bg-amber-700"
        style={{ animationDelay: "0.4s" }}
      />
    </div>
  );
}

export default function Chatbot() {
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
  const { refreshSelectedChatRaceProof } = useSelectedChat();

  const {
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    status,
    stop,
  } = useChat({
    streamProtocol: "data",
    api: "/api/chat/direct",
    initialMessages: initialMessages ?? [],
    onFinish: async () => {
      if (selectedId) {
        await refreshSelectedChatRaceProof(selectedId);
      }
    },
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    setMessages(initialMessages ?? []);
    setInput("");
  }, [selectedId, initialMessages, setMessages, setInput]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [input]);

  const onSubmit = (e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    if (!input.trim() || isComposing || !selectedId) return;

    handleSubmit(e as never, {
      body: {
        selectedId,
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          {messages.length === 0 && (
            <div className="py-16 text-center sm:py-24">
              <h1 className="mb-2 text-2xl font-normal text-gray-900">
                Welcome to Launchpad chat example
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
                        <span className="text-xs font-medium text-white">C</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">Launchpad</span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-7 text-gray-900 sm:text-[15px]">
                      {message.content}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {status === "streaming" && (
            <div className="mb-6">
              <Spinner />
            </div>
          )}

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
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              disabled={status !== "ready" || !selectedId}
              placeholder="Message Launchpad..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 pr-14 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ minHeight: "56px", maxHeight: "200px" }}
            />

            <button
              type="button"
              onClick={onSubmit}
              disabled={status !== "ready" || !input.trim() || !selectedId}
              className="absolute bottom-2 right-2 p-1"
            >
              {status === "submitted" || status === "streaming" ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    stop();
                  }}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-amber-600 text-white transition-colors hover:bg-amber-700"
                >
                  <Square className="h-4 w-4 fill-current" />
                </span>
              ) : (
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                    input.trim() && status === "ready" && selectedId
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