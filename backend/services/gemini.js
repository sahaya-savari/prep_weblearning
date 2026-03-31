const axios = require("axios");
const crypto = require("crypto");
const NodeCache = require("node-cache");

// Cache API responses for 10 minutes to save quota
const cache = new NodeCache({ stdTTL: 600 });

/**
 * Extract a human-readable error from an Axios error (incl. Gemini API body).
 */
function extractAxiosError(err) {
  if (err.response) {
    // Gemini returned an HTTP error — extract the actual message
    const data = err.response.data;
    const geminiMsg = data?.error?.message || JSON.stringify(data).slice(0, 300);
    return `Gemini HTTP ${err.response.status}: ${geminiMsg}`;
  }
  if (err.request) {
    return `Gemini no response (timeout or network): ${err.message}`;
  }
  return err.message;
}

/**
 * Call Google Gemini REST API with caching and optimised prompts.
 * @param {string} rawPrompt
 * @returns {Promise<string>} Generated text
 */
async function callGemini(rawPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add a valid key to your Render environment variables."
    );
  }

  // Optimise prompt with explicit system instructions
  const optimizedPrompt = `You are PrepMind AI, an expert exam preparation tutor.
Always format your responses cleanly using proper Markdown, including bullet points, code blocks where necessary, and clear headings. Be concise, direct, and educational.

User Request:
${rawPrompt}`;

  // Cache key: sha256 of prompt
  const cacheKey = crypto
    .createHash("sha256")
    .update(optimizedPrompt)
    .digest("hex");

  if (cache.has(cacheKey)) {
    console.log("[Gemini] Returning cached response.");
    return cache.get(cacheKey);
  }

  // Try gemini-2.0-flash-lite first (most quota), then gemini-2.0-flash as fallback
  const models = ["gemini-2.0-flash-lite", "gemini-2.0-flash"];
  let lastError = null;

  for (const modelName of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ parts: [{ text: optimizedPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    try {
      console.log(`[Gemini] Trying model: ${modelName}`);
      const res = await axios.post(url, body, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      });

      const candidate = res.data?.candidates?.[0];
      if (!candidate) {
        const reason = res.data?.promptFeedback?.blockReason || "unknown";
        throw new Error(`Gemini returned no candidates. Block reason: ${reason}`);
      }

      const text = candidate.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini candidate had no text content.");

      console.log(`[Gemini] ✓ Responded using ${modelName}`);
      cache.set(cacheKey, text);
      return text;
    } catch (err) {
      lastError = extractAxiosError(err);
      console.error(`[Gemini] ✗ ${modelName} failed: ${lastError}`);
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError}`);
}

module.exports = { callGemini };
