export default function Sidebar({ chats, activeChatId, onSelectChat, onDeleteChat, onClearAll, onNewPDF, collapsed, onToggle }) {
  const formatTime = (ts) => {
    if (!ts) return "";
    const diff = Date.now() - ts;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <>
      {/* Collapsed toggle button */}
      {collapsed && (
        <button
          onClick={onToggle}
          title="Show history"
          style={{
            position: "fixed", top: "1rem", left: "1rem", zIndex: 100,
            width: "38px", height: "38px", borderRadius: "10px",
            background: "var(--bg2)", border: "1px solid var(--border2)",
            color: "var(--text2)", cursor: "pointer", fontSize: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ☰
        </button>
      )}

      {/* Sidebar panel */}
      <div style={{
        width: collapsed ? "0" : "260px",
        minWidth: collapsed ? "0" : "260px",
        height: "100vh",
        background: "var(--bg2)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "all 0.25s ease",
        opacity: collapsed ? 0 : 1,
      }}>
        {/* Header */}
        <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>
            DocuChat
          </span>
          <button onClick={onToggle} title="Collapse" style={{ background: "transparent", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: "16px", padding: "2px 6px", borderRadius: "6px" }}>
            ✕
          </button>
        </div>

        {/* New PDF button */}
        <div style={{ padding: "10px" }}>
          <button
            onClick={onNewPDF}
            style={{
              width: "100%", padding: "9px", borderRadius: "10px",
              background: "rgba(124,110,247,0.12)", border: "1px dashed rgba(124,110,247,0.35)",
              color: "var(--accent2)", cursor: "pointer", fontSize: "13px",
              fontFamily: "var(--font-body)", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "6px", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(124,110,247,0.2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(124,110,247,0.12)"}
          >
            + Upload New PDF
          </button>
        </div>

        {/* Chat list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
          {chats.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text3)", fontSize: "12px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📭</div>
              No chats yet.<br />Upload a PDF to start!
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                style={{
                  padding: "10px 10px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  background: activeChatId === chat.id ? "rgba(124,110,247,0.12)" : "transparent",
                  border: activeChatId === chat.id ? "1px solid rgba(124,110,247,0.25)" : "1px solid transparent",
                  marginBottom: "3px",
                  transition: "all 0.15s",
                  position: "relative",
                  group: "true",
                }}
                onMouseEnter={(e) => {
                  if (activeChatId !== chat.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.querySelector(".del-btn").style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  if (activeChatId !== chat.id) e.currentTarget.style.background = "transparent";
                  e.currentTarget.querySelector(".del-btn").style.opacity = "0";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ fontSize: "14px", flexShrink: 0, marginTop: "1px" }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: "12.5px", fontWeight: 500, color: "var(--text)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      marginBottom: "3px",
                    }}>
                      {chat.filename.replace(".pdf", "").replace(".PDF", "")}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text3)" }}>
                      {chat.messages.length - 1} messages · {formatTime(chat.updatedAt || chat.createdAt)}
                    </p>
                  </div>
                  <button
                    className="del-btn"
                    onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                    style={{
                      opacity: 0, background: "transparent", border: "none",
                      color: "var(--text3)", cursor: "pointer", fontSize: "13px",
                      padding: "2px 4px", borderRadius: "4px", flexShrink: 0,
                      transition: "opacity 0.15s",
                    }}
                    title="Delete chat"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {chats.length > 0 && (
          <div style={{ padding: "10px", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => { if (confirm("Clear all chat history?")) onClearAll(); }}
              style={{
                width: "100%", padding: "7px", borderRadius: "8px",
                background: "transparent", border: "1px solid var(--border)",
                color: "var(--text3)", cursor: "pointer", fontSize: "12px",
                fontFamily: "var(--font-body)",
              }}
            >
              🗑 Clear all history
            </button>
          </div>
        )}
      </div>
    </>
  );
}