const axios = require("axios");

/**
 * Call a local Ollama model as a fallback.
 * @param {string} prompt
 * @returns {Promise<string>} Generated text
 */
async function callOllama(prompt) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3";

  const res = await axios.post(
    `${baseUrl}/api/generate`,
    { model, prompt, stream: false },
    { timeout: 60000 }
  );

  if (!res.data?.response) throw new Error("Ollama returned no response");
  return res.data.response;
}

module.exports = { callOllama };
