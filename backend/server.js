require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Route handlers
const chatRoute = require("./routes/chat");
const generateRoute = require("./routes/generate");
const teachRoute = require("./routes/teach");
const uploadRoute = require("./routes/upload");
const askDocsRoute = require("./routes/askDocs");
const historyRoute = require("./routes/history"); // Practice history (Supabase JWT auth)

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────
// In production set ALLOWED_ORIGINS as comma-separated list in your host env vars.
// e.g. ALLOWED_ORIGINS=https://your-app.vercel.app
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
  "https://prep-weblearning.vercel.app",
];
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).concat(defaultOrigins)
  : defaultOrigins;

app.use(
  cors({
    origin: "*",
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
    routes: [
      "/api/chat",
      "/api/generate",
      "/api/teach",
      "/api/upload",
      "/api/ask-docs",
      "/api/save-result",
      "/api/history",
    ],
    ai: {
      gemini:
        !!process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== "your_gemini_api_key_here"
          ? "configured"
          : "NOT configured — add GEMINI_API_KEY to env vars",
      ollama: process.env.OLLAMA_BASE_URL || "http://localhost:11434 (default)",
    },
  });
});

const rateLimit = require("express-rate-limit");

// ── Health check (no rate limiting) ─────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Rate Limiting (60 req/min per IP) ────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests. Please wait a moment and try again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── API Routes ────────────────────────────────────────
app.use("/api/", apiLimiter);
app.use("/api/chat", chatRoute);
app.use("/api/generate", generateRoute);
app.use("/api/teach", teachRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/ask-docs", askDocsRoute);
app.use("/api", historyRoute); // /api/save-result + /api/history

// ── 404 & Error Handlers ─────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[Global Error]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// ── Start ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 PrepMind Backend running at http://localhost:${PORT}`);
  console.log(`📡 Allowed origins: ${allowedOrigins.join(", ")}`);

  const checks = [
    ["GEMINI_API_KEY", "Gemini AI"],
    ["SUPABASE_URL", "Supabase DB URL"],
    ["SUPABASE_SERVICE_KEY", "Supabase Auth (service_role key)"],
  ];
  checks.forEach(([key, label]) => {
    const val = process.env[key];
    const ok = val && !val.startsWith("your_");
    console.log(ok ? `✅  ${label} configured` : `⚠️   ${label} — set ${key} in env vars`);
  });
  console.log("");
});
