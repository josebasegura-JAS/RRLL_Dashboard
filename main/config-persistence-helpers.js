const fs = require("fs");
const path = require("path");

function fsyncFileIfPossible(fd) {
  try {
    fs.fsyncSync(fd);
  } catch (error) {
    console.warn("No se pudo fsync del fichero temporal de configuración:", error && error.message ? error.message : error);
  }
}

function fsyncDirectoryIfPossible(dir) {
  let fd = null;
  try {
    fd = fs.openSync(dir, "r");
    fs.fsyncSync(fd);
  } catch (error) {
    console.warn("No se pudo fsync del directorio de configuración:", error && error.message ? error.message : error);
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch {}
    }
  }
}

function writeJsonAtomically(filePath, value) {
  const dir = path.dirname(filePath);
  const tempPath = path.join(dir, `.${path.basename(filePath)}-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
  let fd = null;

  try {
    fd = fs.openSync(tempPath, "wx");
    fs.writeFileSync(fd, JSON.stringify(value, null, 2), "utf-8");
    fsyncFileIfPossible(fd);
    fs.closeSync(fd);
    fd = null;

    fs.renameSync(tempPath, filePath);
    fsyncDirectoryIfPossible(dir);
  } catch (error) {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch {}
    }
    try { fs.unlinkSync(tempPath); } catch {}
    throw error;
  }
}

module.exports = { writeJsonAtomically };
