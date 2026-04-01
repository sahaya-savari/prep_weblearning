const express = require("express");
const router = express.Router();
const { generate, generateFallbackContent } = require("../services/ai");

/**
 * Helper to clean Markdown json blocks and parse
 */
function parseCleanJSON(rawString) {
  // Remove markdown blocks ```json and ```
  let cleanString = rawString.replace(/```json/gi, "").replace(/```/g, "").trim();
  // Attempt to find the object if there's trailing or leading text
  const jsonMatch = cleanString.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleanString = jsonMatch[0];
  
  return JSON.parse(cleanString);
}

/**
 * Helper to map the strict AI object format to the frontend compatible array format
 */
function mapToLegacyFormat(rawQs) {
  return rawQs.map((q, idx) => {
    // If the AI somehow returned perfect legacy array
    if (typeof q.correctIndex === "number") {
       return q;
    }

    let cIndex = 0;
    if (q.answer === "A") cIndex = 0;
    if (q.answer === "B") cIndex = 1;
    if (q.answer === "C") cIndex = 2;
    if (q.answer === "D") cIndex = 3;

    return {
      id: `q${Date.now()}_${idx}`,
      question: q.question || "Unknown question?",
      options: Array.isArray(q.options) && q.options.length === 4 
               ? q.options 
               : ["Option A", "Option B", "Option C", "Option D"],
      correctIndex: cIndex,
      explanation: q.explanation || "Detailed explanation not provided."
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
    weakTopics = [],
  } = req.body;

  const cleanTopic = String(topic).trim().slice(0, 200);
  const cleanExam = String(exam).trim().slice(0, 100);
  const safeCount = Math.min(Math.max(parseInt(count) || 5, 1), 20);

  const prompt = `FORMAT (STRICT JSON ONLY):

{
  "topic": "${cleanTopic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "explanation": "string"
    }
  ]
}

Rules:
- Exactly ${safeCount} questions about "${cleanTopic}" at ${difficulty} difficulty
- 4 options each
- One correct answer (A, B, C, or D)
- No extra text outside JSON
- Ensure high-quality conceptual questions
`;

  let finalPrompt = prompt;
  if (Array.isArray(weakTopics) && weakTopics.length > 0) {
    const validWeaks = weakTopics.slice(0, 5).join(", ");
    finalPrompt += `\nUser Weak Areas: ${validWeaks}\nFocus closely on testing these concepts to repair foundational gaps.`;
  }

  let finalQuestions = [];
  let isFallback = false;

  // STEP 4 & 6: Retry loops and Timeout protection
  // Up to 2 attempts
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // AI generate handles sub-timeouts (60s) and cascades securely
      const aiResult = await generate(finalPrompt, model, "mcq", cleanTopic);
      
      if (aiResult.fallback) {
        // AI specifically rejected due to quota or hard error
        finalQuestions = aiResult.questions || [];
        isFallback = true;
        break; // Hard fail - don't retry locally
      }

      // STEP 2 & 3: Clean and parse JSON strictly
      const jsonResponse = parseCleanJSON(aiResult.text);

      if (!jsonResponse || !Array.isArray(jsonResponse.questions)) {
        throw new Error("Parsed JSON does not contain 'questions' array");
      }

      const rawQs = jsonResponse.questions;

      // STEP 2.5: Strict validation
      const validQs = rawQs.filter(q =>
        q.question &&
        Array.isArray(q.options) && q.options.length === 4 &&
        ["A","B","C","D"].includes(q.answer)
      );

      // Map strict AI schema to frontend's expected format
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
