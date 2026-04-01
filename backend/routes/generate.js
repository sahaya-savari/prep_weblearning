const express = require("express");
const router = express.Router();
const { generate, generateFallbackContent } = require("../services/ai");

/**
 * Helper to clean Markdown json blocks and parse
 */
function parseCleanJSON(rawString) {
  // Remove markdown blocks ```json and ```
  let cleanString = rawString.replace(/```json/gi, "").replace(/```/g, "").trim();
  // Attempt to find the array if there's trailing or leading text
  const jsonMatch = cleanString.match(/\[[\s\S]*\]/);
  if (jsonMatch) cleanString = jsonMatch[0];
  
  return JSON.parse(cleanString);
}

/**
 * Helper to map the strict AI object format to the frontend compatible array format
 */
function mapToLegacyFormat(rawQs) {
  return rawQs.map((q, idx) => {
    // If the AI somehow returned an array instead of the strict object, pass it through securely
    if (Array.isArray(q.options) && typeof q.correctIndex === "number") {
       return q;
    }

    const opts = q.options || {};
    const arrayOpts = [opts.A || "Option A", opts.B || "Option B", opts.C || "Option C", opts.D || "Option D"];
    
    let cIndex = 0;
    if (q.answer === "A") cIndex = 0;
    if (q.answer === "B") cIndex = 1;
    if (q.answer === "C") cIndex = 2;
    if (q.answer === "D") cIndex = 3;

    return {
      id: `q${Date.now()}_${idx}`,
      question: q.question || "Unknown question?",
      options: arrayOpts,
      correctIndex: cIndex,
      explanation: "AI generated explanation not provided under strict scheme."
    };
  });
}

/**
 * Remove duplicate questions to ensure uniqueness
 */
function removeDuplicates(questions) {
  const seen = new Set();
  return questions.filter((q) => {
    const canonical = q.question.toLowerCase().trim();
    if (seen.has(canonical)) return false;
    seen.add(canonical);
    return true;
  });
}

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

  const prompt = `Based on the provided context (${cleanTopic} for ${cleanExam} at ${difficulty} difficulty), generate exactly ${safeCount} high-quality multiple-choice questions.

Rules:
- Each question must be clear and relevant
- Each must have 4 options (A, B, C, D)
- Only ONE correct answer
- Avoid vague or repeated questions

Return ONLY valid JSON in this format:

[
  {
    "question": "...",
    "options": {
      "A": "...",
      "B": "...",
      "C": "...",
      "D": "..."
    },
    "answer": "A"
  }
]

DO NOT return text, explanations, or markdown.`;

  let finalQuestions = [];
  let isFallback = false;

  // STEP 4 & 6: Retry loops and Timeout protection
  // Up to 2 attempts
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // AI generate handles sub-timeouts (60s) and cascades securely
      const aiResult = await generate(prompt, model, "mcq", cleanTopic);
      
      if (aiResult.fallback) {
        // AI specifically rejected due to quota or hard error
        finalQuestions = aiResult.questions || [];
        isFallback = true;
        break; // Hard fail - don't retry locally
      }

      // STEP 2 & 3: Clean and parse JSON strictly
      const rawQs = parseCleanJSON(aiResult.text);

      if (!Array.isArray(rawQs)) {
        throw new Error("Parsed JSON is not an array");
      }

      // STEP 2.5: Strict validation
      const validQs = rawQs.filter(q =>
        q.question &&
        q.options &&
        q.options.A &&
        q.options.B &&
        q.options.C &&
        q.options.D &&
        ["A","B","C","D"].includes(q.answer)
      );

      // Map strict AI schema to frontend's expected format without breaking architecture
      const mappedQs = mapToLegacyFormat(validQs);
      
      // STEP 5: Remove duplicates
      const uniqueQs = removeDuplicates(mappedQs);
      
      if (uniqueQs.length > 0) {
        finalQuestions = uniqueQs;
        console.info(`[AI] Successfully parsed and validated ${finalQuestions.length} unique questions.`);
        break; // Success! Escape loop!
      } else {
        throw new Error("Generated array contained no valid unique questions");
      }

    } catch (err) {
      console.error(`[AI] Generate attempt ${attempt} failed: ${err.message}`);
      // STEP 7: Log errors only
      if (attempt === 2) {
        isFallback = true; // Exhausted attempts, trigger fallback padding next
      }
    }
  }

  // STEP 4: Ensure minimum questions (Pad missing or regenerate fallbacks)
  if (finalQuestions.length < safeCount) {
    console.info(`[AI] Pad missing: requested ${safeCount}, got ${finalQuestions.length}. Padding with fallback.`);
    const missingCount = safeCount - finalQuestions.length;
    
    // Fill the gap with safe offline generics
    const extras = generateFallbackContent("mcq", cleanTopic, missingCount).questions;
    finalQuestions.push(...extras);
  }

  // Double check duplicates again just in case padding overlapped
  finalQuestions = removeDuplicates(finalQuestions);
  
  // Truncate if safe count exceeded 
  finalQuestions = finalQuestions.slice(0, safeCount);

  // Return exactly the expected structure
  return res.json({ 
    success: true, 
    fallback: isFallback, 
    questions: finalQuestions 
  });
});

module.exports = router;
