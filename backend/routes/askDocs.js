const express = require("express");
const router = express.Router();
const { generate } = require("../services/ai");
const { retrieve } = require("../services/rag");
const supabase = require("../services/supabase");

// Require Supabase auth
async function requireAuth(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ success: false, message: "Database not configured" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Missing authorization token" });
  }

  const token = authHeader.split(" ")[1];

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
 * POST /api/ask-docs
 * Body: { question, documentIds? }
 * Returns: { answer, sources }
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { question, documentIds = [] } = req.body;
    const userId = req.user.id; // Get user ID from req.user
    if (!question) return res.status(400).json({ success: false, message: "question is required" });
    const chunks = await retrieve(question, documentIds, 5, userId);

    if (chunks.length === 0) {
      return res.json({
        answer: "I couldn't find relevant information in your uploaded documents. Please upload study notes first, then ask your question.",
        sources: [],
      });
    }

    const context = chunks
      .map((c, i) => `[Source ${i + 1} — "${c.documentName}"]\n${c.chunk}`)
      .join("\n\n---\n\n");

    const prompt = `You are PrepMind AI. Answer the student's question using ONLY the provided source notes below.
Always cite which source you are referencing (e.g. "According to Source 1...").
If the sources don't fully answer the question, say so and provide what you can.

SOURCE NOTES:
${context}

STUDENT'S QUESTION: ${question}

Answer (be thorough and educational):`;

    const aiResult = await generate(prompt);
    
    // In case of a fallback due to quota or network, aiResult.text will be null/undefined,
    // and aiResult.response will have the fallback message. 
    const answer = aiResult.text || aiResult.response || "Service temporarily unavailable.";

    const sources = chunks.map((c) => ({
      content: c.chunk.slice(0, 400) + (c.chunk.length > 400 ? "..." : ""),
      documentName: c.documentName,
    }));

    res.json({ answer, sources });
  } catch (err) {
    console.error("[/api/ask-docs] Global error:", err.message);
    res.status(500).json({ success: false, message: err.message || "Failed to query documents" });
  }
});

module.exports = router;
