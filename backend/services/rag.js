const supabase = require("./supabase");

async function addDocument(originalName, chunks, userId = null) {
  if (!supabase) throw new Error("Supabase URL or Key not configured");
  
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert({ name: originalName, user_id: userId })
    .select()
    .single();
    
  if (docError) throw new Error("DB Error documents: " + docError.message);
  const documentId = doc.id;

  const chunkRows = chunks.map(chunk => ({
    document_id: documentId,
    document_name: originalName,
    chunk_text: chunk,
    user_id: userId,
  }));
  
  const { error: chunkError } = await supabase.from('chunks').insert(chunkRows);
  if (chunkError) throw new Error("DB Error chunks: " + chunkError.message);

  return documentId;
}

async function retrieve(query, documentIds, topK = 5, userId = null) {
  if (!supabase) return [];
  
  const queryWords = new Set(
    query.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  );

  let queryBuilder = supabase.from('chunks').select('chunk_text, document_name');
  
  if (userId) {
    queryBuilder = queryBuilder.eq('user_id', userId);
  }

  if (documentIds && documentIds.length > 0) {
    queryBuilder = queryBuilder.in('document_id', documentIds);
  }

  const { data: allChunks, error } = await queryBuilder;
  if (error || !allChunks || allChunks.length === 0) return [];

  const scored = allChunks.map((entry) => {
    const words = entry.chunk_text.toLowerCase().split(/\W+/);
    const overlap = words.filter((w) => queryWords.has(w)).length;
    return { chunk: entry.chunk_text, documentName: entry.document_name, score: overlap };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ chunk, documentName }) => ({ chunk, documentName }));
}

async function listDocuments() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('documents').select('id, name');
  if (error || !data) return [];
  return data.map(d => ({ documentId: d.id, documentName: d.name }));
}

module.exports = { addDocument, retrieve, listDocuments };
