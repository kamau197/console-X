// utils/file.js
const fs = require('fs');
const path = require('path');

function ensureUploads(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function removeFile(filepath) {
  try { fs.unlinkSync(filepath); } catch (e) { /* ignore */ }
}

module.exports = { ensureUploads, removeFile };
