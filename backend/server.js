require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Route handlers
const chatRoute = require("./routes/chat");
const generateRoute = require("./routes/generate");
const teachRoute = require("./routes/teach");
const uploadRoute = require("./routes/upload");
const askDocsRoute = require("./routes/askDocs");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ─────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "PrepMind AI Backend",
    version: "1.0.0",
    routes: ["/api/chat", "/api/generate", "/api/teach", "/api/upload", "/api/ask-docs"],
    ai: {
      gemini: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here"
        ? "configured" : "NOT configured — add GEMINI_API_KEY to .env",
      ollama: process.env.OLLAMA_BASE_URL || "http://localhost:11434 (default)",
    },
  });
});

// ── API Routes ────────────────────────────────────────
app.use("/api/chat", chatRoute);
app.use("/api/generate", generateRoute);
app.use("/api/teach", teachRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/ask-docs", askDocsRoute);

// ── 404 & Error Handlers ─────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  console.error("[Global Error]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// ── Start ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 PrepMind Backend running at http://localhost:${PORT}`);
  console.log(`📡 Frontend should set VITE_API_URL=http://localhost:${PORT}`);
  const hasKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here";
  if (!hasKey) {
    console.warn("⚠️  GEMINI_API_KEY not set in .env — AI routes will fail until you add it.");
  } else {
    console.log("✅  Gemini API key detected.");
  }
  console.log("");
});
