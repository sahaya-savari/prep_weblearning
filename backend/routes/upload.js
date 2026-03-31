const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const router = express.Router();
const { parseFile } = require("../utils/fileParser");
const { chunkText } = require("../utils/chunker");
const { addDocument } = require("../services/rag");

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

/**
 * POST /api/upload
 * Multipart form with field "file"
 * Returns: { documentId, name }
 */
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const documentId = crypto.randomUUID();
    const originalName = req.file.originalname;

    // Parse → chunk → store
    const text = await parseFile(req.file.buffer, originalName);
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      return res.status(422).json({ error: "File appears to be empty or unreadable" });
    }

    addDocument(documentId, originalName, chunks);

    console.log(`[/api/upload] "${originalName}" → ${chunks.length} chunks, id=${documentId}`);
    res.json({ documentId, name: originalName });
  } catch (err) {
    console.error("[/api/upload]", err.message);
    res.status(500).json({ error: err.message || "File processing failed" });
  }
});

module.exports = router;
