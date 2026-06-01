const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function calculateFileChecksum(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function readMirrorMeta(metaPath) {
  try {
    if (!fs.existsSync(metaPath)) return null;
    const parsed = JSON.parse(fs.readFileSync(metaPath, "utf-8") || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn("No se pudo leer metadatos del espejo local:", error && error.message ? error.message : error);
    return null;
  }
}

function writeMirrorMeta(metaPath, meta) {
  const dir = path.dirname(metaPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tempPath = `${metaPath}.${process.pid}-${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(meta, null, 2), "utf-8");
  fs.renameSync(tempPath, metaPath);
}

function cleanupOldMirrorTempFiles(dir, mirrorPath, metaPath) {
  const maxAgeMs = 24 * 60 * 60 * 1000;
  const names = [path.basename(mirrorPath), path.basename(metaPath)];
  try {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(name => {
      const isMirrorTemp = names.some(base => name.startsWith(`${base}.`) && name.endsWith(".tmp"))
        || (name.startsWith(".rrll-dashboard-mirror-") && name.endsWith(".tmp"));
      if (!isMirrorTemp) return;
      const file = path.join(dir, name);
      try {
        const stat = fs.statSync(file);
        if (Date.now() - stat.mtimeMs > maxAgeMs) fs.unlinkSync(file);
      } catch {}
    });
  } catch (error) {
    console.warn("No se pudieron limpiar temporales antiguos del espejo local:", error && error.message ? error.message : error);
  }
}

module.exports = {
  calculateFileChecksum,
  cleanupOldMirrorTempFiles,
  readMirrorMeta,
  writeMirrorMeta
};
