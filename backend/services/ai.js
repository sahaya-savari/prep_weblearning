const { callGemini } = require("./gemini");

// ── Fallback content generator ────────────────────────
function generateFallbackContent(type, topic = "this topic") {
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
      return {
        questions: [
          {
            id: "q1",
            question: `Which of the following best describes the core purpose of ${topic}?`,
            options: [
              "To manage memory allocation",
              "To provide a structured approach to problem-solving",
              "To enable network communication",
              "To handle user authentication",
            ],
            correctIndex: 1,
            explanation: `${topic} provides a structured approach to solving specific types of computational problems.`,
          },
          {
            id: "q2",
            question: `What is a key advantage of using ${topic}?`,
            options: [
              "It eliminates the need for testing",
              "It guarantees 100% performance improvement",
              "It improves code organization and maintainability",
              "It automatically handles all edge cases",
            ],
            correctIndex: 2,
            explanation: "Well-structured code using proper concepts improves long-term maintainability.",
          },
        ],
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

// ── AI router ─────────────────────────────────────────
async function generate(prompt, reqModel = "gemini", type = "generic", topic = "this topic") {
  if (reqModel === "ollama") {
    // Only attempt Ollama if not pointed at localhost in production
    const isProd = process.env.NODE_ENV === "production";
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    if (isProd && ollamaUrl.includes("localhost")) {
      // Skip Ollama in cloud production — fall through to Gemini
      console.log("[AI] Ollama skipped in production (localhost). Using Gemini.");
    } else {
      try {
        const axios = require("axios");
        const res = await axios.post(`${ollamaUrl}/api/generate`, {
          model: process.env.OLLAMA_MODEL || "llama3",
          prompt,
          stream: false,
        }, { timeout: 60000 });
        return { text: res.data.response, fallback: false };
      } catch (err) {
        console.warn(`[AI] Ollama failed: ${err.message}`);
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
    console.log(`[AI] Returning fallback content for type="${type}"`);
    return { ...generateFallbackContent(type, topic), text: null };
  }
}

module.exports = { generate, generateFallbackContent };
