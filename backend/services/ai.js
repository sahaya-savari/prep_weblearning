const { callGemini } = require("./gemini");
const { callOllama } = require("./ollama");

/**
 * Primary AI router.
 * Tries Gemini first; if it fails (key missing, quota, etc.), falls back to Ollama.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function generate(prompt) {
  try {
    const result = await callGemini(prompt);
    console.log("[AI] Gemini responded ✓");
    return result;
  } catch (geminiErr) {
    console.warn(`[AI] Gemini failed (${geminiErr.message}), trying Ollama...`);
    try {
      const result = await callOllama(prompt);
      console.log("[AI] Ollama responded ✓");
      return result;
    } catch (ollamaErr) {
      console.error("[AI] Both Gemini and Ollama failed.");
      throw new Error(
        `AI unavailable. Gemini: ${geminiErr.message} | Ollama: ${ollamaErr.message}`
      );
    }
  }
}

module.exports = { generate };
