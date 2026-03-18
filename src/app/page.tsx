"use client";
import {useState} from "react";
// import Chatbot from "@/app/components/chatbot";
// import ChatHistorySidebar from "@/app/components/sidebar";
import {SelectedChatProvider} from "@/hooks/selected-chat-provider";
// import ChatbotWebsocket from "@/app/components/chatbot-websocket";
import Chatbot from "@/components/chatbot";
import ChatHistorySidebar from "@/components/sidebar";
import ChatbotWebsocket from "@/components/chatbot-websocket";

type ChatbotType = 'direct-response' | 'websocket';

export default function Home() {
    const [selectedChatbot, setSelectedChatbot] = useState<ChatbotType | null>(null);

    const renderChatbotSelection = () => (
        <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Choose Chatbot Type</h2>
            <div className="flex gap-4">
                <button
                    onClick={() => setSelectedChatbot('direct-response')}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Direct Response Chatbot
                </button>
                <button
                    onClick={() => setSelectedChatbot('websocket')}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                    WebSocket Chatbot
                </button>
            </div>
        </div>
    );

    const renderSelectedChatbot = () => {
        if (selectedChatbot === 'direct-response') {
            return <Chatbot/>;
        } else if (selectedChatbot === 'websocket') {
            return <ChatbotWebsocket/>;
        }
        return null;
    };

    return (
        <SelectedChatProvider>
            <div className="flex h-screen bg-gray-100">
                <ChatHistorySidebar/>
                <div className="h-[80vh] w-full">
                    {selectedChatbot ? (
                        <div className="flex flex-col h-screen">
                            <div className="flex justify-between items-center p-4 border-b">
                                <h3 className="text-lg font-semibold">
                                    {selectedChatbot === 'direct-response' ? 'Direct Response Chatbot' : 'WebSocket Chatbot'}
                                </h3>
                                <button
                                    onClick={() => setSelectedChatbot(null)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                    Change Type
                                </button>
                            </div>
                            <div className="flex-1">
                                {renderSelectedChatbot()}
                            </div>
                        </div>
                    ) : (
                        renderChatbotSelection()
                    )}
                </div>
            </div>
        </SelectedChatProvider>
    );
}