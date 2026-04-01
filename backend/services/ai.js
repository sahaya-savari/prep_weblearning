const { callGemini } = require("./gemini");

// ── Fallback content generator ────────────────────────
function generateFallbackContent(type, topic = "this topic", count = 5) {
  switch (type) {
    case "teach":
      return {
        explanation: `${topic} is an important concept in computer science and software development. Understanding its fundamentals helps build a strong foundation for exam preparation and practical application.`,
        keyPoints: [
          `Definition: ${topic} refers to a core principle or system used in computing.`,
          "It has well-defined syntax or rules that govern its use.",
          "Understanding it helps solve real-world problems efficiently.",
          "Commonly tested in competitive exams and technical interviews.",
          "Practice with examples is key to mastering this topic.",
        ],
        examples: [
          `Example 1: A basic implementation of ${topic} in a real program.`,
          `Example 2: How ${topic} is used in industry-scale systems.`,
        ],
        formulas: [],
        fallback: true,
      };

    case "mcq":
      const fallbackQuestions = [];
      for (let i = 1; i <= count; i++) {
        fallbackQuestions.push({
          id: `f_q${i}`,
          question: `Which of the following is an accurate statement about ${topic}? (Fallback Question ${i})`,
          options: [
            "It is completely irrelevant to modern computing.",
            "It is a core concept that improves system design.",
            "It is only used in legacy mainframes.",
            "It prevents security vulnerabilities out of the box."
          ],
          correctIndex: 1,
          explanation: `${topic} provides essential structure for modern systems. This is a fallback question designed to test core principles.`
        });
      }

      return {
        questions: fallbackQuestions,
        fallback: true,
      };

    case "chat":
      return {
        response: `I can help you understand ${topic}. This is a fundamental concept that covers key principles in computer science. While my detailed AI response is temporarily unavailable (quota limit), here are some study tips: Review official documentation, practice with small examples, and focus on understanding the 'why' behind the concept, not just the 'how'. Please try again in a few minutes for a full AI-generated response.`,
        fallback: true,
      };

    default:
      return { message: "Service temporarily limited. Please try again shortly.", fallback: true };
  }
}

// ── Anti-Spam Cooldown Math ───────────────────────────
let lastFailureTime = 0;

function shouldUseFallback() {
  const now = Date.now();
  if (now - lastFailureTime < 5000) return true;
  return false;
}

// ── AI router ─────────────────────────────────────────
async function generate(prompt, reqModel = "gemini", type = "generic", topic = "this topic") {
  if (shouldUseFallback()) {
    return { ...generateFallbackContent(type, topic), text: null };
  }

  if (reqModel === "ollama") {
    // Only attempt Ollama if not pointed at localhost in production
    const isProd = process.env.NODE_ENV === "production";
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    if (!(isProd && ollamaUrl.includes("localhost"))) {
      try {
        const axios = require("axios");
        const res = await axios.post(`${ollamaUrl}/api/generate`, {
          model: process.env.OLLAMA_MODEL || "llama3",
          prompt,
          stream: false,
        }, { timeout: 60000 });
        return { text: res.data.response, fallback: false };
      } catch (err) {
        console.error(`[AI] Ollama failed: ${err.message}`);
      }
    }
  }

  // Gemini with full retry/cascade
  try {
    return await callGemini(prompt);
  } catch (err) {
    const errMsg = err.message || "";
    const isQuota = errMsg.toLowerCase().includes("quota") || errMsg.includes("429");
    const isAuth = errMsg.includes("auth error") || errMsg.includes("GEMINI_KEY_MISSING");

    console.error(`[AI] Gemini unavailable: ${errMsg}`);

    if (isAuth) {
      // Hard fail — misconfigured key is not recoverable with fallback
      throw new Error("AI service misconfigured. Please contact support.");
    }

    // Quota or network issue — return graceful fallback
    lastFailureTime = Date.now();
    return { ...generateFallbackContent(type, topic), text: null };
  }
}

module.exports = { generate, generateFallbackContent };
