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

// Require Supabase auth and attach the user to req.user for downstream handlers.
async function requireAuth(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ success: false, message: "Database not configured" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Missing authorization token" });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal Auth Error" });
  }
}

/**
 * POST /api/upload
 * Multipart form with field "file"
 * Returns: { documentId, name }
 */
router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const originalName = req.file.originalname;
    const userId = req.user.id; // IMPORTANT: scope uploads to the authenticated user

    // Parse → chunk → store
    const text = await parseFile(req.file.buffer, originalName);
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      return res.status(422).json({ success: false, message: "File appears to be empty or unreadable" });
    }

    const documentId = await addDocument(originalName, chunks, userId);

    console.info(`[/api/upload] "${originalName}" → ${chunks.length} chunks, user=${userId}`);
    res.json({ documentId, name: originalName });
  } catch (err) {
    console.error("[/api/upload] Global error:", err.message);
    res.status(500).json({ success: false, message: err.message || "File processing failed" });
  }
});

// Fetch documents belonging to the authenticated user only.
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, documents: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
