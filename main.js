const { app, BrowserWindow, shell, ipcMain, Menu, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");

let lastBackupAt = 0;
let sqlReadyPromise = null;
let SQLRef = null;
let lastBackupMeta = null;
let startupDbAlert = null;

const DEFAULT_RRLL_FOLDER_PATH = "G:\\Capital Humano\\Relaciones Laborales";


function getLocalSqlitePath() {
  return path.join(app.getPath("userData"), "rrll-dashboard.sqlite");
}

function getLegacyJsonPath() {
  return path.join(app.getPath("userData"), "rrll-dashboard-db-v1-1-beta.json");
}

function getDbConfigPath() {
  return path.join(app.getPath("userData"), "rrll-db-config.json");
}

function getRRLLFolderConfigPath() {
  return path.join(app.getPath("userData"), "rrll-folder-config.json");
}

function getBackupsDir() {
  return path.join(app.getPath("userData"), "backups");
}

function ensureBackupsDir() {
  const dir = getBackupsDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getNetworkBackupsDir() {
  const info = resolveDbAccessInfo();
  if (!info.sharedDir) return "";
  const dir = path.join(info.sharedDir, "backups-red");
  return fs.existsSync(info.sharedDir) ? dir : "";
}

function sanitizeUserForFileName() {
  return String(getWindowsUser() || "USUARIO")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .toUpperCase();
}

function ts() {
  const now = new Date();
  const pad = value => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

function listBackupFiles(dir, ext) {
  if (!dir || !fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => name.startsWith("backup_") && name.endsWith(ext))
    .map(name => {
      const file = path.join(dir, name);
      const stat = fs.statSync(file);
      return { file, name, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function pruneBackups(dir, ext, maxCount) {
  const files = listBackupFiles(dir, ext);
  files.slice(maxCount).forEach(({ file, name }) => {
    if (name.includes("_SUSPECT")) return;
    try { fs.unlinkSync(file); } catch {}
  });
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function getWindowsUser() {
  const domain = process.env.USERDOMAIN || os.hostname();
  let username = "usuario";
  try {
    username = os.userInfo().username || process.env.USERNAME || username;
  } catch {
    username = process.env.USERNAME || username;
  }
  return `${domain}\\${username}`;
}

function applyBasicUserTrace(value, user) {
  const now = new Date().toISOString();
  const seen = new WeakSet();
  function walk(input) {
    if (Array.isArray(input)) return input.map(walk);
    if (!isPlainObject(input)) return input;
    if (seen.has(input)) return input;
    seen.add(input);

    const output = {};
    Object.entries(input).forEach(([key, val]) => {
      output[key] = walk(val);
    });

    const looksLikeRecord = Object.prototype.hasOwnProperty.call(output, "id")
      || Object.prototype.hasOwnProperty.call(output, "createdAt")
      || Object.prototype.hasOwnProperty.call(output, "updatedAt");

    if (looksLikeRecord) {
      if (!output.createdBy) output.createdBy = user;
      output.updatedBy = user;
      if (!output.createdAt) output.createdAt = now;
      output.updatedAt = now;
    }
    return output;
  }
  return walk(value);
}

function serializeValue(value) {
  return JSON.stringify(value);
}

function parseValue(value) {
  try { return JSON.parse(value); } catch { return value; }
}

function readDbConfig() {
  try {
    const file = getDbConfigPath();
    if (!fs.existsSync(file)) return { mode: "local" };
    const parsed = JSON.parse(fs.readFileSync(file, "utf-8") || "{}");
    if (!isPlainObject(parsed)) return { mode: "local" };
    if (parsed.mode === "shared" && parsed.sharedDbPath) return parsed;
    return { mode: "local" };
  } catch {
    return { mode: "local" };
  }
}

function writeDbConfig(config) {
  fs.writeFileSync(getDbConfigPath(), JSON.stringify(config, null, 2), "utf-8");
}

function getActiveDbInfo() {
  const config = readDbConfig();
  const localPath = getLocalSqlitePath();
  if (config.mode === "shared" && config.sharedDbPath) {
    return {
      mode: "shared",
      path: config.sharedDbPath,
      sharedDir: config.sharedDir || path.dirname(config.sharedDbPath),
      user: getWindowsUser(),
      localPath
    };
  }
  return { mode: "local", path: localPath, user: getWindowsUser(), localPath };
}

function isPathAccessible(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveDbAccessInfo() {
  const config = readDbConfig();
  const localPath = getLocalSqlitePath();
  const user = getWindowsUser();
  if (config.mode === "shared" && config.sharedDbPath) {
    const sharedDir = config.sharedDir || path.dirname(config.sharedDbPath);
    const sharedReachable = fs.existsSync(sharedDir)
      && isPathAccessible(sharedDir)
      && (!fs.existsSync(config.sharedDbPath) || isPathAccessible(config.sharedDbPath));
    if (sharedReachable) {
      startupDbAlert = null;
      const info = { mode: "shared", effectiveMode: "shared", path: config.sharedDbPath, sharedDir, configuredSharedPath: config.sharedDbPath, user, localPath, fallbackLocal: false };
      logDbMode("Modo activo: red", info);
      return info;
    }
    startupDbAlert = {
      title: "Base de datos de red no disponible",
      message: "No se ha podido acceder a la base de datos compartida. La aplicación se ha abierto con los datos locales de este equipo. Cuando recuperes conexión, puedes reintentar desde Configuración.",
      configuredPath: config.sharedDbPath
    };
    const info = { mode: "shared", effectiveMode: "local", path: localPath, sharedDir, configuredSharedPath: config.sharedDbPath, user, localPath, fallbackLocal: true };
    logDbMode("Modo activo: local temporal", info, { fallbackReason: "Red no disponible" });
    return info;
  }
  startupDbAlert = null;
  const info = { mode: "local", effectiveMode: "local", path: localPath, user, localPath, fallbackLocal: false };
  logDbMode("Modo activo: local", info);
  return info;
}


function logDbMode(prefix, info, extra = {}) {
  const payload = {
    mode: info && info.mode ? info.mode : "unknown",
    effectiveMode: info && info.effectiveMode ? info.effectiveMode : "unknown",
    activePath: info && info.path ? info.path : "",
    configuredSharedPath: info && info.configuredSharedPath ? info.configuredSharedPath : "",
    sharedDir: info && info.sharedDir ? info.sharedDir : "",
    fallbackLocal: !!(info && info.fallbackLocal),
    ...extra
  };
  console.log(`[RRLL][DB] ${prefix}`, payload);
}

async function getSQL() {
  if (SQLRef) return SQLRef;
  if (!sqlReadyPromise) {
    sqlReadyPromise = (async () => {
      const initSqlJs = require("sql.js");
      const wasmPath = require.resolve("sql.js/dist/sql-wasm.wasm");
      SQLRef = await initSqlJs({ locateFile: () => wasmPath });
      return SQLRef;
    })();
  }
  return sqlReadyPromise;
}

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readLegacyJsonDatabase() {
  try {
    const legacyPath = getLegacyJsonPath();
    if (!fs.existsSync(legacyPath)) return {};
    const parsed = JSON.parse(fs.readFileSync(legacyPath, "utf-8") || "{}");
    return isPlainObject(parsed) ? parsed : {};
  } catch (error) {
    console.error("No se pudo leer la base JSON anterior:", error);
    return {};
  }
}

async function openDatabase(dbPath) {
  const SQL = await getSQL();
  ensureParentDir(dbPath);
  const exists = fs.existsSync(dbPath);
  const db = exists ? new SQL.Database(fs.readFileSync(dbPath)) : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      user TEXT NOT NULL,
      action TEXT NOT NULL,
      key TEXT,
      detail TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rrll_criteria (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      subject TEXT NOT NULL,
      generalCriterion TEXT NOT NULL,
      observations TEXT,
      tags TEXT,
      origin TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);



  db.run(`
    CREATE TABLE IF NOT EXISTS mesas_electorales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_mesa TEXT NOT NULL,
      colegio_electoral TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS recorridos_mesa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mesa_id INTEGER NOT NULL,
      orden INTEGER,
      estacion TEXT,
      tiempo_parada TEXT,
      tipo_parada TEXT
    );
  `);

  try { db.run("ALTER TABLE kv_store ADD COLUMN updated_by TEXT"); } catch {}

  const versionRow = db.exec("SELECT value FROM meta WHERE key = 'schema_version'");
  if (!versionRow.length) {
    db.run("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', '2')");
  }

  return { db, existed: exists };
}

function persistDb(db, dbPath) {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withFileLock(dbPath, operation) {
  const lockPath = `${dbPath}.lock`;
  ensureParentDir(lockPath);
  const maxAttempts = 40;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let fd = null;
    try {
      try {
        const stat = fs.existsSync(lockPath) ? fs.statSync(lockPath) : null;
        if (stat && Date.now() - stat.mtimeMs > 30000) fs.unlinkSync(lockPath);
      } catch {}

      fd = fs.openSync(lockPath, "wx");
      fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, user: getWindowsUser(), createdAt: new Date().toISOString() }));
      const result = await operation();
      try { fs.closeSync(fd); } catch {}
      try { fs.unlinkSync(lockPath); } catch {}
      return result;
    } catch (error) {
      if (fd !== null) {
        try { fs.closeSync(fd); } catch {}
        try { fs.unlinkSync(lockPath); } catch {}
      }
      if (error && error.code === "EEXIST") {
        await sleep(150);
        continue;
      }
      throw error;
    }
  }

  throw new Error("La base de datos está bloqueada por otro usuario. Inténtalo de nuevo en unos segundos.");
}

function addAudit(db, action, key, detail) {
  const now = new Date().toISOString();
  const user = getWindowsUser();
  db.run("INSERT INTO audit_log (created_at, user, action, key, detail) VALUES (?, ?, ?, ?, ?)", [now, user, action, key || null, detail || null]);
}

function touchDatabaseState(db) {
  const now = new Date().toISOString();
  const user = getWindowsUser();
  db.run("INSERT OR REPLACE INTO meta (key, value) VALUES ('last_update', ?)", [now]);
  db.run("INSERT OR REPLACE INTO meta (key, value) VALUES ('last_update_by', ?)", [user]);
  db.run("INSERT OR REPLACE INTO meta (key, value) VALUES ('last_update_token', ?)", [`${now}-${process.pid}-${Math.random().toString(36).slice(2)}`]);
}


function syncCriteriaTable(db, criteria) {
  const rows = Array.isArray(criteria) ? criteria : [];
  db.run("DELETE FROM rrll_criteria");
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO rrll_criteria
    (id, date, subject, generalCriterion, observations, tags, origin, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  rows.forEach(item => {
    if (!item || typeof item !== "object" || !item.id) return;
    stmt.run([
      String(item.id),
      String(item.date || ""),
      String(item.subject || ""),
      String(item.generalCriterion || ""),
      String(item.observations || ""),
      String(item.tags || ""),
      String(item.origin || ""),
      String(item.createdAt || new Date().toISOString()),
      String(item.updatedAt || item.createdAt || new Date().toISOString())
    ]);
  });
  stmt.free();
}

function loadCriteriaTable(db) {
  const result = [];
  const rows = db.exec("SELECT id, date, subject, generalCriterion, observations, tags, origin, createdAt, updatedAt FROM rrll_criteria ORDER BY date DESC, updatedAt DESC");
  if (!rows.length) return result;
  rows[0].values.forEach(([id, date, subject, generalCriterion, observations, tags, origin, createdAt, updatedAt]) => {
    result.push({ id, date, subject, generalCriterion, observations, tags, origin, createdAt, updatedAt });
  });
  return result;
}

async function getDbState() {
  const info = resolveDbAccessInfo();
  return withFileLock(info.path, async () => {
    const { db } = await openDatabase(info.path);
    try {
      const result = {
        mode: info.mode,
        effectiveMode: info.effectiveMode,
        fallbackLocal: !!info.fallbackLocal,
        configuredSharedPath: info.configuredSharedPath || "",
        path: info.path,
        user: info.user,
        lastUpdate: null,
        lastUpdateBy: null,
        token: null
      };
      const rows = db.exec("SELECT key, value FROM meta WHERE key IN ('last_update', 'last_update_by', 'last_update_token')");
      if (rows.length) {
        rows[0].values.forEach(([key, value]) => {
          if (key === 'last_update') result.lastUpdate = value;
          if (key === 'last_update_by') result.lastUpdateBy = value;
          if (key === 'last_update_token') result.token = value;
        });
      }
      return result;
    } finally {
      try { db.close(); } catch {}
    }
  });
}

async function loadAllData() {
  const info = resolveDbAccessInfo();
  return withFileLock(info.path, async () => {
    const { db, existed } = await openDatabase(info.path);
    try {
      if (!existed && info.effectiveMode === "local") {
        const legacy = readLegacyJsonDatabase();
        if (Object.keys(legacy).length) {
          const now = new Date().toISOString();
          const stmt = db.prepare("INSERT OR REPLACE INTO kv_store (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)");
          Object.entries(legacy).forEach(([key, value]) => {
            if (typeof key === "string" && key.startsWith("rrll_")) stmt.run([key, serializeValue(value), now, getWindowsUser()]);
          });
          stmt.free();
          addAudit(db, "migrate_legacy_json", null, "Migración inicial desde JSON local");
          touchDatabaseState(db);
          persistDb(db, info.path);
        } else {
          touchDatabaseState(db);
          persistDb(db, info.path);
        }
      }

      const result = {};
      const rows = db.exec("SELECT key, value FROM kv_store WHERE key LIKE 'rrll_%' ORDER BY key");
      if (rows.length) {
        rows[0].values.forEach(([key, value]) => { result[key] = parseValue(value); });
      }
      if (!Object.prototype.hasOwnProperty.call(result, "rrll_criteria")) {
        const criteriaRows = loadCriteriaTable(db);
        if (criteriaRows.length) result.rrll_criteria = criteriaRows;
      }
      return result;
    } finally {
      try { db.close(); } catch {}
    }
  });
}

async function saveKeyData(key, value) {
  if (typeof key !== "string" || !key.startsWith("rrll_")) return false;
  const info = resolveDbAccessInfo();
  return withFileLock(info.path, async () => {
    const { db } = await openDatabase(info.path);
    try {
      const now = new Date().toISOString();
      const user = getWindowsUser();
      const tracedValue = applyBasicUserTrace(value, user);
      db.run("INSERT OR REPLACE INTO kv_store (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)", [key, serializeValue(tracedValue), now, user]);
      if (key === "rrll_criteria") syncCriteriaTable(db, tracedValue);
      addAudit(db, "save_key", key, null);
      touchDatabaseState(db);
      persistDb(db, info.path);
      return true;
    } finally {
      try { db.close(); } catch {}
    }
  });
}

async function saveAllData(data) {
  const safe = isPlainObject(data) ? data : {};
  await createRobustBackup("before_massive_import_or_destructive", await loadAllData(), { throttleMs: 0 });
  const info = resolveDbAccessInfo();
  return withFileLock(info.path, async () => {
    const { db } = await openDatabase(info.path);
    try {
      const now = new Date().toISOString();
      const user = getWindowsUser();
      const tracedData = applyBasicUserTrace(safe, user);
      db.run("BEGIN TRANSACTION");
      try {
        db.run("DELETE FROM kv_store WHERE key LIKE 'rrll_%'");
        const stmt = db.prepare("INSERT OR REPLACE INTO kv_store (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)");
        Object.entries(tracedData).forEach(([key, value]) => {
          if (typeof key === "string" && key.startsWith("rrll_")) stmt.run([key, serializeValue(value), now, user]);
        });
        stmt.free();
        syncCriteriaTable(db, tracedData.rrll_criteria);
        addAudit(db, "save_all", null, "Guardado completo / importación");
        touchDatabaseState(db);
        db.run("COMMIT");
      } catch (error) {
        try { db.run("ROLLBACK"); } catch {}
        throw error;
      }
      persistDb(db, info.path);
      await createRobustBackup("after_important_save", safe, { throttleMs: 0 });
      return true;
    } finally {
      try { db.close(); } catch {}
    }
  });
}

async function backupAllData(data) {
  return createRobustBackup("manual", data, { throttleMs: 600 });
}

async function createRobustBackup(reason, data, options = {}) {
  const nowMs = Date.now();
  const throttleMs = Number(options.throttleMs || 0);
  if (throttleMs && nowMs - lastBackupAt < throttleMs) return { ok: false, skipped: "throttle" };
  lastBackupAt = nowMs;
  const safe = isPlainObject(data) ? data : {};
  const info = resolveDbAccessInfo();
  const keyCount = Object.keys(safe).filter(k => k.startsWith("rrll_")).length;
  if (!keyCount) return { ok: false, skipped: "empty" };
  const criticalCount = Object.keys(safe).filter(k => k.startsWith("rrll_")).length;
  const suspicious = criticalCount < 3;
  const suffix = suspicious ? "_SUSPECT" : "";
  const baseName = `backup_${ts()}_${sanitizeUserForFileName()}${suffix}`;
  const localDir = ensureBackupsDir();
  const networkDir = getNetworkBackupsDir();
  if (networkDir && !fs.existsSync(networkDir)) fs.mkdirSync(networkDir, { recursive: true });

  const payload = JSON.stringify({
    app: "Cuadro de Mando de RRLL",
    version: "2.0-backup",
    createdAt: new Date().toISOString(),
    reason,
    databaseMode: info.mode,
    databasePath: info.path,
    user: getWindowsUser(),
    keyCount,
    suspicious,
    values: safe
  }, null, 2);

  const writeTarget = targetDir => {
    fs.writeFileSync(path.join(targetDir, `${baseName}.json`), payload, "utf-8");
    if (fs.existsSync(info.path)) fs.copyFileSync(info.path, path.join(targetDir, `${baseName}.sqlite`));
  };
  writeTarget(localDir);
  if (networkDir) writeTarget(networkDir);

  pruneBackups(localDir, ".json", 50);
  pruneBackups(localDir, ".sqlite", 50);
  if (networkDir) {
    pruneBackups(networkDir, ".json", 100);
    pruneBackups(networkDir, ".sqlite", 100);
  }

  lastBackupMeta = { ok: !suspicious, suspicious, createdAt: new Date().toISOString(), reason, localDir, networkDir, baseName, dbPath: info.path };
  return { ok: true, suspicious, keyCount, fileBase: baseName };
}

async function getDbInfo() {
  const info = resolveDbAccessInfo();
  return {
    mode: info.mode,
    effectiveMode: info.effectiveMode,
    path: info.path,
    sharedDir: info.sharedDir || "",
    user: info.user,
    localPath: info.localPath,
    fallbackLocal: !!info.fallbackLocal,
    configuredSharedPath: info.configuredSharedPath || ""
  };
}

function normalizeRRLLFolderPath(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function getRRLLFolderPath() {
  try {
    const file = getRRLLFolderConfigPath();
    if (!fs.existsSync(file)) return DEFAULT_RRLL_FOLDER_PATH;
    const parsed = JSON.parse(fs.readFileSync(file, "utf-8") || "{}");
    const savedPath = normalizeRRLLFolderPath(parsed && parsed.path);
    return savedPath || DEFAULT_RRLL_FOLDER_PATH;
  } catch {
    return DEFAULT_RRLL_FOLDER_PATH;
  }
}

async function setRRLLFolderPath(_event, folderPath) {
  await createRobustBackup("before_change_shared_folder", await loadAllData());
  const safePath = normalizeRRLLFolderPath(folderPath);
  if (!safePath) throw new Error("Ruta no válida.");
  fs.writeFileSync(
    getRRLLFolderConfigPath(),
    JSON.stringify({ path: safePath, updatedAt: new Date().toISOString(), updatedBy: getWindowsUser() }, null, 2),
    "utf-8"
  );
  return safePath;
}

async function openRRLLFolder() {
  const folderPath = await getRRLLFolderPath();
  if (!folderPath) return { ok: false, path: folderPath };
  const openError = await shell.openPath(folderPath);
  if (openError) return { ok: false, path: folderPath, error: openError };
  return { ok: true, path: folderPath };
}

async function chooseSharedDirectory() {
  const result = await dialog.showOpenDialog({
    title: "Seleccionar carpeta compartida para la base de datos",
    properties: ["openDirectory", "createDirectory"]
  });
  if (result.canceled || !result.filePaths || !result.filePaths[0]) return null;
  return result.filePaths[0];
}


async function inspectSharedDatabase(directory) {
  if (!directory || typeof directory !== "string") throw new Error("Carpeta compartida no válida.");
  if (!fs.existsSync(directory)) throw new Error("La carpeta compartida no existe.");
  const sharedDbPath = path.join(directory, "rrll-dashboard-shared.sqlite");
  const writableProbe = path.join(directory, `.rrll_write_test_${Date.now()}.tmp`);
  try { fs.writeFileSync(writableProbe, "ok", "utf-8"); fs.unlinkSync(writableProbe); } catch { throw new Error("No se pudo escribir en la carpeta"); }

  const exists = fs.existsSync(sharedDbPath);
  const SQL = await getSQL();
  const db = exists ? new SQL.Database(fs.readFileSync(sharedDbPath)) : new SQL.Database();
  try {
    const kvExists = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='kv_store'").length > 0;
    if (!kvExists && exists) throw new Error("La base compartida no contiene tabla kv_store");
    const keyRow = kvExists ? db.exec("SELECT COUNT(*) FROM kv_store WHERE key LIKE 'rrll_%'") : [];
    const rrllKeyCount = keyRow.length ? Number(keyRow[0].values[0][0] || 0) : 0;
    const status = !exists ? "missing" : (rrllKeyCount > 0 ? "valid" : "empty");
    return { exists, status, sharedDbPath, rrllKeyCount, kvStore: kvExists, canRead: true, canWrite: true };
  } finally { try { db.close(); } catch {} }
}

async function setSharedDirectory(_event, directory, currentData, options = {}) {
  const preMigrationSnapshot = await loadAllData();
  const originData = isPlainObject(currentData) && Object.keys(currentData).length ? currentData : preMigrationSnapshot;
  const localKeyCount = Object.keys(preMigrationSnapshot || {}).filter(k => k.startsWith("rrll_")).length;
  const inspection = await inspectSharedDatabase(directory);
  const allowExistingLowerCount = !!(options && options.allowExistingLowerCount);

  logDbMode("Solicitud de cambio a red", resolveDbAccessInfo(), {
    configuredSharedPath: inspection.sharedDbPath,
    targetStatus: inspection.status,
    originKeyCount: localKeyCount,
    existingSharedKeyCount: Number(inspection.rrllKeyCount || 0),
    allowExistingLowerCount
  });

  await createRobustBackup("before_migrate_local_to_shared", preMigrationSnapshot, { throttleMs: 0 });
  console.log("[RRLL][DB] Backup creado antes de migrar local → red", { sharedDbPath: inspection.sharedDbPath });

  const sharedDbPath = inspection.sharedDbPath;
  const shouldSeedFromLocal = inspection.status === "missing" || inspection.status === "empty";

  writeDbConfig({ mode: "shared", sharedDir: directory, sharedDbPath });

  if (shouldSeedFromLocal) {
    await saveAllData(originData);
    console.log("[RRLL][DB] Migración local → red completada", { sharedDbPath, seededFromLocal: true });
  } else {
    console.log("[RRLL][DB] Base de red existente con datos; se conecta sin sobrescribir", { sharedDbPath });
  }

  const post = await loadAllData();
  const postCount = Object.keys(post || {}).filter(k => k.startsWith("rrll_")).length;
  if (postCount < localKeyCount && !allowExistingLowerCount) {
    writeDbConfig({ mode: "local" });
    console.warn("[RRLL][DB] Migración local → red bloqueada por seguridad", { originKeyCount: localKeyCount, resultingKeyCount: postCount, sharedDbPath });
    throw new Error("La base de red resultante tiene menos datos RRLL que la base local. Operación bloqueada por seguridad.");
  }

  return { ...(await getDbInfo()), message: "Conectado a base compartida", inspection: { ...inspection, rrllKeyCount: postCount } };
}


async function useLocalDatabase(_event, currentData) {
  await createRobustBackup("before_migrate_shared_to_local", await loadAllData());
  writeDbConfig({ mode: "local" });
  if (isPlainObject(currentData) && Object.keys(currentData).length) {
    await saveAllData(currentData);
  }
  return getDbInfo();
}


function decodeXmlText(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function stripXml(value) {
  return decodeXmlText(String(value || "").replace(/<[^>]+>/g, ""));
}

function getCellText(cellXml) {
  const parts = [];
  const paragraphs = String(cellXml || "").match(/<w:p[\s\S]*?<\/w:p>/g) || [];
  paragraphs.forEach(paragraph => {
    const texts = [...paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(match => decodeXmlText(match[1]));
    const text = texts.join("").replace(/\s+/g, " ").trim();
    if (text) parts.push(text);
  });
  if (!parts.length) {
    return stripXml(cellXml).replace(/\s+/g, " ").trim();
  }
  return parts.join("\n").trim();
}

function uniqueConsecutive(values) {
  const out = [];
  values.forEach(value => {
    const cleaned = String(value || "").trim();
    if (!cleaned) return;
    if (!out.length || out[out.length - 1] !== cleaned) out.push(cleaned);
  });
  return out;
}

function isCodeLike(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  if (/^X{4,}$/i.test(text)) return true;
  if (/^CE\s*\d{1,2}\s*-\s*\d{4}$/i.test(text)) return true;
  if (/^CE\s*\d{2}\s*-?\s*\d{4}$/i.test(text)) return true;
  if (/^\d{2}(?:\/\d{2})?\s*[-.]\s*(?:PE|CP)\s*[-.]\s*(?:AR|DC)\s*[-.]\s*\d{1,3}$/i.test(text)) return true;
  if (/^\d{2}\s*[-.]\s*(?:PE|CP)\s*[-.]\s*\d{1,3}$/i.test(text)) return true;
  return false;
}

function isDateLike(value) {
  return /(?:\d{1,2}\s*(?:y\s*\d{1,2})?\s*\/\s*\d{1,2}\s*\/\s*\d{2,4})|(?:\/\/\s*\d{4})/.test(String(value || ""));
}

function normalizeCommitteeDate(value, fallbackYear) {
  const text = String(value || "").trim();
  let match = text.match(/(\d{1,2})\s*y\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2,4})/);
  if (match) {
    const day = String(match[2]).padStart(2, "0");
    const month = String(match[3]).padStart(2, "0");
    let year = String(match[4]);
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  match = text.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2,4})/);
  if (match) {
    const day = String(match[1]).padStart(2, "0");
    const month = String(match[2]).padStart(2, "0");
    let year = String(match[3]);
    if (year.length === 2) year = Number(year) > 70 ? `19${year}` : `20${year}`;
    return `${year}-${month}-${day}`;
  }
  return "";
}

function splitCommitteePoints(text) {
  const raw = String(text || "")
    .replace(/\u00a0/g, " ")
    .split(/\n+/)
    .map(x => x.replace(/^[\s·•\-*]+/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const bad = /^(orden del d[ií]a\.?|varios\.?|anexos?\.?|\u00a0|\.)$/i;
  return raw
    .filter(x => !bad.test(x))
    .filter(x => !/^20\d{2}$/.test(x))
    .filter(x => x.length > 2);
}

function parseCommitteeHistoryDocx(filePath, options = {}) {
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(filePath);
  const entry = zip.getEntry("word/document.xml");
  if (!entry) throw new Error("No se ha podido leer el contenido del Word.");
  const xml = entry.getData().toString("utf-8");
  const tables = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  const sessions = [];
  const sessionLabel = options.sessionLabel || "Comité";
  const sourceLabel = options.sourceLabel || "Histórico importado";
  let current = null;
  let currentYear = "";

  function addPointsToCurrent(cells) {
    if (!current) return;
    const pointCells = cells.filter(cell => {
      if (!cell) return false;
      if (isCodeLike(cell) || isDateLike(cell)) return false;
      if (/^20\d{2}$/.test(cell)) return false;
      if (/^orden del d[ií]a\.?$/i.test(cell)) return false;
      if (/^varios\.?$/i.test(cell)) return false;
      return true;
    });
    pointCells.forEach(cell => {
      splitCommitteePoints(cell).forEach(point => {
        const normalized = point.toLowerCase();
        if (current.items.some(item => String(item.title || "").toLowerCase() === normalized)) return;
        current.items.push({
          id: `hist-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          title: point,
          notes: "",
          source: sourceLabel,
          createdAt: new Date().toISOString()
        });
      });
    });
  }

  tables.forEach(tableXml => {
    const rows = tableXml.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    rows.forEach(rowXml => {
      const cellXmls = rowXml.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
      const cells = uniqueConsecutive(cellXmls.map(getCellText));
      if (!cells.length) return;
      const yearCell = cells.find(cell => /^20\d{2}$/.test(cell));
      if (yearCell) currentYear = yearCell;

      const code = cells.find(isCodeLike);
      const dateRaw = cells.find(isDateLike);
      if (code && dateRaw) {
        current = {
          id: `hist-session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          date: normalizeCommitteeDate(dateRaw, currentYear),
          rawDate: dateRaw,
          code: code.replace(/\s+/g, " ").trim(),
          title: `${sessionLabel} histórico ${code.replace(/\s+/g, " ").trim()}`,
          notes: `Importado desde histórico Word${dateRaw ? ` · Fecha original: ${dateRaw}` : ""}`,
          status: "closed",
          historical: true,
          importedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          closedAt: new Date().toISOString(),
          items: []
        };
        sessions.push(current);
        addPointsToCurrent(cells);
        return;
      }

      addPointsToCurrent(cells);
    });
  });

  return sessions.filter(session => session.code && session.items && session.items.length);
}


function sanitizeFileNamePart(value, fallback) {
  const text = String(value || "").trim() || fallback || "documento";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || fallback || "documento";
}

function escapeDocxXmlText(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function docxReplacementXml(value) {
  return String(value == null ? "" : value)
    .split(/\r\n|\r|\n/)
    .map(escapeDocxXmlText)
    .join('</w:t><w:br/><w:t>');
}

function getCommitteeDraftOutputPath(payload) {
  const outputDir = path.join(app.getPath("documents"), "RRLL Dashboard", "Actas Comité");
  fs.mkdirSync(outputDir, { recursive: true });
  const datePart = sanitizeFileNamePart(payload && payload.fechaComite ? payload.fechaComite : ts(), "sin-fecha");
  const documentPart = sanitizeFileNamePart(payload && payload.numeroDocumento ? payload.numeroDocumento : "acta-comite", "acta-comite");
  let outputPath = path.join(outputDir, `Acta Comité - ${datePart} - ${documentPart}.docx`);
  if (!fs.existsSync(outputPath)) return outputPath;
  outputPath = path.join(outputDir, `Acta Comité - ${datePart} - ${documentPart} - ${ts()}.docx`);
  return outputPath;
}

function replaceCommitteeDraftMarkersInDocx(templatePath, outputPath, payload) {
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(fs.readFileSync(templatePath));
  const replacements = {
    "{{NUMERO_DOCUMENTO}}": docxReplacementXml(payload.numeroDocumento),
    "{{FECHA_COMITE}}": docxReplacementXml(payload.fechaComite),
    "{{ORDEN_DIA}}": docxReplacementXml(payload.ordenDia),
    "{{PUNTOS_TRATADOS}}": docxReplacementXml(payload.puntosTratados)
  };
  const foundMarkers = new Set();

  zip.getEntries().forEach(entry => {
    if (entry.isDirectory || !/^word\/.*\.xml$/i.test(entry.entryName)) return;
    let xml = entry.getData().toString("utf8");
    let updated = xml;
    Object.entries(replacements).forEach(([marker, replacement]) => {
      if (!updated.includes(marker)) return;
      foundMarkers.add(marker);
      updated = updated.split(marker).join(replacement);
    });
    if (updated !== xml) zip.updateFile(entry.entryName, Buffer.from(updated, "utf8"));
  });

  const missingMarkers = Object.keys(replacements).filter(marker => !foundMarkers.has(marker));
  if (missingMarkers.length) {
    throw new Error(`La plantilla seleccionada no contiene todos los marcadores esperados. Faltan: ${missingMarkers.join(", ")}.`);
  }

  zip.writeZip(outputPath);
}

async function generateCommitteeMinutesDraft(_event, payload = {}) {
  const result = await dialog.showOpenDialog({
    title: "Seleccionar plantilla Word para el acta de Comité",
    properties: ["openFile"],
    filters: [{ name: "Plantillas Word", extensions: ["docx"] }]
  });

  if (result.canceled || !result.filePaths || !result.filePaths[0]) {
    return { canceled: true, message: "No se ha seleccionado ninguna plantilla Word (.docx). Selecciona una plantilla local para generar el borrador del acta." };
  }

  const templatePath = result.filePaths[0];
  if (path.extname(templatePath).toLowerCase() !== ".docx") {
    throw new Error("La plantilla seleccionada debe ser un archivo Word con extensión .docx.");
  }
  if (!fs.existsSync(templatePath)) {
    throw new Error("No se ha encontrado la plantilla seleccionada. Elige una plantilla Word local válida.");
  }

  const normalizedPayload = {
    numeroDocumento: String(payload.numeroDocumento || "Sin número de documento").trim(),
    fechaComite: String(payload.fechaComite || "Sin fecha").trim(),
    ordenDia: String(payload.ordenDia || "Sin puntos en el orden del día").trim(),
    puntosTratados: String(payload.puntosTratados || "Sin puntos tratados").trim()
  };

  const outputPath = getCommitteeDraftOutputPath(normalizedPayload);
  replaceCommitteeDraftMarkersInDocx(templatePath, outputPath, normalizedPayload);
  const openError = await shell.openPath(outputPath);
  if (openError) {
    return { outputPath, opened: false, message: `El borrador se generó correctamente, pero no se pudo abrir automáticamente: ${openError}` };
  }
  return { outputPath, opened: true };
}

async function importCommitteeHistoryDocx() {
  const result = await dialog.showOpenDialog({
    title: "Seleccionar Word de histórico de Comité de Empresa",
    properties: ["openFile"],
    filters: [{ name: "Documentos Word", extensions: ["docx"] }]
  });
  if (result.canceled || !result.filePaths || !result.filePaths[0]) return null;
  const filePath = result.filePaths[0];
  const sessions = parseCommitteeHistoryDocx(filePath, { sessionLabel: "Comité", sourceLabel: "Histórico importado" });
  const pointCount = sessions.reduce((sum, session) => sum + (session.items || []).length, 0);
  return { filePath, fileName: path.basename(filePath), sessions, sessionCount: sessions.length, pointCount };
}

async function importParitariaHistoryDocx() {
  const result = await dialog.showOpenDialog({
    title: "Seleccionar Word de histórico de Comisión Paritaria",
    properties: ["openFile"],
    filters: [{ name: "Documentos Word", extensions: ["docx"] }]
  });
  if (result.canceled || !result.filePaths || !result.filePaths[0]) return null;
  const filePath = result.filePaths[0];
  const sessions = parseCommitteeHistoryDocx(filePath, { sessionLabel: "Paritaria", sourceLabel: "Histórico paritaria importado" });
  const pointCount = sessions.reduce((sum, session) => sum + (session.items || []).length, 0);
  return { filePath, fileName: path.basename(filePath), sessions, sessionCount: sessions.length, pointCount };
}

function xlsxEscapeXml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index) {
  let name = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function decodeXlsxXml(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function parseSharedStrings(zip) {
  const entry = zip.getEntry("xl/sharedStrings.xml");
  if (!entry) return [];
  const xml = entry.getData().toString("utf8");
  return (xml.match(/<si[\s\S]*?<\/si>/g) || []).map(si => {
    const parts = [...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(match => decodeXlsxXml(match[1]));
    return parts.join("");
  });
}

function getFirstWorksheetPath(zip) {
  const workbook = zip.getEntry("xl/workbook.xml");
  if (!workbook) return "xl/worksheets/sheet1.xml";
  const workbookXml = workbook.getData().toString("utf8");
  const firstSheet = workbookXml.match(/<sheet\b[^>]*r:id="([^"]+)"/);
  if (!firstSheet) return "xl/worksheets/sheet1.xml";
  const rels = zip.getEntry("xl/_rels/workbook.xml.rels");
  if (!rels) return "xl/worksheets/sheet1.xml";
  const relsXml = rels.getData().toString("utf8");
  const rel = new RegExp(`<Relationship[^>]*Id="${firstSheet[1]}"[^>]*Target="([^"]+)"`).exec(relsXml);
  if (!rel) return "xl/worksheets/sheet1.xml";
  return `xl/${rel[1].replace(/^\//, "").replace(/^xl\//, "")}`;
}

function excelSerialToIso(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value || "");
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(epoch.getTime() + num * 86400000);
  return date.toISOString().slice(0, 10);
}

function parseWorksheetXml(xml, sharedStrings) {
  const rows = [];
  const rowMatches = xml.match(/<row[\s\S]*?<\/row>/g) || [];
  rowMatches.forEach(rowXml => {
    const row = [];
    const cellMatches = rowXml.match(/<c\b[\s\S]*?<\/c>/g) || [];
    cellMatches.forEach(cellXml => {
      const ref = (cellXml.match(/r="([A-Z]+)\d+"/) || [])[1];
      const col = ref ? ref.split("").reduce((sum, ch) => sum * 26 + ch.charCodeAt(0) - 64, 0) - 1 : row.length;
      const type = (cellXml.match(/t="([^"]+)"/) || [])[1];
      let value = "";
      if (type === "inlineStr") {
        value = [...cellXml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(match => decodeXlsxXml(match[1])).join("");
      } else {
        const raw = (cellXml.match(/<v>([\s\S]*?)<\/v>/) || [])[1] || "";
        value = type === "s" ? (sharedStrings[Number(raw)] || "") : decodeXlsxXml(raw);
      }
      row[col] = value;
    });
    rows.push(row.map(value => value == null ? "" : String(value)));
  });
  return rows;
}

function parseCsvText(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') { value += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else value += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ';' || ch === ',') { row.push(value); value = ""; }
    else if (ch === '\n') { row.push(value); rows.push(row); row = []; value = ""; }
    else if (ch !== '\r') value += ch;
  }
  row.push(value);
  if (row.some(cell => String(cell || "").trim())) rows.push(row);
  return rows;
}

function parseHtmlSpreadsheetText(text) {
  const rows = [];
  const rowMatches = String(text || "").match(/<tr[\s\S]*?<\/tr>|<Row[\s\S]*?<\/Row>/gi) || [];
  rowMatches.forEach(rowXml => {
    const cells = [];
    const cellMatches = rowXml.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>|<Cell[\s\S]*?<\/Cell>/gi) || [];
    cellMatches.forEach(cellXml => {
      const textParts = [...cellXml.matchAll(/<Data[^>]*>([\s\S]*?)<\/Data>|<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(match => decodeXlsxXml(stripXml(match[1] || match[2] || "")));
      cells.push((textParts.join("") || stripXml(cellXml)).replace(/\s+/g, " ").trim());
    });
    if (cells.some(Boolean)) rows.push(cells);
  });
  return rows;
}

function normalizeImportedSpreadsheetRows(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".csv") {
    return parseCsvText(fs.readFileSync(filePath, "utf8"));
  }
  if (ext !== ".xlsx" && ext !== ".xls") throw new Error("Formato no soportado. Usa xlsx, xls o csv.");
  const buffer = fs.readFileSync(filePath);
  try {
    const zip = new (require("adm-zip"))(buffer);
    const shared = parseSharedStrings(zip);
    const sheetPath = getFirstWorksheetPath(zip);
    const sheet = zip.getEntry(sheetPath) || zip.getEntry("xl/worksheets/sheet1.xml");
    if (!sheet) throw new Error("No se encontró la primera hoja del Excel.");
    return parseWorksheetXml(sheet.getData().toString("utf8"), shared);
  } catch (error) {
    const text = buffer.toString("utf8");
    const htmlRows = parseHtmlSpreadsheetText(text);
    if (htmlRows.length) return htmlRows;
    const csvRows = parseCsvText(text);
    if (csvRows.length) return csvRows;
    throw error;
  }
}

async function importTicketRestaurantSpreadsheet() {
  const result = await dialog.showOpenDialog({
    title: "Cargar fichero Ticket Restaurante",
    properties: ["openFile"],
    filters: [{ name: "Excel o CSV", extensions: ["xlsx", "xls", "csv"] }]
  });
  if (result.canceled || !result.filePaths || !result.filePaths[0]) return null;
  const filePath = result.filePaths[0];
  const rows = normalizeImportedSpreadsheetRows(filePath);
  return { filePath, fileName: path.basename(filePath), rows };
}

function buildSimpleXlsxBuffer(payload = {}) {
  const sheetName = xlsxEscapeXml(payload.sheetName || "Ticket Restaurante").slice(0, 31);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const colWidths = Array.isArray(payload.widths) ? payload.widths : [];
  const sheetRows = rows.map((row, rIndex) => {
    const cells = (Array.isArray(row) ? row : []).map((cell, cIndex) => {
      const ref = `${columnName(cIndex)}${rIndex + 1}`;
      const value = cell == null ? "" : String(cell);
      return `<c r="${ref}" t="inlineStr"><is><t>${xlsxEscapeXml(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rIndex + 1}">${cells}</row>`;
  }).join("");
  const cols = colWidths.length ? `<cols>${colWidths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${Number(w) || 14}" customWidth="1"/>`).join("")}</cols>` : "";
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${cols}<sheetData>${sheetRows}</sheetData></worksheet>`;
  const zip = new (require("adm-zip"))();
  zip.addFile("[Content_Types].xml", Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`, "utf8"));
  zip.addFile("_rels/.rels", Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`, "utf8"));
  zip.addFile("xl/workbook.xml", Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets></workbook>`, "utf8"));
  zip.addFile("xl/_rels/workbook.xml.rels", Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`, "utf8"));
  zip.addFile("xl/worksheets/sheet1.xml", Buffer.from(sheetXml, "utf8"));
  const now = new Date().toISOString();
  zip.addFile("docProps/core.xml", Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>RRLL Dashboard</dc:creator><cp:lastModifiedBy>RRLL Dashboard</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`, "utf8"));
  zip.addFile("docProps/app.xml", Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>RRLL Dashboard</Application></Properties>`, "utf8"));
  return zip.toBuffer();
}

async function exportTicketRestaurantWorkbook(_event, payload = {}) {
  const defaultName = sanitizeFileNamePart(payload.fileName || "Ticket_Restaurante.xlsx", "Ticket_Restaurante.xlsx");
  const result = await dialog.showSaveDialog({
    title: payload.title || "Guardar Excel",
    defaultPath: defaultName.endsWith(".xlsx") ? defaultName : `${defaultName}.xlsx`,
    filters: [{ name: "Excel", extensions: ["xlsx"] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  fs.writeFileSync(result.filePath, buildSimpleXlsxBuffer(payload));
  return { canceled: false, filePath: result.filePath };
}


async function selectAttachmentFiles() {
  const result = await dialog.showOpenDialog({
    title: "Seleccionar documentos adjuntos",
    properties: ["openFile", "multiSelections"]
  });
  if (result.canceled || !Array.isArray(result.filePaths)) return [];
  return result.filePaths;
}

async function openAttachmentPath(_event, filePath) {
  const safePath = typeof filePath === "string" ? filePath.trim() : "";
  if (!safePath) return { ok: false, message: "Ruta no válida." };
  if (!fs.existsSync(safePath)) return { ok: false, missing: true, message: "El archivo ya no existe o no es accesible." };
  const openError = await shell.openPath(safePath);
  if (openError) return { ok: false, message: "El archivo ya no existe o no es accesible.", detail: openError };
  return { ok: true };
}

async function openAttachmentFolderPath(_event, filePath) {
  const safePath = typeof filePath === "string" ? filePath.trim() : "";
  if (!safePath) return { ok: false, message: "Ruta no válida." };
  if (!fs.existsSync(safePath)) return { ok: false, missing: true, message: "El archivo ya no existe o no es accesible." };
  shell.showItemInFolder(safePath);
  return { ok: true };
}

function psLiteral(value) {
  return `'${String(value || "").replace(/'/g, "''")}'`;
}

async function createOutlookDraft(_event, payload = {}) {
  const to = String(payload.to || "").trim();
  const cc = String(payload.cc || "").trim();
  const subject = String(payload.subject || "").trim();
  const htmlBody = String(payload.htmlBody || "").trim();
  if (!to || !subject || !htmlBody) {
    return { ok: false, code: "invalid_payload", message: "Faltan datos obligatorios para crear el borrador de Outlook." };
  }
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "$outlookExe = 'C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE'",
    "if (!(Get-Process OUTLOOK -ErrorAction SilentlyContinue) -and (Test-Path $outlookExe)) { Start-Process -FilePath $outlookExe | Out-Null; Start-Sleep -Seconds 1 }",
    "$outlook = New-Object -ComObject Outlook.Application",
    "$mail = $outlook.CreateItem(0)",
    `$mail.To = ${psLiteral(to)}`,
    `$mail.CC = ${psLiteral(cc)}`,
    `$mail.Subject = ${psLiteral(subject)}`,
    `$mail.HTMLBody = ${psLiteral(htmlBody)}`,
    "$mail.Display()"
  ].join("\n");

  return new Promise(resolve => {
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded], { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", chunk => { stderr += String(chunk || ""); });
    child.on("error", error => {
      resolve({ ok: false, code: "spawn_error", message: error && error.message ? error.message : "No se pudo ejecutar PowerShell." });
    });
    child.on("close", code => {
      if (code === 0) return resolve({ ok: true });
      const details = stderr.trim();
      let message = details || `PowerShell finalizó con código ${code}.`;
      if (/Outlook\.Application|Class not registered|COM/i.test(details)) message = "Outlook clásico no está disponible o no se puede usar COM en este equipo.";
      if (/not recognized|cannot find/i.test(details)) message = "PowerShell no está disponible en el sistema o está bloqueado por políticas.";
      resolve({ ok: false, code: "powershell_error", message });
    });
  });
}
ipcMain.handle("db:loadAll", async () => loadAllData());
ipcMain.handle("db:saveAll", async (_event, data) => saveAllData(data));
ipcMain.handle("db:saveKey", async (_event, key, value) => saveKeyData(key, value));
ipcMain.handle("db:backupAll", async (_event, data) => backupAllData(data));
ipcMain.handle("db:createBackup", async (_event, payload) => createRobustBackup(payload && payload.reason ? payload.reason : "manual", payload && payload.data ? payload.data : {}));
ipcMain.handle("db:getBackupStatus", async () => lastBackupMeta || { ok: false, createdAt: null, reason: null, dbPath: getActiveDbInfo().path });
ipcMain.handle("db:openBackupsFolder", async () => {
  const folder = ensureBackupsDir();
  const error = await shell.openPath(folder);
  return { ok: !error, path: folder, error: error || null };
});
ipcMain.handle("db:getInfo", async () => getDbInfo());
ipcMain.handle("db:getState", async () => getDbState());
ipcMain.handle("db:getStartupAlert", async () => startupDbAlert);
ipcMain.handle("db:chooseSharedDirectory", chooseSharedDirectory);
ipcMain.handle("db:probeSharedDirectory", async (_event, directory) => inspectSharedDatabase(directory));
ipcMain.handle("db:setSharedDirectory", setSharedDirectory);
ipcMain.handle("db:useLocalDatabase", useLocalDatabase);
ipcMain.handle("db:importCommitteeHistoryDocx", importCommitteeHistoryDocx);
ipcMain.handle("db:importParitariaHistoryDocx", importParitariaHistoryDocx);
ipcMain.handle("db:generateCommitteeMinutesDraft", generateCommitteeMinutesDraft);
ipcMain.handle("rrllFolder:getPath", getRRLLFolderPath);
ipcMain.handle("rrllFolder:setPath", setRRLLFolderPath);
ipcMain.handle("rrllFolder:open", openRRLLFolder);
ipcMain.handle("ticketRestaurant:importSpreadsheet", importTicketRestaurantSpreadsheet);
ipcMain.handle("ticketRestaurant:exportWorkbook", exportTicketRestaurantWorkbook);
ipcMain.handle("attachments:selectFiles", selectAttachmentFiles);
ipcMain.handle("attachments:openPath", openAttachmentPath);
ipcMain.handle("attachments:openFolder", openAttachmentFolderPath);
ipcMain.handle("outlook:createDraft", createOutlookDraft);

function createWindow() {
  Menu.setApplicationMenu(null);

  const win = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1100,
    minHeight: 750,
    title: "Cuadro de Mando de RRLL",
    icon: path.join(__dirname, "app", "assets", "icon.png"),
    backgroundColor: "#f5f5f5",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: true
    }
  });

  win.loadFile(path.join(__dirname, "app", "dashboard.html"));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("file://") && url.includes("dashboard.html")) return;
    if (url.includes("#")) return;
    event.preventDefault();
    shell.openExternal(url);
  });

  win.webContents.session.setSpellCheckerLanguages(["es-ES"]);

  win.webContents.on("context-menu", (event, params) => {
    const menuItems = [];

    if (params.isEditable) {
      if (params.misspelledWord && params.dictionarySuggestions && params.dictionarySuggestions.length) {
        params.dictionarySuggestions.slice(0, 5).forEach(suggestion => {
          menuItems.push({
            label: suggestion,
            click: () => win.webContents.replaceMisspelling(suggestion)
          });
        });
        menuItems.push({ type: "separator" });
      }

      menuItems.push(
        { role: "undo", label: "Deshacer" },
        { role: "redo", label: "Rehacer" },
        { type: "separator" },
        { role: "cut", label: "Cortar" },
        { role: "copy", label: "Copiar" },
        { role: "paste", label: "Pegar" },
        { type: "separator" },
        { role: "selectAll", label: "Seleccionar todo" }
      );
    } else {
      menuItems.push(
        { role: "copy", label: "Copiar", enabled: !!params.selectionText },
        { type: "separator" },
        { role: "selectAll", label: "Seleccionar todo" }
      );
    }

    Menu.buildFromTemplate(menuItems).popup({ window: win });
  });

}

app.whenReady().then(async () => {
  await getSQL();
  const startupData = await loadAllData();
  await createRobustBackup("app_start", startupData);
  createWindow();
});

app.on("before-quit", async () => {
  try {
    await createRobustBackup("app_close", await loadAllData());
  } catch (error) {
    console.error("No se pudo crear backup al cerrar:", error);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
