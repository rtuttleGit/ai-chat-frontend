'use client';

import {useEffect, useState} from "react";
import {MessageSquare, Plus} from "lucide-react";
import {supabase} from "@/supabase-client";
import {useSelectedChat} from "@/hooks/selected-chat-provider";

/**
 * ChatHistorySidebar is a React component that renders a sidebar displaying chat history.
 * It allows users to view existing chats, select a chat to display its messages, and create a new chat.
 * The component fetches data from the database and manages the loading and error states.
 *
 * @return {JSX.Element} A sidebar component containing chat history with options for selection and creation of new chats.
 */
export default function ChatHistorySidebar() {
    const {selectedId, setSelectedId, history, setHistory} = useSelectedChat();

    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            setLoading(true);
            const {data, error} = await supabase
                .from('chats')
                .select('*')
                .order('updated_at', {ascending: false});

            if (error) throw error;

            if (data?.length === 0) {
                handleNewChat();
            } else {
                setChats(data || []);
                if (data && data.length > 0 && !selectedId) {
                    setSelectedId(data[0].id);
                    setHistory(data[0].message_history);
                }
            }


        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = async () => {
        setLoading(true);
        setError(null);
        try {
            // Adjust columns/values as relevant for your schema
            const {data, error} = await supabase
                .from('chats')
                .insert([{ /* any default fields, e.g. title: "New Chat" */}])
                .select()
                .single();

            if (error) throw error;
            // Add the new chat on top and set it active
            setChats([data, ...chats]);
            setSelectedId(data.id);
            setHistory(data.messages);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading chats...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <aside className="w-72 flex flex-col bg-white border-r border-gray-200">
            <header className="px-5 py-4 border-b flex items-center justify-between">
                <span className="text-xl font-semibold text-amber-700">Chat History</span>
                <button
                    className="text-amber-600 hover:text-amber-800"
                    title="New Conversation"
                    onClick={handleNewChat}
                >
                    <Plus size={20}/>
                </button>
            </header>
            <nav className="flex-1 overflow-y-auto">
                <ul className="divide-y">
                    {chats.map(conv => (
                        <li
                            key={conv.id}
                            onClick={() => {
                                setHistory(conv.message_history)
                                setSelectedId(conv.id)
                            }}
                            className={`cursor-pointer px-5 py-4 flex flex-col gap-1 ${
                                conv.id === selectedId
                                    ? "bg-amber-50 border-l-4 border-amber-500"
                                    : "hover:bg-gray-50"
                            }`}
                        >
                            <div className="flex items-center gap-2 text-gray-900">
                                <MessageSquare size={18} className="text-amber-600"/>
                                <span
                                    className="font-medium">{conv?.message_history && conv.message_history[0].content}</span>
                            </div>
                            <span
                                className="text-gray-500 text-sm truncate">{new Date(conv.updated_at).toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
}