const express = require("express");
const router = express.Router();
const { generate } = require("../services/ai");
const { retrieve } = require("../services/rag");

/**
 * POST /api/chat
 * Body: { message, exam?, chatHistory?, notebookMode? }
 */
router.post("/", async (req, res) => {
  const { message, exam = "General", chatHistory = [], notebookMode = false } = req.body;

  if (!message) return res.status(400).json({ error: "message is required" });

  try {
    let contextSection = "";
    let sources = [];

    // Notebook mode: pull relevant chunks from the RAG store
    if (notebookMode) {
      const chunks = retrieve(message, [], 4);
      if (chunks.length > 0) {
        contextSection = `\n\nRELEVANT NOTES FROM THE USER'S KNOWLEDGE BASE:\n${chunks
          .map((c, i) => `[${i + 1}] (from "${c.documentName}"): ${c.chunk}`)
          .join("\n\n")}\n\nBased on these notes, answer the question. Always cite which note you used.`;
        sources = chunks.map((c) => ({ content: c.chunk.slice(0, 300), documentName: c.documentName }));
      }
    }

    // Build conversation history for context
    const historyText = chatHistory
      .slice(-6) // last 3 exchanges
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const prompt = `You are PrepMind AI, an expert study assistant helping students prepare for ${exam} exams.
You give clear, structured, friendly explanations with examples where helpful.
${contextSection}

${historyText ? `Previous conversation:\n${historyText}\n` : ""}
User: ${message}
Assistant:`;

    const response = await generate(prompt);
    res.json({ response, ...(sources.length > 0 && { sources }) });
  } catch (err) {
    console.error("[/api/chat]", err.message);
    res.status(500).json({ error: err.message || "AI service unavailable" });
  }
});

module.exports = router;
