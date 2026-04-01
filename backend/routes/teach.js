const express = require("express");
const router = express.Router();
const { generate } = require("../services/ai");

/**
 * POST /api/teach
 * Body: { topic, exam?, difficulty?, model? }
 */
router.post("/", async (req, res) => {
  try {
    const { topic, exam = "Computer Science", difficulty = "medium", model = "gemini" } = req.body;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return res.status(400).json({ success: false, message: "topic is required" });
    }

    const cleanTopic = topic.trim().slice(0, 200);

    let difficultyLogic = "";
    if (difficulty === "easy") difficultyLogic = "Use simple language, basic examples, and direct questions.";
    else if (difficulty === "hard") difficultyLogic = "Use deep conceptual explanations, cover edge cases, and include tricky conceptual traps.";
    else difficultyLogic = "Use moderate explanations and slightly tricky applied questions.";

    const prompt = `SYSTEM PROMPT:

You are an expert AI tutor for ${exam}.
Generate high-quality educational content based ONLY on the given topic.

STRICT RULES:
* No hallucination
* No assumptions
* Keep explanations clear and structured
* Output must follow EXACT format below
* ${difficultyLogic}

FORMAT:

Definition:
...

Key Concepts:
- ...
- ...

Example:
...

Common Mistakes:
- ...

Practice Questions:
1. ...
   Answer: ...

---
USER INPUT:
Topic: ${cleanTopic}
Difficulty: ${difficulty}
`;

    let finalResult = null;
    let isFallback = false;

    // Retry Loop + Format Validation
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const aiResult = await generate(prompt, model, "teach", cleanTopic);

        if (aiResult.fallback) {
          throw new Error("AI invoked generation fallback. Will drop straight to static generator.");
        }

        const raw = aiResult.text;

        // Extract raw sections dynamically based on exact prompt format
        const definitionMatch = raw.match(/Definition:([\s\S]*?)(?=Key Concepts:|$)/i);
        const keysMatch = raw.match(/Key Concepts:([\s\S]*?)(?=Example:|$)/i);
        const exampleMatch = raw.match(/Example:([\s\S]*?)(?=Common Mistakes:|$)/i);
        const mistakesMatch = raw.match(/Common Mistakes:([\s\S]*?)(?=Practice Questions:|$)/i);
        const pracMatch = raw.match(/Practice Questions:([\s\S]*?)$/i);

        if (!definitionMatch || !pracMatch) {
           throw new Error("Missing critical formatting sections (Definition or Practice Questions)");
        }

        // Format cleaning
        const definition = definitionMatch[1].trim();
        const example = exampleMatch ? exampleMatch[1].trim() : "";
        
        const keyConcepts = keysMatch ? keysMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-/, '').trim()) : [];
        const mistakes = mistakesMatch ? mistakesMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-/, '').trim()) : [];
        const practiceQs = pracMatch[1].trim();

        // Safely map back to legacy UI expected props { explanation, keyPoints, examples, formulas }
        finalResult = {
          explanation: `${definition}\n\n### Common Mistakes\n${mistakes.map(m => `- ${m}`).join('\n')}`,
          keyPoints: keyConcepts.length > 0 ? keyConcepts : ["No distinct key concepts found."],
          examples: [example, practiceQs].filter(Boolean)
        };

        console.info(`[AI] Teach generated successfully for ${cleanTopic}`);
        break; // escape loop
      } catch (err) {
        console.error(`[AI] Teach attempt ${attempt} failed: ${err.message}`);
        if (attempt === 2) {
          isFallback = true;
        }
      }
    }

    // Final Fallback if loop failed completely
    if (!finalResult) {
       const { generateFallbackContent } = require("../services/ai");
       const fallback = generateFallbackContent("teach", cleanTopic);
       return res.json({ success: true, fallback: true, ...fallback });
    }

    return res.json({ success: true, fallback: isFallback, ...finalResult });
  } catch (globalErr) {
    console.error(`[AI] Global Teach Failure: ${globalErr.message}`);
    return res.status(500).json({ success: false, message: globalErr.message });
  }
});

module.exports = router;
