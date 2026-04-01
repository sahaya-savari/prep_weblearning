const express = require("express");
const router = express.Router();
const { generate } = require("../services/ai");
const { retrieve } = require("../services/rag");

/**
 * POST /api/ask-docs
 * Body: { question, documentIds? }
 * Returns: { answer, sources }
 */
router.post("/", async (req, res) => {
  try {
    const { question, documentIds = [] } = req.body;
    if (!question) return res.status(400).json({ success: false, message: "question is required" });
    const chunks = await retrieve(question, documentIds, 5);

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
