const axios = require("axios");
const crypto = require("crypto");
const NodeCache = require("node-cache");

// Cache responses for 10 minutes to conserve quota
const cache = new NodeCache({ stdTTL: 600 });

// Model cascade: try flash first, then pro as backup
const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
];

/**
 * Sleep helper for retry delays
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Single attempt to call one specific Gemini model
 */
async function callGeminiModel(apiKey, model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  };

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Gemini request timed out after 20s")), 20000)
  );

  const res = await Promise.race([
    axios.post(url, body, { headers: { "Content-Type": "application/json" } }),
    timeout,
  ]);

  const candidate = res.data?.candidates?.[0];
  if (!candidate) throw new Error("Gemini returned no candidate");

  return candidate.content.parts[0].text;
}

/**
 * Call Gemini with retry + model cascade
 * Returns { text, fallback }
 */
async function callGemini(rawPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("GEMINI_KEY_MISSING");
  }

  const optimizedPrompt = `You are PrepMind AI, an expert exam preparation tutor.
Always format your responses cleanly using proper Markdown, including bullet points, code blocks where necessary, and clear headings. Be concise, direct, and educational.

User Request:
${rawPrompt}`;

  const cacheKey = crypto.createHash("sha256").update(optimizedPrompt).digest("hex");

  // Return from cache if available
  if (cache.has(cacheKey)) {
    return { text: cache.get(cacheKey), fallback: false };
  }

  let lastError = null;

  // Try each model in the cascade with up to 2 retries on 429
  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const text = await callGeminiModel(apiKey, model, optimizedPrompt);
        cache.set(cacheKey, text);
        return { text, fallback: false };
      } catch (err) {
        const status = err?.response?.status;
        const errMsg = err?.response?.data?.error?.message || err.message;

        if (status === 429) {
          lastError = `Quota exceeded on ${model}`;
          console.warn(`[Gemini] 429 on ${model} attempt ${attempt}. ${attempt < 2 ? "Retrying..." : "Moving to next model."}`);
          if (attempt < 2) await sleep(1500);
          continue; // retry same model once, then move on
        }

        if (status === 401 || status === 403) {
          throw new Error(`Gemini auth error (${status}): ${errMsg}`);
        }

        lastError = errMsg || err.message;
        console.warn(`[Gemini] ${model} failed: ${lastError}`);
        break; // non-429 error — skip to next model
      }
    }
  }

  // All models exhausted
  throw new Error(`All Gemini models failed. Last error: ${lastError}`);
}

module.exports = { callGemini };
