const { callGemini } = require("./gemini");
const { callOllama } = require("./ollama");

/**
 * Primary AI router.
 * @param {string} prompt
 * @param {string} reqModel "gemini" | "ollama"
 * @returns {Promise<string>}
 */
async function generate(prompt, reqModel = "gemini") {
  if (reqModel === "ollama") {
    try {
      const result = await callOllama(prompt);
      console.log("[AI] Explicit Ollama request responded ✓");
      return result;
    } catch (ollamaErr) {
      console.error("[AI] Explicit Ollama request failed.");
      throw new Error(`AI unavailable. Ollama: ${ollamaErr.message}`);
    }
  }

  try {
    const result = await callGemini(prompt);
    console.log("[AI] Gemini responded ✓");
    return result;
  } catch (geminiErr) {
    console.warn(`[AI] Gemini failed: ${geminiErr.message}`);
    
    // Safety check: Don't fallback to local Ollama on a remote production server unless configured
    const isProd = process.env.NODE_ENV === "production";
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    if (isProd && ollamaUrl.includes("localhost")) {
       throw new Error(`AI unavailable. Gemini error: ${geminiErr.message}`);
    }

    console.log("[AI] Attempting Ollama fallback...");
    try {
      const result = await callOllama(prompt);
      console.log("[AI] Ollama fallback responded ✓");
      return result;
    } catch (ollamaErr) {
      console.error("[AI] Both Gemini and Ollama fallback failed.");
      throw new Error(
        `AI unavailable. Gemini: ${geminiErr.message} | Ollama: ${ollamaErr.message}`
      );
    }
  }
}

module.exports = { generate };
