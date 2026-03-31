const express = require("express");
const router = express.Router();
const { generate } = require("../services/ai");

/**
 * POST /api/teach
 * Body: { topic, exam? }
 * Returns: { explanation, keyPoints, examples, formulas? }
 */
router.post("/", async (req, res) => {
  const { topic, exam = "Computer Science" } = req.body;

  if (!topic) return res.status(400).json({ error: "topic is required" });

  const prompt = `You are PrepMind AI, an expert teacher for ${exam} exams.

Teach the topic: "${topic}"

Respond with ONLY a valid JSON object (no markdown, no code block):
{
  "explanation": "A clear, detailed multi-paragraph explanation of the topic (200-400 words). Use simple language, build intuition first, then go into depth.",
  "keyPoints": [
    "Key point 1 — short and memorable",
    "Key point 2",
    "Key point 3",
    "Key point 4",
    "Key point 5"
  ],
  "examples": [
    "Example 1: A concrete real-world example with some detail.",
    "Example 2: Another example showing a different aspect."
  ],
  "formulas": [
    "Formula or definition if applicable (leave as empty array [] if none)"
  ]
}

Make it engaging, educational, and exam-focused.`;

  try {
    const raw = await generate(prompt);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON object");

    const result = JSON.parse(jsonMatch[0]);

    if (!result.explanation || !Array.isArray(result.keyPoints)) {
      throw new Error("Invalid response structure");
    }

    res.json(result);
  } catch (err) {
    console.error("[/api/teach]", err.message);
    res.status(500).json({ error: err.message || "Failed to generate explanation" });
  }
});

module.exports = router;
