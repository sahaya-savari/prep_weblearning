const axios = require("axios");
const crypto = require("crypto");
const NodeCache = require("node-cache");

// Cache API responses for 10 minutes to save quota
const cache = new NodeCache({ stdTTL: 600 });

/**
 * Call Google Gemini 1.5 Flash REST API with Caching and Optimized Prompts
 * @param {string} rawPrompt
 * @returns {Promise<string>} Generated text
 */
async function callGemini(rawPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("GEMINI_KEY_MISSING");
  }

  // Optimize prompt with explicit system instructions
  const optimizedPrompt = `You are PrepMind AI, an expert exam preparation tutor.
Always format your responses cleanly using proper Markdown, including bullet points, code blocks where necessary, and clear headings. Be concise, direct, and educational.

User Request:
${rawPrompt}`;

  // Generate a unique 256-bit hash for the prompt to use as the cache key
  const cacheKey = crypto.createHash('sha256').update(optimizedPrompt).digest('hex');

  // Check cache
  if (cache.has(cacheKey)) {
    console.log("[Gemini] Returning cached response.");
    return cache.get(cacheKey);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: optimizedPrompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  const res = await axios.post(url, body, {
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
  });

  const candidate = res.data?.candidates?.[0];
  if (!candidate) throw new Error("Gemini returned no candidate");

  const responseText = candidate.content.parts[0].text;
  
  // Store the response in cache
  cache.set(cacheKey, responseText);

  return responseText;
}

module.exports = { callGemini };
