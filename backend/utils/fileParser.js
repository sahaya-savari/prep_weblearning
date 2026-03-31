const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

/**
 * Parse a file buffer or path into plain text.
 * @param {Buffer} buffer
 * @param {string} originalName - filename with extension
 * @returns {Promise<string>}
 */
async function parseFile(buffer, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === ".pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === ".txt" || ext === ".md") {
    return buffer.toString("utf-8");
  }

  throw new Error(`Unsupported file type: ${ext}. Supported: .pdf, .txt, .md`);
}

module.exports = { parseFile };
