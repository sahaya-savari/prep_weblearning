const express = require("express");
const router = express.Router();
const { generate } = require("../services/ai");

/**
 * POST /api/generate
 * Body: { exam, topic?, difficulty?, count? }
 * Returns: { questions: MCQQuestion[] }
 */
router.post("/", async (req, res) => {
  const { exam = "Computer Science", topic = "General", difficulty = "medium", count = 5, model = "gemini" } = req.body;

  const prompt = `You are an expert exam question creator for ${exam}.

Generate exactly ${count} multiple-choice questions about "${topic}" at ${difficulty} difficulty.

STRICT OUTPUT FORMAT — respond with ONLY a valid JSON array, no explanation, no markdown, no code block:
[
  {
    "id": "q1",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this answer is correct."
  }
]

Rules:
- Exactly 4 options per question
- correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)
- Each question must be unique
- Explanations must be clear and educational
- Do NOT include any text before or after the JSON array`;

  try {
    const raw = await generate(prompt, model);

    // Extract JSON from the response (handle cases where AI wraps it in text)
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON array");

    const questions = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!Array.isArray(questions)) throw new Error("Response is not an array");
    for (const q of questions) {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error("Invalid question structure");
      }
    }

    res.json({ questions });
  } catch (err) {
    console.error("[/api/generate]", err.message);
    res.status(500).json({ error: err.message || "Failed to generate questions" });
  }
});

module.exports = router;
