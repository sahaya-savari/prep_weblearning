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
      console.error("[AI] Explict Ollama request failed.");
      throw new Error(`AI unavailable. Ollama: ${ollamaErr.message}`);
    }
  }

  try {
    const result = await callGemini(prompt);
    console.log("[AI] Gemini responded ✓");
    return result;
  } catch (geminiErr) {
    console.warn(`[AI] Gemini failed (${geminiErr.message}), trying Ollama...`);
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
