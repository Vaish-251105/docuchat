import { useState, useRef, useEffect } from "react";
import api from "../api";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  "Summarize this document",
  "What are the key points?",
  "List the main topics covered",
  "What conclusions are drawn?",
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} title="Copy" style={{ background: "transparent", border: "none", cursor: "pointer", color: copied ? "var(--green)" : "var(--text3)", fontSize: "13px", padding: "4px 6px", borderRadius: "6px", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "4px" }}
      onMouseEnter={(e) => e.currentTarget.style.color = "var(--text2)"}
      onMouseLeave={(e) => e.currentTarget.style.color = copied ? "var(--green)" : "var(--text3)"}
    >
      {copied ? "✓ Copied" : "⎘ Copy"}
    </button>
  );
}

function UserMessage({ content, onEdit, isLast }) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(content);
  const editRef = useRef(null);

  useEffect(() => { if (editing) { editRef.current?.focus(); editRef.current?.select(); } }, [editing]);

  const submitEdit = () => {
    const trimmed = editVal.trim();
    if (trimmed && trimmed !== content) onEdit(trimmed);
    setEditing(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(); }
    if (e.key === "Escape") { setEditVal(content); setEditing(false); }
  };

  if (editing) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", alignItems: "flex-end" }}>
        <div style={{ maxWidth: "72%", width: "100%" }}>
          <textarea
            ref={editRef}
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onKeyDown={handleKey}
            rows={2}
            style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--accent)", borderRadius: "14px 14px 4px 14px", padding: "12px 16px", color: "var(--text)", fontSize: "14px", fontFamily: "var(--font-body)", resize: "none", outline: "none", lineHeight: 1.5 }}
            onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
          />
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "6px" }}>
            <button onClick={() => { setEditVal(content); setEditing(false); }}
              style={{ background: "transparent", border: "1px solid var(--border2)", borderRadius: "8px", padding: "5px 14px", color: "var(--text2)", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-body)" }}>
              Cancel
            </button>
            <button onClick={submitEdit} disabled={!editVal.trim()}
              style={{ background: "var(--accent)", border: "none", borderRadius: "8px", padding: "5px 14px", color: "white", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-body)", fontWeight: 500 }}>
              Send ↑
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", gap: "6px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Edit + Copy actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end", justifyContent: "flex-start", opacity: hovered ? 1 : 0, transition: "opacity 0.15s", paddingTop: "8px" }}>
        <button onClick={() => setEditing(true)} title="Edit message"
          style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "7px", padding: "3px 8px", color: "var(--text3)", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
          ✎ Edit
        </button>
        <CopyButton text={content} />
      </div>
      <div style={{ maxWidth: "72%", padding: "12px 16px", borderRadius: "18px 18px 4px 18px", background: "var(--accent)", color: "white", fontSize: "14px", lineHeight: 1.65 }}>
        {content}
      </div>
    </div>
  );
}

function AssistantMessage({ content, isError, onRegenerate, isLast, loading }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div style={{ width: "28px", height: "28px", background: "rgba(124,110,247,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0, marginTop: "4px", border: "1px solid rgba(124,110,247,0.2)" }}>✦</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ padding: "12px 16px", borderRadius: "4px 18px 18px 18px", background: "var(--bg3)", border: `1px solid ${isError ? "rgba(248,113,113,0.2)" : "var(--border)"}`, color: isError ? "var(--red)" : "var(--text)", fontSize: "14px", lineHeight: 1.65 }}>
          <div className="markdown-content">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>

        {/* Action bar below message */}
        <div style={{ display: "flex", gap: "4px", marginTop: "4px", opacity: hovered && !loading ? 1 : 0, transition: "opacity 0.15s" }}>
          <CopyButton text={content} />
          {isLast && onRegenerate && (
            <button onClick={onRegenerate} title="Regenerate"
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: "13px", padding: "4px 6px", borderRadius: "6px", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: "4px" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--text2)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text3)"}
            >
              ↻ Regenerate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatInterface({ session, initialMessages, onMessagesUpdate, onReset, sidebarCollapsed }) {
  const [messages, setMessages] = useState(
    initialMessages || [{
      role: "assistant",
      content: `I've read **${session.filename}** (${session.pages} pages, ~${session.wordCount?.toLocaleString()} words). What would you like to know?`,
    }]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { onMessagesUpdate?.(messages); }, [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (initialMessages) setMessages(initialMessages); }, [session.sessionId]);

  const askAI = async (msgList) => {
    setLoading(true);
    try {
      const history = msgList.slice(1).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
      const lastUserMsg = [...history].reverse().find((m) => m.role === "user");
      const res = await api.post("/chat", {
        sessionId: session.sessionId,
        question: lastUserMsg?.content,
        history: history.slice(0, -1),
      });
      const final = [...msgList, { role: "assistant", content: res.data.answer }];
      setMessages(final);
    } catch (err) {
      setMessages([...msgList, { role: "assistant", content: `⚠ ${err.response?.data?.error || "Something went wrong."}`, isError: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    await askAI(newMessages);
  };

  // Edit a user message — removes everything after it and re-asks
  const handleEdit = async (msgIndex, newContent) => {
    const newMessages = [...messages.slice(0, msgIndex), { role: "user", content: newContent }];
    setMessages(newMessages);
    await askAI(newMessages);
  };

  // Regenerate last AI response
  const handleRegenerate = async () => {
    if (loading) return;
    const lastAssistantIdx = [...messages].map((m, i) => ({ ...m, i })).reverse().find((m) => m.role === "assistant")?.i;
    if (lastAssistantIdx === undefined) return;
    const msgWithoutLast = messages.slice(0, lastAssistantIdx);
    setMessages(msgWithoutLast);
    await askAI(msgWithoutLast);
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const showSuggestions = messages.length === 1;
  const lastAssistantIdx = [...messages].map((m, i) => ({ ...m, i })).reverse().find((m) => m.role === "assistant")?.i;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", flex: 1, background: "var(--bg)", minWidth: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", paddingLeft: sidebarCollapsed ? "4rem" : "1.5rem", borderBottom: "1px solid var(--border)", background: "var(--bg2)", transition: "padding 0.25s", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", background: "rgba(124,110,247,0.12)", border: "1px solid rgba(124,110,247,0.25)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>📄</div>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", lineHeight: 1.2 }}>{session.filename}</p>
            <p style={{ color: "var(--text3)", fontSize: "12px" }}>{session.pages} pages · {session.wordCount?.toLocaleString()} words</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
          <span style={{ fontSize: "12px", color: "var(--text3)" }}>Groq · Llama 3.3</span>
          <button onClick={onReset} style={{ marginLeft: "12px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "8px", color: "var(--text2)", padding: "6px 14px", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-body)" }}>← New PDF</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "2rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.2rem", maxWidth: "820px", width: "100%", margin: "0 auto", alignSelf: "center", boxSizing: "border-box" }}>
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <UserMessage key={i} content={msg.content} isLast={i === messages.length - 1} onEdit={(newContent) => handleEdit(i, newContent)} />
          ) : (
            <AssistantMessage key={i} content={msg.content} isError={msg.isError} isLast={i === lastAssistantIdx} onRegenerate={handleRegenerate} loading={loading} />
          )
        )}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", background: "rgba(124,110,247,0.12)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", border: "1px solid rgba(124,110,247,0.2)" }}>✦</div>
            <div style={{ display: "flex", gap: "5px", padding: "12px 16px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "4px 18px 18px 18px" }}>
              {[0, 1, 2].map((i) => <div key={i} style={{ width: "7px", height: "7px", background: "var(--accent2)", borderRadius: "50%", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
            </div>
          </div>
        )}

        {showSuggestions && !loading && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "0.5rem" }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}
                style={{ background: "transparent", border: "1px solid var(--border2)", borderRadius: "100px", padding: "8px 18px", color: "var(--text2)", fontSize: "13px", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent2)"; e.currentTarget.style.background = "rgba(124,110,247,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text2)"; e.currentTarget.style.background = "transparent"; }}
              >{s}</button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--bg2)", flexShrink: 0 }}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "16px", padding: "12px 14px", transition: "border-color 0.2s" }}
            onFocusCapture={(e) => e.currentTarget.style.borderColor = "rgba(124,110,247,0.5)"}
            onBlurCapture={(e) => e.currentTarget.style.borderColor = "var(--border2)"}
          >
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Ask anything about your document..."
              rows={1}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: "14px", fontFamily: "var(--font-body)", resize: "none", lineHeight: 1.6, maxHeight: "150px", overflowY: "auto" }}
              onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px"; }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              style={{ width: "36px", height: "36px", borderRadius: "10px", background: input.trim() && !loading ? "var(--accent)" : "var(--bg)", border: `1px solid ${input.trim() && !loading ? "transparent" : "var(--border2)"}`, cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "white", flexShrink: 0, transition: "all 0.2s" }}>
              ↑
            </button>
          </div>
          <p style={{ textAlign: "center", color: "var(--text3)", fontSize: "11px", marginTop: "8px" }}>Enter to send · Shift+Enter for new line · Hover messages to edit or copy</p>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(-5px); opacity: 1; } }
        .markdown-content p { margin-bottom: 8px; }
        .markdown-content p:last-child { margin-bottom: 0; }
        .markdown-content ul, .markdown-content ol { padding-left: 1.4rem; margin-bottom: 8px; }
        .markdown-content li { margin-bottom: 5px; }
        .markdown-content strong { color: var(--accent2); font-weight: 600; }
        .markdown-content code { background: rgba(124,110,247,0.1); padding: 2px 7px; border-radius: 5px; font-size: 13px; color: var(--accent2); font-family: monospace; }
        .markdown-content pre { background: var(--bg); border: 1px solid var(--border2); border-radius: 10px; padding: 12px 16px; margin: 10px 0; overflow-x: auto; }
        .markdown-content pre code { background: transparent; padding: 0; }
        .markdown-content blockquote { border-left: 3px solid var(--accent); padding-left: 14px; color: var(--text2); margin: 10px 0; font-style: italic; }
        .markdown-content h1, .markdown-content h2, .markdown-content h3 { color: var(--text); margin: 14px 0 6px; font-family: var(--font-display); }
        .markdown-content table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
        .markdown-content th, .markdown-content td { padding: 8px 12px; border: 1px solid var(--border2); text-align: left; }
        .markdown-content th { background: var(--bg2); color: var(--accent2); }
      `}</style>
    </div>
  );
}