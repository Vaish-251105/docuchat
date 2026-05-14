const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Groq = require("groq-sdk");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

// Validate required environment variables
if (!process.env.GROQ_API_KEY) {
  console.error("❌ ERROR: GROQ_API_KEY is not defined in .env file");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json({ limit: "10mb" }));

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Constants
const SESSION_TIMEOUT = 3600000; // 1 hour
const MAX_CONTEXT_LENGTH = 40000;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const TEMP_DIR = "/tmp";

// Session storage
const sessions = {};

/**
 * Cleanup old sessions periodically
 */
function cleanupOldSessions() {
  const now = Date.now();
  let cleaned = 0;
  for (const id of Object.keys(sessions)) {
    if (now - sessions[id].createdAt > SESSION_TIMEOUT) {
      delete sessions[id];
      cleaned++;
    }
  }
  if (cleaned > 0) console.log(`🧹 Cleaned up ${cleaned} expired session(s)`);
}

// Run cleanup every 30 minutes
setInterval(cleanupOldSessions, 1800000);

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
  limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * POST /upload
 * Upload and process a PDF file
 * Returns: { sessionId, filename, pages, wordCount }
 */
app.post("/upload", upload.single("pdf"), async (req, res) => {
  let filePath = null;
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({ 
        error: "No file uploaded",
        code: "NO_FILE"
      });
    }

    filePath = req.file.path;
    console.log("📄 File received:", req.file.originalname, `(${req.file.size} bytes)`);

    // Read and parse PDF
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);

    // Extract text
    const text = data.text || "";
    if (text.trim().length < 10) {
      return res.status(400).json({ 
        error: "Could not extract text. PDF may be image-based or scanned without OCR.",
        code: "INVALID_PDF"
      });
    }

    // Create session
    const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessions[sessionId] = {
      text: text.slice(0, MAX_CONTEXT_LENGTH),
      filename: req.file.originalname,
      pages: data.numpages || 0,
      createdAt: Date.now(),
      uploadedAt: new Date().toISOString(),
    };

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    console.log(`✅ Session created: ${sessionId} | Pages: ${data.numpages} | Words: ${wordCount}`);

    res.json({ 
      success: true,
      sessionId, 
      filename: req.file.originalname, 
      pages: data.numpages,
      wordCount 
    });
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    res.status(500).json({ 
      error: err.message || "Failed to process PDF",
      code: "UPLOAD_ERROR"
    });
  } finally {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn("⚠️ Failed to delete temp file:", filePath);
      }
    }
  }
});

/**
 * POST /chat
 * Send a message and get AI response based on PDF content
 * Body: { sessionId, question, history }
 * Returns: { answer, tokensUsed }
 */
app.post("/chat", async (req, res) => {
  try {
    const { sessionId, question, history } = req.body;

    // Validate session
    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ 
        error: "Session ID is required",
        code: "INVALID_SESSION_ID"
      });
    }

    if (!sessions[sessionId]) {
      return res.status(404).json({ 
        error: "Session expired or not found. Please re-upload your PDF.",
        code: "SESSION_EXPIRED"
      });
    }

    // Validate question
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ 
        error: "Question cannot be empty",
        code: "INVALID_QUESTION"
      });
    }

    const trimmedQuestion = question.trim().slice(0, 2000); // Limit question length
    const { text, filename } = sessions[sessionId];

    // Build system prompt
    const systemPrompt = `You are DocuChat, an intelligent PDF assistant. The user uploaded a document: "${filename}"

DOCUMENT CONTENT:
---
${text}
---

Guidelines:
- Answer ONLY based on the document content provided above
- Be concise, clear, and helpful
- Use bullet points or numbered lists when appropriate
- If the answer is not in the document, clearly state: "I couldn't find that information in the document"
- Quote or reference relevant sections when helpful
- Maintain a professional and friendly tone`;

    // Build message history
    const messages = [{ role: "system", content: systemPrompt }];
    
    if (Array.isArray(history) && history.length > 0) {
      // Add up to last 10 messages to maintain context
      for (const msg of history.slice(-10)) {
        if (msg.role && msg.content) {
          messages.push({ 
            role: msg.role === "user" ? "user" : "assistant", 
            content: String(msg.content).slice(0, 2000) 
          });
        }
      }
    }

    messages.push({ role: "user", content: trimmedQuestion });

    // Call Groq API
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 1024,
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    console.log(`💬 Q: ${trimmedQuestion.slice(0, 60)}...`);
    
    res.json({ 
      success: true,
      answer,
      tokensUsed: completion.usage?.total_tokens || null
    });
  } catch (err) {
    console.error("❌ Chat error:", err.message);
    res.status(500).json({ 
      error: err.message || "AI error occurred",
      code: "CHAT_ERROR"
    });
  }
});

/**
 * Multer error handler middleware
 */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ 
        error: "File too large. Maximum size is 50MB.",
        code: "FILE_TOO_LARGE"
      });
    }
    return res.status(400).json({ 
      error: err.message,
      code: "MULTER_ERROR"
    });
  }

  if (err) {
    return res.status(400).json({ 
      error: err.message || "File upload error",
      code: "UPLOAD_ERROR"
    });
  }

  next();
});

/**
 * GET /
 * Health check endpoint
 */
app.get("/", (req, res) => {
  res.json({ 
    app: "DocuChat API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health
 * Detailed health status
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeSessions: Object.keys(sessions).length,
    environment: {
      groqKey: process.env.GROQ_API_KEY ? "✓ configured" : "✗ MISSING",
      port: PORT,
      nodeVersion: process.version,
    }
  });
});

/**
 * GET /session/:sessionId
 * Get session information
 */
app.get("/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessions[sessionId]) {
    return res.status(404).json({ 
      error: "Session not found",
      code: "SESSION_NOT_FOUND"
    });
  }

  const session = sessions[sessionId];
  const age = Date.now() - session.createdAt;
  
  res.json({
    success: true,
    sessionId,
    filename: session.filename,
    pages: session.pages,
    createdAt: session.uploadedAt,
    ageMs: age,
    expiresIn: SESSION_TIMEOUT - age,
  });
});

/**
 * DELETE /session/:sessionId
 * Delete a session
 */
app.delete("/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessions[sessionId]) {
    return res.status(404).json({ 
      error: "Session not found",
      code: "SESSION_NOT_FOUND"
    });
  }

  delete sessions[sessionId];
  console.log(`🗑️ Session deleted: ${sessionId}`);
  
  res.json({ 
    success: true,
    message: "Session deleted successfully"
  });
});

/**
 * GET /sessions
 * List all active sessions (admin endpoint)
 */
app.get("/sessions", (req, res) => {
  const sessionsList = Object.entries(sessions).map(([id, data]) => ({
    sessionId: id,
    filename: data.filename,
    pages: data.pages,
    createdAt: data.uploadedAt,
    ageMs: Date.now() - data.createdAt,
  }));

  res.json({
    success: true,
    totalSessions: sessionsList.length,
    sessions: sessionsList,
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint not found",
    code: "NOT_FOUND",
    path: req.path,
    method: req.method
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║     🚀 DocuChat Backend Server     ║
╠════════════════════════════════════╣
║ URL: http://localhost:${PORT}         ║
║ Groq API: ${process.env.GROQ_API_KEY ? "✓ Configured" : "✗ MISSING"} ║
║ Node: ${process.version.padEnd(24)}║
╚════════════════════════════════════╝
  `);
});