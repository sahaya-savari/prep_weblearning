/**
 * Text chunker — splits a long string into overlapping chunks.
 * Uses ~500-word chunks with ~50-word overlap.
 */

const CHUNK_SIZE = 500;  // words per chunk
const OVERLAP = 50;      // words of overlap between consecutive chunks

/**
 * @param {string} text
 * @returns {string[]}
 */
function chunkText(text) {
  if (!text || text.trim().length === 0) return [];

  // Normalize whitespace
  const words = text.trim().split(/\s+/);

  if (words.length <= CHUNK_SIZE) return [words.join(" ")];

  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start += CHUNK_SIZE - OVERLAP;
  }

  return chunks;
}

module.exports = { chunkText };
