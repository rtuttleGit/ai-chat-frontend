import {useEffect, useRef, useState} from 'react';
import {ArrowUp, Square} from 'lucide-react';
import {useSelectedChat} from "@/hooks/selected-chat-provider";
import {supabase} from "@/supabase-client";
import {Message} from "@ai-sdk/react";


/**
 * The ChatbotWebsocket function establishes a context-based websocket
 * communication for a chat interface. It retrieves the selected chat ID
 * and history from the state and renders the chat interface using the
 * retrieved data. If no chat ID is selected, it assigns a default value
 * of 'none' for the chat key.
 *
 * @return {JSX.Element} The rendered chat component with the associated chat data.
 */
export default function ChatbotWebsocket() {
    const {selectedId, history} = useSelectedChat();
    const chatKey = selectedId || 'none';

    return (
        <ChatInner key={chatKey} selectedId={selectedId} initialMessages={history}/>
    );
}

/**
 * Renders a chat component for managing messages, user input, and the message streaming process.
 *
 * @param {Object} props The input parameters for the component.
 * @param {string | null} props.selectedId The selected chat ID for identifying the chat session.
 * @param {Message[] | undefined} props.initialMessages The initial set of messages to be displayed in the chat.
 * @return {JSX.Element} Returns the rendered chat interface component.
 */
function ChatInner({
                       selectedId,
                       initialMessages,
                   }: {
    selectedId: string | null,
    initialMessages: Message[] | undefined
}) {
    const [messages, setMessages] = useState(initialMessages || []);
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<'ready' | 'streaming' | 'submitted'>('ready');
    const [isComposing, setIsComposing] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const typingInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!selectedId) return;
        setMessages(initialMessages || []); // reset messages on chat switch

        setStatus('ready');
        const channel = supabase.channel(`schema-db-changes`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'chats',
                filter: `id=eq.${selectedId}`
            }, payload => {
                console.log(payload)
                const message_history = payload.new.message_history
                if (message_history.length > 0) {
                    streamInMessage(message_history[message_history.length - 1].content);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            if (typingInterval.current) clearInterval(typingInterval.current);
        };
    }, [selectedId]);

function streamInMessage(fullText: string) {
    setStatus('streaming');
    
    if (typingInterval.current) {
        clearInterval(typingInterval.current);
        typingInterval.current = null;
    }
    
    // @ts-ignore
    setMessages(prev => [
        ...prev,
        {role: 'assistant', content: ''}
    ]);
    
    setTimeout(() => {
        let currentIndex = 0;
        const step = 2; // smaller steps
        
        typingInterval.current = setInterval(() => {
            const nextIndex = Math.min(currentIndex + step, fullText.length);
            const textToShow = fullText.slice(0, nextIndex);
            
            setMessages(prevMsgs => {
                const temp = [...prevMsgs];
                if (temp.length > 0) {
                    temp[temp.length - 1] = {
                        ...temp[temp.length - 1],
                        content: textToShow
                    };
                }
                return temp;
            });
            
            currentIndex = nextIndex;
            
            if (currentIndex >= fullText.length) {
                if (typingInterval.current) {
                    clearInterval(typingInterval.current);
                    typingInterval.current = null;
                }
                setStatus('ready');
            }
        }, 15); // slower for debugging
    }, 150); // small delay to ensure message is added first
}

    const onSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        e?.preventDefault?.();
        if (!input.trim() || isComposing) return;
        setStatus('submitted');
        // @ts-ignore
        setMessages(prev => [
            ...prev,
            {
                role: 'user',
                content: input
            }
        ]);
        const content = input;
        const role = "user";
        setInput('');

        try {
            await fetch('/api/chat/websocket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectedId,
                    role,
                    content,
                }),
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            setStatus('ready');
        }

    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);


    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault();
            onSubmit();
        }
    };

    const stopStreaming = () => {
        if (typingInterval.current) clearInterval(typingInterval.current);
        setStatus('ready');
    };

    return (
        <div className="flex flex-col bg-white h-[95vh] w-full">
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
                                    {/*<Spinner />*/}
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
                  onChange={e => setInput(e.target.value)}
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
                                    onClick={e => {
                                        e.stopPropagation();
                                        stopStreaming();
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