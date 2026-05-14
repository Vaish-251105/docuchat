import { useState, useEffect } from "react";

const STORAGE_KEY = "docuchat_history";
const MAX_CHATS = 20;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage full — remove oldest
    const trimmed = history.slice(-10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
}

export function useChatHistory() {
  const [chats, setChats] = useState(loadHistory);

  useEffect(() => {
    saveHistory(chats);
  }, [chats]);

  // Create a new chat entry when PDF is uploaded
  const createChat = (session) => {
    const chat = {
      id: session.sessionId,
      filename: session.filename,
      pages: session.pages,
      wordCount: session.wordCount,
      createdAt: Date.now(),
      messages: [
        {
          role: "assistant",
          content: `I've read **${session.filename}** (${session.pages} pages, ~${session.wordCount.toLocaleString()} words). What would you like to know?`,
        },
      ],
    };
    setChats((prev) => {
      const filtered = prev.filter((c) => c.id !== chat.id);
      return [chat, ...filtered].slice(0, MAX_CHATS);
    });
    return chat;
  };

  // Update messages for a chat
  const updateMessages = (chatId, messages) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, messages, updatedAt: Date.now() } : c))
    );
  };

  // Delete a chat
  const deleteChat = (chatId) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
  };

  // Clear all
  const clearAll = () => {
    setChats([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { chats, createChat, updateMessages, deleteChat, clearAll };
}