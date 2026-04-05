const Groq = require("groq-sdk");
const { callOllama } = require("./ollama");
const { callGemini } = require("./gemini");

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const GROQ_MODEL = "llama-3.3-70b-versatile";

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    ),
  ]);
}

function estimateCost(provider, text) {
  const tokens = (text || "").length / 4;
  const pricing = {
    groq: 0.000002,
    gemini: 0.000001,
    local: 0,
  };

  return tokens * (pricing[provider] || 0);
}

function chooseProvider(question) {
  const length = (question || "").length;

  if (length < 50) return "local";
  if (length < 200) return "groq";
  return "groq";
}

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

async function generateWithLocalLLM(question, context = "") {
  const prompt = context
    ? `Context:\n${context}\n\nQuestion:\n${question}`
    : question;

  return callOllama(prompt);
}

async function generateWithGroq(question, context = "") {
  if (!groq) {
    throw new Error("GROQ_KEY_MISSING");
  }

  const userContent = context
    ? `Context:\n${context}\n\nQuestion:\n${question}`
    : question;

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content: "You are an AI tutor. Explain clearly with examples.",
      },
      {
        role: "user",
        content: userContent,
      },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  const text = response?.choices?.[0]?.message?.content;
  if (text && text.trim().length > 0) {
    return text;
  }

  throw new Error("Groq returned empty response");
}

async function generateWithGemini(question, context = "") {
  const prompt = context
    ? `Context:\n${context}\n\nQuestion:\n${question}`
    : question;

  const result = await callGemini(prompt);
  const text = result?.text;

  if (text && text.trim().length > 0) {
    return text;
  }

  throw new Error("Gemini returned empty response");
}

async function generateAnswer(question, context = "", reqModel = "groq") {
  if (reqModel === "local") {
    try {
      const text = await withTimeout(generateWithLocalLLM(question, context), 4000);
      console.log("✅ AI Provider Used: local");
      return { text, provider: "local", cost: estimateCost("local", text) };
    } catch (localError) {
      console.error("Local LLM failed:", localError);
      return { text: "Sorry, AI service is temporarily unavailable.", provider: "fallback", cost: 0 };
    }
  }

  const selectedModel = reqModel !== "auto" ? reqModel : chooseProvider(question);
  if (selectedModel === "local") {
    try {
      const text = await withTimeout(generateWithLocalLLM(question, context), 4000);
      console.log("✅ AI Provider Used: local");
      return { text, provider: "local", cost: estimateCost("local", text) };
    } catch (localError) {
      console.error("Local LLM failed:", localError);
      return { text: "Sorry, AI service is temporarily unavailable.", provider: "fallback", cost: 0 };
    }
  }

  const providers = selectedModel === "gemini"
    ? [
        { name: "gemini", fn: generateWithGemini },
        { name: "groq", fn: generateWithGroq },
      ]
    : [
        { name: "groq", fn: generateWithGroq },
        { name: "gemini", fn: generateWithGemini },
      ];

  for (const provider of providers) {
    try {
      const text = await withTimeout(provider.fn(question, context), 4000);
      console.log(`✅ AI Provider Used: ${provider.name}`);
      return { text, provider: provider.name, cost: estimateCost(provider.name, text) };
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error.message);
    }
  }

  try {
    const text = await generateWithLocalLLM(question, context);
    console.log("✅ AI Provider Used: local");
    return { text, provider: "local", cost: estimateCost("local", text) };
  } catch (localError) {
    console.error("Local LLM failed:", localError);
    return { text: "Sorry, AI service is temporarily unavailable.", provider: "fallback", cost: 0 };
  }
}

// ── AI router ─────────────────────────────────────────
async function generate(prompt, reqModel = "groq", type = "generic", topic = "this topic") {
  try {
    const result = await generateAnswer(prompt, "", reqModel);
    if (result.provider === "fallback") {
      return { ...generateFallbackContent(type, topic), text: null, provider: "fallback", fallback: true };
    }

    return { text: result.text, provider: result.provider, cost: result.cost, fallback: false };
  } catch (err) {
    console.error(`[AI] All providers failed: ${err.message}`);
    return { ...generateFallbackContent(type, topic), text: null, provider: "fallback", cost: 0, fallback: true };
  }
}

module.exports = { generate, generateAnswer, generateWithLocalLLM, generateFallbackContent, withTimeout, estimateCost, chooseProvider };
