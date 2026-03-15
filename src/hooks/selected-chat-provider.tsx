import React, {createContext, ReactNode, useContext, useState} from "react";
import {Message} from "@ai-sdk/react";

type SelectedChatContextType = {
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;
    history: Message[] | undefined;
    setHistory: (messages: Message[] | undefined) => void;
};

const SelectedChatContext = createContext<SelectedChatContextType | undefined>(undefined);


/**
 * Provides the context for managing the selected chat, including the selected chat ID,
 * its associated message history, and the methods to update these values.
 *
 * @param {Object} props - Component properties.
 * @param {ReactNode} props.children - The child components that will have access to the SelectedChatContext.
 * @return {JSX.Element} The provider component that wraps its children with the SelectedChatContext.
 */
export function SelectedChatProvider({children}: { children: ReactNode }) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [history, setHistory] = useState<Message[] | undefined>(undefined);

    return (
        <SelectedChatContext.Provider value={{selectedId, setSelectedId, history, setHistory}}>
            {children}
        </SelectedChatContext.Provider>
    );
}

/**
 * Custom hook to access the selected chat context.
 * This hook retrieves the current value of the SelectedChatContext.
 * Ensure that the component using this hook is wrapped within a SelectedChatProvider; otherwise, it will throw an error.
 *
 * @return {Object} The current value of the selected chat context provided by SelectedChatProvider.
 */
export function useSelectedChat() {
    const context = useContext(SelectedChatContext);
    if (!context) throw new Error("useSelectedChat must be used within a SelectedChatProvider");
    return context;
}