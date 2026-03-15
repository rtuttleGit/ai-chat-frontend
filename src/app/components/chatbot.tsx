'use client';

import {Message, useChat} from '@ai-sdk/react';
import {useEffect, useRef, useState} from "react";
import {ArrowUp, Square} from 'lucide-react';
import {useSelectedChat} from "@/hooks/selected-chat-provider";

/**
 * Component that renders a spinner animation using three pulsing dots.
 * The animation is styled with a small delay between each dot to create a sequential effect.
 *
 * @return {JSX.Element} A JSX element representing a loading spinner.
 */
function Spinner() {
    return (
        <div className="flex items-center space-x-2 text-amber-700">
            <div className="w-2 h-2 bg-amber-700 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-amber-700 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-amber-700 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
    );
}

/**
 * Chatbot component that initializes and renders the chat interface.
 * It utilizes the selected chat ID and chat history to manage chat logic.
 * The component resets its internal state when the selected chat ID changes.
 *
 * @return {JSX.Element} The ChatInner component with the appropriate key, selected ID, and initial messages based on the current chat context.
 */
export default function Chatbot() {
    const {selectedId, history} = useSelectedChat();

    // Key the whole chat logic to selectedId, so switching will reset useChat and its internal state
    const chatKey = selectedId || 'none';

    return (
        <ChatInner key={chatKey} selectedId={selectedId} initialMessages={history}/>
    );
}


/**
 * A React component that renders a chat interface along with input functionalities
 * for sending messages and auto-scrolling behavior for displaying conversation history.
 *
 * @param {Object} props - The props object to configure the component behavior.
 * @param {string|null} props.selectedId - The ID of the selected user or session for the chat.
 * @param {Message[]|undefined} props.initialMessages - An optional array of initial messages to populate the chat interface.
 * @return {JSX.Element} The rendered chat interface component.
 */
function ChatInner({
                       selectedId,
                       initialMessages
                   }: {
    selectedId: string | null,
    initialMessages: Message[] | undefined
}) {
    const {messages, input, handleInputChange, handleSubmit, status, stop} = useChat({
        streamProtocol: "data",
        api: "/api/chat/direct",
        initialMessages
    });

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const [isComposing, setIsComposing] = useState(false);


    const scrollToBottom = () => {
        // @ts-ignore
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        console.log(messages)
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            // @ts-ignore
            textareaRef.current.style.height = 'auto';
            // @ts-ignore
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);


    const onSubmit = (e: { preventDefault?: () => void; } | undefined) => {
        e?.preventDefault?.();
        if (input.trim() && !isComposing) {
            handleSubmit(e, {
                body: {
                    selectedId,
                }
            });
        }
    };

    // @ts-ignore
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault();
            onSubmit(e);
        }
    };

    return (
        <div className="flex flex-col bg-white h-[95vh]">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 py-8">
                    {messages.length === 0 && (
                        <div className="text-center py-20">
                            <h1 className="text-2xl font-normal text-gray-900 mb-2">Welcome to Launchpad chat
                                example</h1>
                            <p className="text-gray-600">Start a conversation</p>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <div key={index} className="mb-6">
                            {message.role === 'user' ? (
                                <div className="flex justify-end">
                                    <div className="max-w-[70%] bg-gray-100 rounded-3xl px-5 py-3">
                                        <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex">
                                    <div className="max-w-[70%]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div
                                                className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center">
                                                <span className="text-white text-xs font-medium">C</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">Launchpad</span>
                                        </div>
                                        <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                                            {message.content}
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {status === 'streaming' && (
                        <div className="mb-6">
                            <div className="flex">
                                <div className="max-w-[70%]">
                                    {/*<div className="flex items-center gap-2 mb-1">*/}
                                    {/*</div>*/}
                                    <Spinner/>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef}/>
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            name="prompt"
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={() => setIsComposing(false)}
                            disabled={status !== 'ready'}
                            placeholder="Message Launchpad..."
                            rows={4}
                            className="w-full px-4 py-3 pr-12 resize-none rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-gray-900 placeholder-gray-500"
                            style={{minHeight: '48px', maxHeight: '200px'}}
                        />

                        <button
                            onClick={onSubmit}
                            disabled={status !== 'ready' || !input.trim()}
                            className="absolute bottom-2 right-2 p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {(status === 'submitted' || status === 'streaming') ? (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        stop();
                                    }}
                                    className="w-8 h-8 bg-amber-600 hover:bg-amber-700 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors"
                                >
                                    <Square className="w-4 h-4 fill-current"/>
                                </div>
                            ) : (
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                        input.trim() && status === 'ready'
                                            ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}>
                                    <ArrowUp className="w-4 h-4" strokeWidth={3}/>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}