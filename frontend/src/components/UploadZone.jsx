import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import api from "../api";

export default function UploadZone({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setError("");
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("pdf", file);
        const res = await api.post("/api/upload", formData);
        onUploadSuccess({ ...res.data, file });
      } catch (err) {
        setError(err.response?.data?.error || "Upload failed. Try again.");
      } finally {
        setUploading(false);
      }
    },
    [onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      {/* Hero text */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(124,110,247,0.12)", border: "1px solid rgba(124,110,247,0.25)", borderRadius: "100px", padding: "6px 16px", fontSize: "12px", color: "var(--accent2)", marginBottom: "1.5rem", fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
          ✦ POWERED BY GROQ AI
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 900, lineHeight: 1.05, marginBottom: "1rem", letterSpacing: "-0.01em" }}>
          Chat with <em style={{ fontStyle: "italic", color: "var(--text2)" }}>any</em>
          <br />
          <span style={{ color: "var(--accent)", fontStyle: "italic" }}>PDF document</span>
        </h1>
        <p style={{ color: "var(--text2)", fontSize: "1.1rem", maxWidth: "440px", margin: "0 auto" }}>
          Upload a PDF — resume, notes, contract, research paper — and ask it anything.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        style={{
          width: "100%",
          maxWidth: "520px",
          border: `2px dashed ${isDragActive ? "var(--accent)" : "var(--border2)"}`,
          borderRadius: "var(--radius-lg)",
          padding: "3rem 2rem",
          textAlign: "center",
          cursor: uploading ? "not-allowed" : "pointer",
          background: isDragActive ? "rgba(124,110,247,0.06)" : "var(--bg2)",
          transition: "all 0.2s",
        }}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
          {uploading ? "⏳" : isDragActive ? "📂" : "📄"}
        </div>
        {uploading ? (
          <div>
            <p style={{ color: "var(--accent2)", fontFamily: "var(--font-display)", fontWeight: 600 }}>Parsing your PDF...</p>
            <p style={{ color: "var(--text3)", fontSize: "13px", marginTop: "6px" }}>Extracting text & preparing AI context</p>
            <div style={{ marginTop: "1rem", height: "3px", background: "var(--bg3)", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: "60%", background: "var(--accent)", borderRadius: "10px", animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.1rem", marginBottom: "6px" }}>
              {isDragActive ? "Drop it here!" : "Drop your PDF here"}
            </p>
            <p style={{ color: "var(--text3)", fontSize: "13px" }}>or click to browse — max 50MB</p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: "1rem", color: "var(--red)", fontSize: "13px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", padding: "10px 16px" }}>
          ⚠ {error}
        </div>
      )}

      {/* Feature pills */}
      <div style={{ display: "flex", gap: "10px", marginTop: "2.5rem", flexWrap: "wrap", justifyContent: "center" }}>
        {["Ask questions", "Get summaries", "Extract key info", "Multi-turn chat"].map((f) => (
          <span key={f} style={{ fontSize: "12px", color: "var(--text3)", border: "1px solid var(--border)", borderRadius: "100px", padding: "5px 14px" }}>
            {f}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}