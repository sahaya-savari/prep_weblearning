const express = require("express");
const router = express.Router();
const { generate } = require("../services/ai");

/**
 * POST /api/generate
 * Body: { exam, topic?, difficulty?, count?, model? }
 * Returns: { success, fallback?, questions: MCQQuestion[] }
 */
router.post("/", async (req, res) => {
  const {
    exam = "Computer Science",
    topic = "General",
    difficulty = "medium",
    count = 5,
    model = "gemini",
  } = req.body;

  const cleanTopic = String(topic).trim().slice(0, 200);
  const cleanExam = String(exam).trim().slice(0, 100);
  const safeCount = Math.min(Math.max(parseInt(count) || 5, 1), 20);

  const prompt = `You are an expert exam question creator for ${cleanExam}.

Generate exactly ${safeCount} multiple-choice questions about "${cleanTopic}" at ${difficulty} difficulty.

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
    const aiResult = await generate(prompt, model, "mcq", cleanTopic);

    // Fallback content path
    if (aiResult.fallback) {
      return res.json({ success: true, fallback: true, questions: aiResult.questions });
    }

    const raw = aiResult.text;
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON array");

    const questions = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(questions)) throw new Error("Response is not an array");

    // Validate and sanitize each question
    const validQuestions = questions.filter(
      (q) => q.question && Array.isArray(q.options) && q.options.length === 4
    );

    if (validQuestions.length === 0) throw new Error("No valid questions in response");

    return res.json({ success: true, fallback: false, questions: validQuestions });
  } catch (err) {
    console.error("[/api/generate]", err.message);
    const { generateFallbackContent } = require("../services/ai");
    const fallback = generateFallbackContent("mcq", cleanTopic);
    return res.json({ success: true, fallback: true, questions: fallback.questions });
  }
});

module.exports = router;
