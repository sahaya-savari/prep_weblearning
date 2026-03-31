/**
 * In-memory RAG (Retrieval-Augmented Generation) store.
 * Documents are stored as arrays of chunks keyed by documentId.
 * Resets when the server restarts (Phase 3 will add Supabase persistence).
 */

/** @type {Map<string, { chunk: string; documentName: string }[]>} */
const store = new Map();

/**
 * Add a document's chunks to the store.
 * @param {string} documentId
 * @param {string} documentName
 * @param {string[]} chunks
 */
function addDocument(documentId, documentName, chunks) {
  const entries = chunks.map((chunk) => ({ chunk, documentName }));
  store.set(documentId, entries);
  console.log(`[RAG] Stored "${documentName}" (${chunks.length} chunks, id=${documentId})`);
}

/**
 * Retrieve the top-k most relevant chunks for a query using keyword overlap scoring.
 * @param {string} query
 * @param {string[]} [documentIds] — if provided, only search these docs
 * @param {number} [topK=5]
 * @returns {{ chunk: string; documentName: string }[]}
 */
function retrieve(query, documentIds, topK = 5) {
  const queryWords = new Set(
    query.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  );

  const allChunks = [];
  for (const [id, entries] of store.entries()) {
    if (documentIds && documentIds.length > 0 && !documentIds.includes(id)) continue;
    allChunks.push(...entries);
  }

  if (allChunks.length === 0) return [];

  // Score each chunk by word overlap with the query
  const scored = allChunks.map((entry) => {
    const words = entry.chunk.toLowerCase().split(/\W+/);
    const overlap = words.filter((w) => queryWords.has(w)).length;
    return { ...entry, score: overlap };
  });

  // Sort descending by score, return top-k unique snippets
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ chunk, documentName }) => ({ chunk, documentName }));
}

/** List all stored document IDs and names */
function listDocuments() {
  const result = [];
  for (const [id, entries] of store.entries()) {
    if (entries.length > 0) {
      result.push({ documentId: id, documentName: entries[0].documentName });
    }
  }
  return result;
}

module.exports = { addDocument, retrieve, listDocuments };
