import { useState } from "react";
import UploadZone from "./components/UploadZone";
import ChatInterface from "./components/ChatInterface";
import Sidebar from "./components/Sidebar";
import { useChatHistory } from "./hooks/Usechathistory";

export default function App() {
  const [session, setSession] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { chats, createChat, updateMessages, deleteChat, clearAll } = useChatHistory();

  const handleUploadSuccess = (sessionData) => {
    const chat = createChat(sessionData);
    setSession({ ...sessionData, chatId: chat.id });
  };

  const handleSelectChat = (chat) => {
    // Restore session from saved chat
    setSession({
      sessionId: chat.id,
      filename: chat.filename,
      pages: chat.pages,
      wordCount: chat.wordCount,
      chatId: chat.id,
    });
  };

  const handleMessagesUpdate = (messages) => {
    if (session?.chatId) updateMessages(session.chatId, messages);
  };

  const handleReset = () => setSession(null);

  const activeChat = chats.find((c) => c.id === session?.chatId);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {session && (
        <Sidebar
          chats={chats}
          activeChatId={session?.chatId}
          onSelectChat={handleSelectChat}
          onDeleteChat={deleteChat}
          onClearAll={clearAll}
          onNewPDF={handleReset}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />
      )}

      {session ? (
        <ChatInterface
          session={session}
          initialMessages={activeChat?.messages}
          onMessagesUpdate={handleMessagesUpdate}
          onReset={handleReset}
          sidebarCollapsed={sidebarCollapsed}
        />
      ) : (
        <UploadZone onUploadSuccess={handleUploadSuccess} />
      )}
    </div>
  );
}