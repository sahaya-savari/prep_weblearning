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
      const text = topic.toLowerCase().trim();
      let chatRes = `Quick answer: ${topic} is an important concept. Try generating a quiz for better understanding.`;

      if (["hi", "hello", "hey", "test"].includes(text)) {
        chatRes = "Hey! Ask me a topic and I’ll help.";
      } else if (text.includes("array")) {
        chatRes = "Array: a collection of elements stored in order. Example: [1,2,3]";
      } else if (text.includes("string")) {
        chatRes = "String: sequence of characters. Example: 'hello'";
      } else if (text.includes("stack")) {
        chatRes = "Stack: LIFO structure. Push adds, pop removes.";
      } else if (text.includes("queue")) {
        chatRes = "Queue: FIFO structure. Enqueue adds, dequeue removes.";
      } else if (text.length < 10) {
        chatRes = "Ask a topic (e.g., arrays, strings, stack).";
      }
      
      return {
        response: chatRes,
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
