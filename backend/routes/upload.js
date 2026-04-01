const express = require("express");
const multer = require("multer");
const router = express.Router();
const { parseFile } = require("../utils/fileParser");
const { chunkText } = require("../utils/chunker");
const { addDocument } = require("../services/rag");
const supabase = require("../services/supabase");

// Store files in memory (no disk write needed — we parse and discard)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".txt", ".md"];
    const ext = require("path").extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`File type not supported: ${ext}. Use PDF, TXT, or MD.`));
  },
});

// Soft auth — attach user if Bearer token present, but don't block guests.
// This lets authenticated users have their uploads scoped to their user_id.
async function softAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ") && supabase) {
    const token = authHeader.replace("Bearer ", "").trim();
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) req.supabaseUser = user;
    } catch {
      // Non-fatal — continue as guest
    }
  }
  next();
}

/**
 * POST /api/upload
 * Multipart form with field "file"
 * Returns: { documentId, name }
 */
router.post("/", softAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const originalName = req.file.originalname;
    const userId = req.supabaseUser?.id ?? null; // null for guests — stored as anonymous

    // Parse → chunk → store
    const text = await parseFile(req.file.buffer, originalName);
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      return res.status(422).json({ error: "File appears to be empty or unreadable" });
    }

    const documentId = await addDocument(originalName, chunks, userId);

    console.info(`[/api/upload] "${originalName}" → ${chunks.length} chunks, user=${userId ?? "guest"}`);
    res.json({ documentId, name: originalName });
  } catch (err) {
    console.error("[/api/upload]", err.message);
    res.status(500).json({ error: err.message || "File processing failed" });
  }
});

module.exports = router;
