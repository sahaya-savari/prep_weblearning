const express = require("express");
const router = express.Router();
const { generate } = require("../services/ai");
const { retrieve } = require("../services/rag");

/**
 * POST /api/chat
 * Body: { message, exam?, chatHistory?, notebookMode?, model? }
 * Returns: { success, fallback?, response, sources? }
 */
router.post("/", async (req, res) => {
  const {
    message,
    exam = "General",
    chatHistory = [],
    notebookMode = false,
    model = "gemini",
  } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ success: false, error: "message is required" });
  }

  const cleanMessage = message.trim().slice(0, 2000);

  try {
    let contextSection = "";
    let sources = [];

    // Notebook mode: pull relevant chunks from the RAG store
    if (notebookMode) {
      try {
        const chunks = await retrieve(cleanMessage, [], 4);
        if (chunks.length > 0) {
          contextSection = `\n\nRELEVANT NOTES FROM THE USER'S KNOWLEDGE BASE:\n${chunks
            .map((c, i) => `[${i + 1}] (from "${c.documentName}"): ${c.chunk}`)
            .join("\n\n")}\n\nBased on these notes, answer the question. Always cite which note you used.`;
          sources = chunks.map((c) => ({ content: c.chunk.slice(0, 300), documentName: c.documentName }));
        }
      } catch (ragErr) {
        console.warn("[/api/chat] RAG retrieval failed:", ragErr.message);
        // Non-fatal — continue without context
      }
    }

    // Build conversation history for context
    const historyText = chatHistory
      .slice(-6)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const prompt = `You are PrepMind AI, an expert study assistant helping students prepare for ${exam} exams.
You give clear, structured, friendly explanations with examples where helpful.
${contextSection}

${historyText ? `Previous conversation:\n${historyText}\n` : ""}
User: ${cleanMessage}
Assistant:`;

    const aiResult = await generate(prompt, model, "chat", cleanMessage);

    // Fallback path
    if (aiResult.fallback) {
      return res.json({
        success: true,
        fallback: true,
        response: aiResult.response,
        ...(sources.length > 0 && { sources }),
      });
    }

    return res.json({
      success: true,
      fallback: false,
      response: aiResult.text,
      ...(sources.length > 0 && { sources }),
    });
  } catch (err) {
    console.error("[/api/chat]", err.message);
    const { generateFallbackContent } = require("../services/ai");
    const fallback = generateFallbackContent("chat", cleanMessage);
    return res.json({ success: true, fallback: true, response: fallback.response });
  }
});

module.exports = router;
