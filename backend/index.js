const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Groq = require("groq-sdk");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:4173",
    /\.vercel\.app$/,   // any vercel subdomain
  ],
  credentials: true,
}));
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const sessions = {};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "/tmp"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files allowed"), false);
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

// POST /upload
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    console.log("📄 File received:", req.file.originalname, `(${req.file.size} bytes)`);

    const buffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(buffer);
    fs.unlinkSync(req.file.path);

    const text = data.text || "";
    if (text.trim().length < 10) {
      return res.status(400).json({ error: "Could not extract text. PDF may be image-based/scanned." });
    }

    const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessions[sessionId] = {
      text: text.slice(0, 40000), // ~10k tokens context
      filename: req.file.originalname,
      pages: data.numpages,
      createdAt: Date.now(),
    };

    // Clean old sessions (>1hr)
    const now = Date.now();
    for (const id of Object.keys(sessions)) {
      if (now - sessions[id].createdAt > 3600000) delete sessions[id];
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    console.log(`✅ Session created: ${sessionId} | Pages: ${data.numpages} | Words: ${wordCount}`);
    res.json({ sessionId, filename: req.file.originalname, pages: data.numpages, wordCount });
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    res.status(500).json({ error: err.message || "Failed to process PDF" });
  }
});

// POST /chat
app.post("/chat", async (req, res) => {
  try {
    const { sessionId, question, history } = req.body;

    if (!sessionId || !sessions[sessionId]) {
      return res.status(400).json({ error: "Session expired. Please re-upload your PDF." });
    }
    if (!question?.trim()) return res.status(400).json({ error: "Question is required" });

    const { text, filename } = sessions[sessionId];

    const systemPrompt = `You are DocuChat, a smart PDF assistant. The user uploaded a document called "${filename}".

DOCUMENT CONTENT:
---
${text}
---

Instructions:
- Answer ONLY based on the document content above.
- Be concise, clear, and helpful.
- Use bullet points when listing multiple items.
- If the answer is not found in the document, say "I couldn't find that in the document."
- Quote relevant parts of the document when helpful.`;

    // Build message history for multi-turn chat
    const messages = [{ role: "system", content: systemPrompt }];
    for (const msg of (history || [])) {
      messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.content });
    }
    messages.push({ role: "user", content: question });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // free, fast, very capable
      messages,
      max_tokens: 1024,
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    console.log(`💬 Q: ${question.slice(0, 60)}...`);
    res.json({ answer });
  } catch (err) {
    console.error("❌ Chat error:", err.message);
    res.status(500).json({ error: err.message || "AI error occurred" });
  }
});

// Multer error handler
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Max size is 50MB." });
  }
  if (err.message) return res.status(400).json({ error: err.message });
  next(err);
});

app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    sessions: Object.keys(sessions).length,
    groq: process.env.GROQ_API_KEY ? "✓ key found" : "✗ MISSING KEY",
  })
);

app.listen(PORT, () => {
  console.log(`\n✅ DocuChat backend on http://localhost:${PORT}`);
  console.log(`   Groq API key: ${process.env.GROQ_API_KEY ? "✓ found" : "✗ MISSING — add GROQ_API_KEY to .env!"}\n`);
});