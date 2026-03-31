const axios = require("axios");
const crypto = require("crypto");
const NodeCache = require("node-cache");

// Cache API responses for 10 minutes to save quota
const cache = new NodeCache({ stdTTL: 600 });

/**
 * Call Google Gemini 1.5 Flash REST API or local Ollama with Caching and Optimized Prompts
 * @param {string} rawPrompt
 * @param {string} model "gemini" | "ollama"
 * @returns {Promise<string>} Generated text
 */
async function callGemini(rawPrompt, model = "gemini") {
  // Optimize prompt with explicit system instructions
  const optimizedPrompt = `You are PrepMind AI, an expert exam preparation tutor.
Always format your responses cleanly using proper Markdown, including bullet points, code blocks where necessary, and clear headings. Be concise, direct, and educational.

User Request:
${rawPrompt}`;

  // Generate a unique 256-bit hash for the prompt+model to use as the cache key
  const cacheKey = crypto.createHash('sha256').update(model + optimizedPrompt).digest('hex');

  // Check cache
  if (cache.has(cacheKey)) {
    console.log(`[${model}] Returning cached response.`);
    return cache.get(cacheKey);
  }

  let responseText = "";

  if (model === "ollama") {
    // Route to local Ollama
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const res = await axios.post(`${ollamaUrl}/api/generate`, {
      model: "llama3", // Default local model
      prompt: optimizedPrompt,
      stream: false
    }, { timeout: 60000 });
    
    responseText = res.data.response;
  } else {
    // Default: Route to Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      throw new Error("GEMINI_KEY_MISSING");
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

    responseText = candidate.content.parts[0].text;
  }
  
  // Store the response in cache
  cache.set(cacheKey, responseText);

  return responseText;
}

module.exports = { callGemini };
