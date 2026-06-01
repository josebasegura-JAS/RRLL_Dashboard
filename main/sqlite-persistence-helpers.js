const fs = require("fs");
const path = require("path");

function createSqlitePersistenceHelpers({ getSQLRef }) {
  function ensureParentDir(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  function getDbTempPrefix(dbPath) {
    return `.rrll-${path.basename(dbPath)}-`;
  }

  function listDbTempFiles(dbPath) {
    const dir = path.dirname(dbPath);
    const prefix = getDbTempPrefix(dbPath);
    try {
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir)
        .filter(name => name.startsWith(prefix) && name.endsWith(".tmp"))
        .map(name => path.join(dir, name));
    } catch {
      return [];
    }
  }

  function cleanupDbTempFiles(dbPath, keepPath = "") {
    listDbTempFiles(dbPath).forEach(file => {
      if (keepPath && file === keepPath) return;
      try { fs.unlinkSync(file); } catch {}
    });
  }

  function fsyncFileIfPossible(fd, label) {
    try {
      fs.fsyncSync(fd);
    } catch (error) {
      console.warn(`No se pudo fsync ${label}:`, error && error.message ? error.message : error);
    }
  }

  function fsyncDirectoryIfPossible(dir) {
    let fd = null;
    try {
      fd = fs.openSync(dir, "r");
      fs.fsyncSync(fd);
    } catch (error) {
      console.warn("No se pudo fsync del directorio de BBDD:", error && error.message ? error.message : error);
    } finally {
      if (fd !== null) {
        try { fs.closeSync(fd); } catch {}
      }
    }
  }

  function validatePersistedDb(dbPath) {
    const stat = fs.statSync(dbPath);
    if (!stat.isFile() || stat.size <= 0) throw new Error("La base de datos persistida está vacía o no existe.");

    const SQLRef = getSQLRef();
    if (!SQLRef) return;
    const validationDb = new SQLRef.Database(fs.readFileSync(dbPath));
    try {
      validationDb.exec("SELECT name FROM sqlite_master LIMIT 1");
    } finally {
      try { validationDb.close(); } catch {}
    }
  }

  function readDbMetaValues(dbPath, keys) {
    const SQLRef = getSQLRef();
    if (!SQLRef || !fs.existsSync(dbPath)) return {};
    const db = new SQLRef.Database(fs.readFileSync(dbPath));
    try {
      const safeKeys = keys.filter(key => typeof key === "string" && key.length).map(key => `'${key.replace(/'/g, "''")}'`);
      if (!safeKeys.length) return {};
      const rows = db.exec(`SELECT key, value FROM meta WHERE key IN (${safeKeys.join(",")})`);
      const result = {};
      if (rows.length) {
        rows[0].values.forEach(([key, value]) => { result[key] = value; });
      }
      return result;
    } finally {
      try { db.close(); } catch {}
    }
  }

  function getDbLastUpdateToken(dbPath) {
    try {
      const meta = readDbMetaValues(dbPath, ["last_update_token"]);
      return meta.last_update_token || null;
    } catch (error) {
      console.warn("No se pudo leer token de actualización de BBDD:", error && error.message ? error.message : error);
      return null;
    }
  }

  function hasDbWriteArtifacts(dbPath) {
    const lockPath = `${dbPath}.lock`;
    if (fs.existsSync(lockPath)) return true;
    return listDbTempFiles(dbPath).length > 0;
  }

  function persistDb(db, dbPath) {
    ensureParentDir(dbPath);
    cleanupDbTempFiles(dbPath);

    const dir = path.dirname(dbPath);
    const tempPath = path.join(dir, `${getDbTempPrefix(dbPath)}${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
    const data = Buffer.from(db.export());
    let fd = null;

    try {
      fd = fs.openSync(tempPath, "wx");
      fs.writeFileSync(fd, data);
      fsyncFileIfPossible(fd, "del fichero temporal de BBDD");
      fs.closeSync(fd);
      fd = null;

      validatePersistedDb(tempPath);
      fs.renameSync(tempPath, dbPath);
      fsyncDirectoryIfPossible(dir);
      validatePersistedDb(dbPath);
    } catch (error) {
      if (fd !== null) {
        try { fs.closeSync(fd); } catch {}
      }
      try { fs.unlinkSync(tempPath); } catch {}
      throw error;
    } finally {
      cleanupDbTempFiles(dbPath);
    }
  }

  return {
    cleanupDbTempFiles,
    ensureParentDir,
    fsyncDirectoryIfPossible,
    fsyncFileIfPossible,
    getDbLastUpdateToken,
    getDbTempPrefix,
    hasDbWriteArtifacts,
    listDbTempFiles,
    persistDb,
    readDbMetaValues,
    validatePersistedDb
  };
}

module.exports = { createSqlitePersistenceHelpers };
