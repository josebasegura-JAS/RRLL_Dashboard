const { app, BrowserWindow, shell, ipcMain, Menu, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const {
  getNextBackupPath,
  pruneManagedSqliteBackups
} = require("./main/backup-helpers");
const {
  calculateFileChecksum,
  cleanupOldMirrorTempFiles,
  readMirrorMeta,
  writeMirrorMeta
} = require("./main/mirror-helpers");
const { createSqlitePersistenceHelpers } = require("./main/sqlite-persistence-helpers");
const { createTicketCalendarRepository } = require("./app/modules/ticket-calendar-repository");
const { createTicketCalendarAdapter } = require("./app/modules/ticket-calendar-adapter");
const { createBudgetRepository } = require("./app/modules/budget-repository");
const TicketCalendarDomain = require("./app/modules/ticket-calendar-domain");
const { writeJsonAtomically } = require("./main/config-persistence-helpers");
const {
  buildOutlookDraftPowerShellScript,
  runOutlookDraftVbs,
  runOutlookScript
} = require("./main/outlook-helpers");
const { parseOutlookMsgBuffer } = require("./main/msg-parser-helpers");

let lastBackupAt = 0;
let dirtySinceLastBackup = false;
let backupScheduler = null;
let mirrorScheduler = null;
let mirrorDebounceTimer = null;
let mirrorDirty = false;
let mirrorUpdateInProgress = false;
let sqlReadyPromise = null;
let SQLRef = null;
let rrllMainPerfDebugEnabled = process.env.RRLL_TICKET_RESTAURANT_PERF_DEBUG === "1";
const {
  cleanupDbTempFiles,
  ensureParentDir,
  fsyncDirectoryIfPossible,
  fsyncFileIfPossible,
  getDbLastUpdateToken,
  getDbTempPrefix,
  hasDbWriteArtifacts,
  listDbTempFiles,
  persistDb: persistDbRaw,
  validatePersistedDb
} = createSqlitePersistenceHelpers({ getSQLRef: () => SQLRef });

function rrllMainPerfStart(label, enabled = rrllMainPerfDebugEnabled) {
  if (!enabled) return null;
  const startedAt = Date.now();
  return () => console.log(`[RRLL perf] main ${label}: ${Date.now() - startedAt} ms`);
}

function persistDb(db, dbPath, options = {}) {
  const finish = rrllMainPerfStart("persistDb", options.perfDebug);
  try { return persistDbRaw(db, dbPath); } finally { if (finish) finish(); }
}

let lastBackupMeta = null;
let lastSaveStatus = { status: "saved", updatedAt: null, error: "" };
let lastMirrorMeta = null;
let startupDbAlert = null;
let isQuitting = false;
let safeQuitInProgress = false;

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

function getMirrorSqlitePath() {
  return path.join(app.getPath("userData"), "rrll-dashboard-mirror.sqlite");
}

function getMirrorMetaPath() {
  return path.join(app.getPath("userData"), "rrll-dashboard-mirror.meta.json");
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

function markDatabaseDirty() {
  dirtySinceLastBackup = true;
}

function clearDatabaseDirty() {
  dirtySinceLastBackup = false;
}

function setLastSaveStatus(status, error = "") {
  lastSaveStatus = {
    status: status || "saved",
    updatedAt: new Date().toISOString(),
    error: error ? String(error) : ""
  };
}

async function getLastSaveStatus() {
  if (!lastSaveStatus.updatedAt) {
    try {
      const state = await getDbState();
      if (state && state.lastUpdate) return { ...lastSaveStatus, updatedAt: state.lastUpdate };
    } catch {}
  }
  return { ...lastSaveStatus };
}

function recordBackupFailure(reason, detail, skipped = "") {
  const message = detail || skipped || "No se pudo crear el backup.";
  console.warn(`[RRLL][DB] Backup no creado (${reason}):`, message);
  lastBackupMeta = {
    ok: false,
    createdAt: new Date().toISOString(),
    reason,
    dbPath: resolveDbAccessInfo().path,
    dirtySinceLastBackup,
    lastBackupAt: lastBackupAt ? new Date(lastBackupAt).toISOString() : null,
    error: message,
    skipped
  };
  return { ok: false, error: message, ...(skipped ? { skipped } : {}) };
}

function getBackupStatus() {
  return {
    ...(lastBackupMeta || {
      ok: false,
      createdAt: null,
      reason: null,
      dbPath: getActiveDbInfo().path,
      lastBackupAt: lastBackupAt ? new Date(lastBackupAt).toISOString() : null
    }),
    dirtySinceLastBackup,
    lastBackupAt: lastBackupAt ? new Date(lastBackupAt).toISOString() : null
  };
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
  writeJsonAtomically(getDbConfigPath(), config);
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
      message: "No se ha podido acceder a la base de datos compartida. La aplicación se ha abierto con una copia local temporal. Los cambios podrían no sincronizarse automáticamente. Contacta con Sistemas o espera la recuperación antes de realizar cambios críticos. Cuando recuperes conexión, puedes reintentar desde Configuración.",
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

async function openDatabase(dbPath, { initializeTicketCalendars = true, perfDebug = false } = {}) {
  const finish = rrllMainPerfStart("openDatabase", perfDebug || rrllMainPerfDebugEnabled);
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

  if (initializeTicketCalendars) initializeTicketCalendarPersistence(db, dbPath);
  initializeBudgetPersistence(db, dbPath);

  const versionRow = db.exec("SELECT value FROM meta WHERE key = 'schema_version'");
  if (!versionRow.length) {
    db.run("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', '2')");
  }

  if (finish) finish();
  return { db, existed: exists };
}

function initializeTicketCalendarPersistence(db, dbPath) {
  let changed = false;
  try {
    const repository = createTicketCalendarRepository({ db });
    const existingSchemaTables = db.exec(`
      SELECT name FROM sqlite_master
      WHERE type = 'table'
        AND name IN ('ticket_calendars', 'ticket_calendar_aliases', 'ticket_calendar_weekdays', 'ticket_calendar_exclusions', 'ticket_calendar_rules')
    `);
    const schemaExists = existingSchemaTables.length > 0 && existingSchemaTables[0].values.length === 5;
    const calendarColumns = schemaExists ? db.exec("PRAGMA table_info(ticket_calendars)") : [];
    const observationsExists = calendarColumns.length > 0 && calendarColumns[0].values.some(column => column[1] === "observations");
    const schemaInfo = repository.ensureTicketCalendarSchema();
    if (!schemaInfo.currentCompatible) {
      console.warn("Persistencia de calendarios Ticket en esquema incompatible; se conserva intacta y se usará fallback.");
      return;
    }
    changed = !schemaExists || !observationsExists;
    if (repository.seedBaseTicketCalendars() > 0) changed = true;
    if (repository.migrateLegacyTicketCalendarExclusions() > 0) changed = true;
  } catch (error) {
    console.warn("No se pudo inicializar la persistencia de calendarios Ticket Restaurante:", error && error.message ? error.message : error);
  }
  if (!changed) return;
  try {
    persistDb(db, dbPath);
  } catch (error) {
    console.warn("No se pudo persistir la inicialización de calendarios Ticket Restaurante:", error && error.message ? error.message : error);
  }
}

function initializeBudgetPersistence(db, dbPath) {
  try {
    const existing = db.exec(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('budget_scenarios', 'budget_manual_items', 'budget_ticket_groups')`);
    const existingCount = existing.length ? existing[0].values.length : 0;
    createBudgetRepository({ db }).ensureBudgetSchema();
    if (existingCount < 3) persistDb(db, dbPath);
  } catch (error) {
    console.warn("No se pudo inicializar la persistencia de Presupuestos:", error && error.message ? error.message : error);
  }
}

function migrateLegacyTicketCalendarExclusionsSafely(db) {
  try {
    return createTicketCalendarRepository({ db }).migrateLegacyTicketCalendarExclusions();
  } catch (error) {
    console.warn("No se pudieron copiar exclusiones históricas de Ticket Restaurante:", error && error.message ? error.message : error);
    return 0;
  }
}

function setMirrorStatusFromMeta(meta, overrides = {}) {
  lastMirrorMeta = {
    ok: !!(meta && meta.updatedAt),
    updatedAt: meta && meta.updatedAt ? meta.updatedAt : null,
    lastMirrorAt: meta && meta.updatedAt ? meta.updatedAt : null,
    mirrorPath: getMirrorSqlitePath(),
    metaPath: getMirrorMetaPath(),
    sourcePath: meta && meta.sourcePath ? meta.sourcePath : "",
    sourceMode: meta && meta.sourceMode ? meta.sourceMode : "",
    sizeBytes: meta && Number.isFinite(Number(meta.sizeBytes)) ? Number(meta.sizeBytes) : 0,
    lastUpdateToken: meta && meta.lastUpdateToken ? meta.lastUpdateToken : null,
    checksum: meta && meta.checksum ? meta.checksum : "",
    exists: fs.existsSync(getMirrorSqlitePath()),
    mirrorOk: !!(meta && meta.updatedAt),
    mirrorError: "",
    ...overrides
  };
  return lastMirrorMeta;
}

function getMirrorStatus() {
  if (!lastMirrorMeta) setMirrorStatusFromMeta(readMirrorMeta(getMirrorMetaPath()));
  const meta = lastMirrorMeta || {};
  const mirrorPath = getMirrorSqlitePath();
  const exists = fs.existsSync(mirrorPath);
  let sizeBytes = Number(meta.sizeBytes || 0);
  if (exists) {
    try { sizeBytes = fs.statSync(mirrorPath).size; } catch {}
  }
  return {
    ...meta,
    exists,
    mirrorPath,
    metaPath: getMirrorMetaPath(),
    sourcePath: meta.sourcePath || "",
    sizeBytes,
    mirrorOk: !!meta.mirrorOk && exists && !meta.mirrorError,
    mirrorError: meta.mirrorError || ""
  };
}

async function validateSqliteDatabaseFile(dbPath, label = "base de datos") {
  if (!dbPath || typeof dbPath !== "string") throw new Error(`Ruta de ${label} no válida.`);
  if (!fs.existsSync(dbPath)) throw new Error(`No existe el fichero de ${label}.`);
  await getSQL();
  validatePersistedDb(dbPath);
  const db = new SQLRef.Database(fs.readFileSync(dbPath));
  try {
    const kvExists = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='kv_store'").length > 0;
    if (!kvExists) throw new Error(`El fichero de ${label} no contiene la tabla kv_store.`);
    db.exec("SELECT COUNT(*) FROM kv_store");
  } finally {
    try { db.close(); } catch {}
  }
  return true;
}

async function createLocalSqliteFileBackup(reason = "before_use_mirror_as_local") {
  const localPath = getLocalSqlitePath();
  if (!fs.existsSync(localPath)) return { ok: true, skipped: "missing_local_db", path: "" };
  await validateSqliteDatabaseFile(localPath, "BBDD local actual");
  const localDir = ensureBackupsDir();
  const backupPath = getNextBackupPath(localDir);
  fs.copyFileSync(localPath, backupPath, fs.constants.COPYFILE_EXCL);
  await validateSqliteDatabaseFile(backupPath, "backup previo de BBDD local");
  pruneManagedSqliteBackups(localDir, 30);
  lastBackupAt = Date.now();
  lastBackupMeta = {
    ok: true,
    suspicious: false,
    createdAt: new Date(lastBackupAt).toISOString(),
    reason,
    localDir,
    networkDir: "",
    baseName: path.basename(backupPath, ".db"),
    localFile: backupPath,
    networkFile: "",
    dbPath: localPath
  };
  return { ok: true, path: backupPath };
}

async function copyMirrorOverLocalAtomically() {
  const mirrorPath = getMirrorSqlitePath();
  const localPath = getLocalSqlitePath();
  await validateSqliteDatabaseFile(mirrorPath, "espejo local");

  return withFileLock(localPath, async () => {
    await validateSqliteDatabaseFile(mirrorPath, "espejo local");
    const backup = await createLocalSqliteFileBackup("before_use_mirror_as_local");
    const localDir = path.dirname(localPath);
    ensureParentDir(localPath);
    const tempPath = path.join(localDir, `${getDbTempPrefix(localPath)}mirror-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
    let fd = null;
    try {
      fs.copyFileSync(mirrorPath, tempPath, fs.constants.COPYFILE_EXCL);
      fd = fs.openSync(tempPath, "r");
      fsyncFileIfPossible(fd, "de la BBDD local temporal desde espejo");
      fs.closeSync(fd);
      fd = null;
      await validateSqliteDatabaseFile(tempPath, "copia temporal del espejo");
      fs.renameSync(tempPath, localPath);
      fsyncDirectoryIfPossible(localDir);
      await validateSqliteDatabaseFile(localPath, "BBDD local restaurada desde espejo");
    } catch (error) {
      if (fd !== null) {
        try { fs.closeSync(fd); } catch {}
      }
      try { fs.unlinkSync(tempPath); } catch {}
      throw error;
    } finally {
      cleanupDbTempFiles(localPath);
    }

    writeDbConfig({ mode: "local" });
    clearDatabaseDirty();
    setLastSaveStatus("saved");
    return { ok: true, localPath, mirrorPath, backupPath: backup.path || "", backupSkipped: backup.skipped || "" };
  });
}

async function useMirrorAsLocalDatabase() {
  const status = getMirrorStatus();
  if (!status.exists) throw new Error("No existe espejo local para usar como BBDD local.");
  if (status.mirrorError) throw new Error(`El último estado del espejo es error: ${status.mirrorError}`);
  await validateSqliteDatabaseFile(status.mirrorPath, "espejo local");
  return copyMirrorOverLocalAtomically();
}

async function updateLocalMirror(reason = "manual") {
  const info = resolveDbAccessInfo();
  if (!(info.mode === "shared" && info.effectiveMode === "shared" && !info.fallbackLocal)) {
    const meta = readMirrorMeta(getMirrorMetaPath());
    setMirrorStatusFromMeta(meta, {
      ok: !!(meta && meta.updatedAt),
      mirrorOk: !!(meta && meta.updatedAt),
      sourceMode: info.effectiveMode || info.mode || "local",
      skipped: "not_shared_active"
    });
    return { ok: false, skipped: "not_shared_active", ...getMirrorStatus() };
  }

  if (mirrorUpdateInProgress) return { ok: false, skipped: "in_progress", ...getMirrorStatus() };
  mirrorUpdateInProgress = true;

  try {
    if (!fs.existsSync(info.path)) throw new Error("La base compartida no existe o no está accesible.");
    if (hasDbWriteArtifacts(info.path)) {
      const error = new Error("Base compartida bloqueada o con escritura en curso; espejo omitido.");
      console.warn("[RRLL][DB] Espejo local no actualizado:", error.message);
      setMirrorStatusFromMeta(readMirrorMeta(getMirrorMetaPath()), { ok: false, mirrorOk: false, mirrorError: error.message, sourcePath: info.path, sourceMode: info.effectiveMode });
      return { ok: false, skipped: "db_write_in_progress", error: error.message, ...getMirrorStatus() };
    }

    validatePersistedDb(info.path);
    const mirrorPath = getMirrorSqlitePath();
    const mirrorDir = path.dirname(mirrorPath);
    ensureParentDir(mirrorPath);
    const tempPath = path.join(mirrorDir, `${path.basename(mirrorPath)}.${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
    let fd = null;
    try {
      fs.copyFileSync(info.path, tempPath, fs.constants.COPYFILE_EXCL);
      fd = fs.openSync(tempPath, "r");
      fsyncFileIfPossible(fd, "del espejo local temporal");
      fs.closeSync(fd);
      fd = null;
      validatePersistedDb(tempPath);
      fs.renameSync(tempPath, mirrorPath);
      fsyncDirectoryIfPossible(mirrorDir);
      validatePersistedDb(mirrorPath);
    } catch (error) {
      if (fd !== null) {
        try { fs.closeSync(fd); } catch {}
      }
      try { fs.unlinkSync(tempPath); } catch {}
      throw error;
    }

    const stat = fs.statSync(mirrorPath);
    const meta = {
      updatedAt: new Date().toISOString(),
      sourcePath: info.path,
      sourceMode: info.effectiveMode,
      sizeBytes: stat.size,
      lastUpdateToken: getDbLastUpdateToken(mirrorPath),
      checksum: calculateFileChecksum(mirrorPath),
      reason
    };
    writeMirrorMeta(getMirrorMetaPath(), meta);
    mirrorDirty = false;
    setMirrorStatusFromMeta(meta, { ok: true, mirrorOk: true, mirrorError: "" });
    console.info("[RRLL][DB] Espejo local actualizado", { mirrorPath, sourcePath: info.path, reason });
    return { ok: true, ...getMirrorStatus() };
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    console.error("[RRLL][DB] No se pudo actualizar el espejo local:", error);
    setMirrorStatusFromMeta(readMirrorMeta(getMirrorMetaPath()), { ok: false, mirrorOk: false, mirrorError: message, sourcePath: info.path, sourceMode: info.effectiveMode || info.mode });
    return { ok: false, error: message, ...getMirrorStatus() };
  } finally {
    mirrorUpdateInProgress = false;
  }
}

function scheduleMirrorUpdate(reason = "debounced_save", delayMs = 2500) {
  mirrorDirty = true;
  if (mirrorDebounceTimer) clearTimeout(mirrorDebounceTimer);
  mirrorDebounceTimer = setTimeout(() => {
    mirrorDebounceTimer = null;
    updateLocalMirror(reason).catch(error => console.error("[RRLL][DB] Error en espejo local programado:", error));
  }, delayMs);
  if (typeof mirrorDebounceTimer.unref === "function") mirrorDebounceTimer.unref();
}

async function runScheduledMirrorUpdate() {
  const info = resolveDbAccessInfo();
  if (!(info.mode === "shared" && info.effectiveMode === "shared" && !info.fallbackLocal)) return { ok: false, skipped: "not_shared_active" };
  let tokenChanged = false;
  try {
    if (fs.existsSync(info.path) && !hasDbWriteArtifacts(info.path)) {
      const currentToken = getDbLastUpdateToken(info.path);
      const previousToken = (lastMirrorMeta && lastMirrorMeta.lastUpdateToken) || (readMirrorMeta(getMirrorMetaPath()) || {}).lastUpdateToken || null;
      tokenChanged = !!currentToken && currentToken !== previousToken;
    }
  } catch (error) {
    console.warn("No se pudo comparar token para espejo local:", error && error.message ? error.message : error);
  }
  if (!mirrorDirty && !tokenChanged) return { ok: false, skipped: "clean" };
  return updateLocalMirror(tokenChanged ? "scheduled_token_changed" : "scheduled_dirty");
}

function startMirrorScheduler() {
  if (mirrorScheduler) return;
  mirrorScheduler = setInterval(() => {
    runScheduledMirrorUpdate().catch(error => console.error("[RRLL][DB] Error en espejo local temporizado:", error));
  }, 10 * 60 * 1000);
  if (typeof mirrorScheduler.unref === "function") mirrorScheduler.unref();
}

function stopMirrorScheduler() {
  if (mirrorDebounceTimer) {
    clearTimeout(mirrorDebounceTimer);
    mirrorDebounceTimer = null;
  }
  if (!mirrorScheduler) return;
  clearInterval(mirrorScheduler);
  mirrorScheduler = null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withFileLock(dbPath, operation, { perfDebug = false } = {}) {
  const finish = rrllMainPerfStart("withFileLock", perfDebug || rrllMainPerfDebugEnabled);
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
      if (finish) finish();
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

async function loadAllData({ perfDebug = false } = {}) {
  if (perfDebug) rrllMainPerfDebugEnabled = true;
  const info = resolveDbAccessInfo();
  return withFileLock(info.path, async () => {
    const { db, existed } = await openDatabase(info.path, { perfDebug });
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
  }, { perfDebug });
}

function createTicketCalendarFallbackModel(error) {
  if (error) console.warn("No se pudieron cargar calendarios Ticket Restaurante; se usa el fallback base.", error && error.message ? error.message : error);
  return createTicketCalendarAdapter({
    repository: { getTicketCalendars() { return []; } },
    domain: TicketCalendarDomain
  }).readTicketCalendarModel();
}

async function loadTicketCalendarModel({ perfDebug = false } = {}) {
  if (perfDebug) rrllMainPerfDebugEnabled = true;
  const finish = rrllMainPerfStart("loadTicketCalendarModel", perfDebug || rrllMainPerfDebugEnabled);
  try {
    const info = resolveDbAccessInfo();
    return await withFileLock(info.path, async () => {
      const { db } = await openDatabase(info.path, { initializeTicketCalendars: false, perfDebug });
      try {
        return createTicketCalendarAdapter({
          repository: createTicketCalendarRepository({ db }),
          domain: TicketCalendarDomain
        }).readTicketCalendarModel();
      } finally {
        try { db.close(); } catch {}
      }
    }, { perfDebug });
  } catch (error) {
    return createTicketCalendarFallbackModel(error);
  } finally { if (finish) finish(); }
}

async function saveTicketCalendar(payload = {}) {
  setLastSaveStatus("saving");
  const info = resolveDbAccessInfo();
  try {
    return await withFileLock(info.path, async () => {
      const { db } = await openDatabase(info.path);
      try {
        const repository = createTicketCalendarRepository({ db });
        const id = payload && payload.id
          ? repository.updateTicketCalendar(payload.id, payload)
          : repository.createTicketCalendar(payload);
        touchDatabaseState(db);
        persistDb(db, info.path);
        markDatabaseDirty();
        if (info.mode === "shared" && info.effectiveMode === "shared" && !info.fallbackLocal) scheduleMirrorUpdate("save_ticket_calendar");
        setLastSaveStatus("saved");
        return { ok: true, id };
      } finally {
        try { db.close(); } catch {}
      }
    });
  } catch (error) {
    setLastSaveStatus("error", error && error.message ? error.message : String(error));
    return { ok: false, code: error && error.code ? error.code : "ticket_calendar_save_error", message: error && error.message ? error.message : "No se ha podido guardar el calendario." };
  }
}

async function changeTicketCalendarLifecycle(action, calendarId) {
  setLastSaveStatus("saving");
  const info = resolveDbAccessInfo();
  try {
    return await withFileLock(info.path, async () => {
      const { db } = await openDatabase(info.path);
      try {
        const repository = createTicketCalendarRepository({ db });
        const operations = {
          disable: () => repository.disableTicketCalendar(calendarId),
          enable: () => repository.enableTicketCalendar(calendarId),
          delete: () => repository.deleteTicketCalendarIfUnused(calendarId)
        };
        if (!operations[action]) throw new Error("Operación de calendario Ticket no permitida.");
        const id = operations[action]();
        touchDatabaseState(db);
        persistDb(db, info.path);
        markDatabaseDirty();
        if (info.mode === "shared" && info.effectiveMode === "shared" && !info.fallbackLocal) scheduleMirrorUpdate(`${action}_ticket_calendar`);
        setLastSaveStatus("saved");
        return { ok: true, id };
      } finally {
        try { db.close(); } catch {}
      }
    });
  } catch (error) {
    setLastSaveStatus("error", error && error.message ? error.message : String(error));
    return { ok: false, code: error && error.code ? error.code : "ticket_calendar_lifecycle_error", message: error && error.message ? error.message : "No se ha podido actualizar el calendario." };
  }
}

async function runBudgetRead(operation) {
  const info = resolveDbAccessInfo();
  return await withFileLock(info.path, async () => {
    const { db } = await openDatabase(info.path);
    try { return operation(createBudgetRepository({ db })); }
    finally { try { db.close(); } catch {} }
  });
}

async function runBudgetWrite(operation, reason) {
  setLastSaveStatus("saving");
  const info = resolveDbAccessInfo();
  try {
    return await withFileLock(info.path, async () => {
      const { db } = await openDatabase(info.path);
      try {
        const id = operation(createBudgetRepository({ db }));
        touchDatabaseState(db);
        persistDb(db, info.path);
        markDatabaseDirty();
        if (info.mode === "shared" && info.effectiveMode === "shared" && !info.fallbackLocal) scheduleMirrorUpdate(reason);
        setLastSaveStatus("saved");
        return { ok: true, id };
      } finally { try { db.close(); } catch {} }
    });
  } catch (error) {
    setLastSaveStatus("error", error && error.message ? error.message : String(error));
    return { ok: false, code: "budget_write_error", message: error && error.message ? error.message : "No se ha podido guardar el presupuesto." };
  }
}

async function saveKeyData(key, value) {
  if (typeof key !== "string" || !key.startsWith("rrll_")) return false;
  setLastSaveStatus("saving");
  const info = resolveDbAccessInfo();
  try {
    return await withFileLock(info.path, async () => {
    const { db } = await openDatabase(info.path);
    try {
      const now = new Date().toISOString();
      const user = getWindowsUser();
      const tracedValue = applyBasicUserTrace(value, user);
      db.run("INSERT OR REPLACE INTO kv_store (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)", [key, serializeValue(tracedValue), now, user]);
      if (key === "rrll_criteria") syncCriteriaTable(db, tracedValue);
      if (key === "rrll_ticket_restaurant_calendar_marks") migrateLegacyTicketCalendarExclusionsSafely(db);
      addAudit(db, "save_key", key, null);
      touchDatabaseState(db);
      persistDb(db, info.path);
      markDatabaseDirty();
      if (info.mode === "shared" && info.effectiveMode === "shared" && !info.fallbackLocal) scheduleMirrorUpdate("save_key");
      setLastSaveStatus("saved");
      return true;
    } finally {
      try { db.close(); } catch {}
    }
  });
  } catch (error) {
    setLastSaveStatus("error", error && error.message ? error.message : String(error));
    throw error;
  }
}

async function saveAllData(data) {
  const safe = isPlainObject(data) ? data : {};
  setLastSaveStatus("saving");
  const info = resolveDbAccessInfo();
  try {
    return await withFileLock(info.path, async () => {
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
        migrateLegacyTicketCalendarExclusionsSafely(db);
        addAudit(db, "save_all", null, "Guardado completo / importación");
        touchDatabaseState(db);
        db.run("COMMIT");
      } catch (error) {
        try { db.run("ROLLBACK"); } catch {}
        throw error;
      }
      persistDb(db, info.path);
      markDatabaseDirty();
      if (info.mode === "shared" && info.effectiveMode === "shared" && !info.fallbackLocal) scheduleMirrorUpdate("save_all");
      setLastSaveStatus("saved");
      return true;
    } finally {
      try { db.close(); } catch {}
    }
  });
  } catch (error) {
    setLastSaveStatus("error", error && error.message ? error.message : String(error));
    throw error;
  }
}

async function backupAllData(data) {
  return createRobustBackup("manual", data, { throttleMs: 600 });
}

async function createRobustBackup(reason, data, options = {}) {
  const nowMs = Date.now();
  const throttleMs = Number(options.throttleMs || 0);
  if (throttleMs && nowMs - lastBackupAt < throttleMs) return { ok: false, skipped: "throttle" };

  const safe = isPlainObject(data) ? data : {};
  const info = resolveDbAccessInfo();
  const keyCount = Object.keys(safe).filter(k => k.startsWith("rrll_")).length;
  if (!keyCount) return recordBackupFailure(reason, "No hay datos RRLL para incluir en el backup.", "empty");

  const criticalCount = Object.keys(safe).filter(k => k.startsWith("rrll_")).length;
  const suspicious = criticalCount < 3;

  try {
    return await withFileLock(info.path, async () => {
      cleanupDbTempFiles(info.path);
      if (listDbTempFiles(info.path).length) return recordBackupFailure(reason, "La BBDD tiene una escritura en curso; backup omitido.", "db_write_in_progress");
      if (!fs.existsSync(info.path)) return recordBackupFailure(reason, "La BBDD persistida no existe; backup omitido.", "missing_db");
      validatePersistedDb(info.path);

      const localDir = ensureBackupsDir();
      const networkDir = getNetworkBackupsDir();
      const localFile = getNextBackupPath(localDir);
      fs.copyFileSync(info.path, localFile);

      let networkFile = "";
      let networkError = "";
      let warning = "";
      if (networkDir) {
        try {
          if (!fs.existsSync(networkDir)) fs.mkdirSync(networkDir, { recursive: true });
          networkFile = getNextBackupPath(networkDir);
          fs.copyFileSync(info.path, networkFile);
        } catch (error) {
          networkFile = "";
          networkError = error && error.message ? error.message : String(error);
          warning = "Backup local creado; no se pudo copiar a red.";
          console.warn(`[RRLL][DB] Backup local creado, pero no se pudo copiar a red (${reason}):`, networkError);
        }
      }

      pruneManagedSqliteBackups(localDir, 30);
      if (networkDir && !networkError) {
        try {
          pruneManagedSqliteBackups(networkDir, 50);
        } catch (error) {
          networkError = error && error.message ? error.message : String(error);
          warning = "Backup local y réplica de red creados; no se pudo completar la limpieza de backups de red.";
          console.warn(`[RRLL][DB] Backup local creado, pero no se pudo completar la gestión de backups de red (${reason}):`, networkError);
        }
      }

      lastBackupAt = Date.now();
      clearDatabaseDirty();
      const baseName = path.basename(localFile, ".db");
      lastBackupMeta = {
        ok: !suspicious,
        partial: !!networkError,
        suspicious,
        createdAt: new Date(lastBackupAt).toISOString(),
        reason,
        localDir,
        networkDir,
        baseName,
        dbPath: info.path,
        dirtySinceLastBackup,
        lastBackupAt: new Date(lastBackupAt).toISOString(),
        localFile,
        networkFile,
        warning,
        networkError
      };
      return { ok: true, partial: !!networkError, suspicious, keyCount, fileBase: baseName, localFile, networkFile, warning, networkError };
    });
  } catch (error) {
    console.error(`No se pudo crear backup (${reason}):`, error);
    lastBackupMeta = {
      ok: false,
      createdAt: new Date().toISOString(),
      reason,
      dbPath: info.path,
      dirtySinceLastBackup,
      lastBackupAt: lastBackupAt ? new Date(lastBackupAt).toISOString() : null,
      error: error && error.message ? error.message : String(error)
    };
    return { ok: false, error: error && error.message ? error.message : String(error) };
  }
}

async function runScheduledBackup() {
  if (!dirtySinceLastBackup) return { ok: false, skipped: "clean" };
  try {
    return await createRobustBackup("scheduled_dirty", await loadAllData(), { throttleMs: 0 });
  } catch (error) {
    console.error("No se pudo crear backup automático temporizado:", error);
    return { ok: false, error: error && error.message ? error.message : String(error) };
  }
}

function startBackupScheduler() {
  if (backupScheduler) return;
  backupScheduler = setInterval(runScheduledBackup, 15 * 60 * 1000);
  if (typeof backupScheduler.unref === "function") backupScheduler.unref();
}

function stopBackupScheduler() {
  if (!backupScheduler) return;
  clearInterval(backupScheduler);
  backupScheduler = null;
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

  updateLocalMirror("set_shared_directory").catch(error => console.error("[RRLL][DB] No se pudo actualizar espejo tras conectar a red:", error));
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

async function createOutlookDraft(_event, payload = {}) {
  console.log("[OutlookDraft] Entrada handler IPC");
  console.log("[OutlookDraft] Payload recibido", {
    to: String(payload.to || "").trim(),
    cc: String(payload.cc || "").trim(),
    subject: String(payload.subject || "").trim(),
    htmlBodyLength: String(payload.htmlBody || "").trim().length
  });

  const to = String(payload.to || "").trim();
  const cc = String(payload.cc || "").trim();
  const subject = String(payload.subject || "").trim();
  const htmlBody = String(payload.htmlBody || "").trim();
  if (!to || !subject || !htmlBody) {
    return { ok: false, code: "invalid_payload", message: "Faltan datos obligatorios para crear el borrador de Outlook." };
  }

  const scriptReal = buildOutlookDraftPowerShellScript({ to, cc, subject, htmlBody });

  const realResult = await runOutlookScript("payload real", scriptReal);
  if (realResult.ok && String(realResult.stdout || "").includes("OK_DRAFT_DISPLAYED")) return { ok: true };

  console.warn("[OutlookDraft] PowerShell falló, intentando fallback VBS");
  try {
    const vbsResult = await runOutlookDraftVbs({ to, cc, subject, htmlBody });
    if (vbsResult.code === 0) return { ok: true };
    return { ok: false, message: `Falló PowerShell y fallback VBS: ${String(vbsResult.stderr || "").trim() || `cscript código ${vbsResult.code}`}` };
  } catch (error) {
    return { ok: false, message: `Falló PowerShell y fallback VBS: ${error && error.message ? error.message : "error desconocido"}` };
  }
}

async function parseOutlookMsgInMain(_event, payload) {
  try {
    let buffer = null;
    if (payload instanceof Uint8Array) buffer = Buffer.from(payload);
    else if (payload instanceof ArrayBuffer) buffer = Buffer.from(new Uint8Array(payload));
    else if (payload && payload.type === "Buffer" && Array.isArray(payload.data)) buffer = Buffer.from(payload.data);
    if (!buffer || !buffer.length) return { ok: false, message: "Contenido .msg no válido." };

    return parseOutlookMsgBuffer(buffer);
  } catch (error) {
    console.error("Error parseando .msg:", error);
    return { ok: false, message: "No se ha podido importar el mensaje .msg." };
  }
}
ipcMain.handle("db:loadAll", async (_event, options) => loadAllData(options));
ipcMain.handle("db:loadTicketCalendars", async (_event, options) => loadTicketCalendarModel(options));
ipcMain.handle("db:saveTicketCalendar", async (_event, payload) => saveTicketCalendar(payload));
ipcMain.handle("db:disableTicketCalendar", async (_event, calendarId) => changeTicketCalendarLifecycle("disable", calendarId));
ipcMain.handle("db:enableTicketCalendar", async (_event, calendarId) => changeTicketCalendarLifecycle("enable", calendarId));
ipcMain.handle("db:deleteTicketCalendar", async (_event, calendarId) => changeTicketCalendarLifecycle("delete", calendarId));
ipcMain.handle("db:loadBudgetScenarios", async () => runBudgetRead(repository => repository.getBudgetScenarios()));
ipcMain.handle("db:saveBudgetScenario", async (_event, payload) => runBudgetWrite(repository => repository.saveBudgetScenario(payload), "save_budget_scenario"));
ipcMain.handle("db:loadBudgetManualItems", async (_event, scenarioId) => runBudgetRead(repository => repository.getBudgetManualItems(scenarioId)));
ipcMain.handle("db:saveBudgetManualItem", async (_event, payload) => runBudgetWrite(repository => repository.saveBudgetManualItem(payload), "save_budget_manual_item"));
ipcMain.handle("db:deleteBudgetManualItem", async (_event, id) => runBudgetWrite(repository => repository.deleteBudgetManualItem(id), "delete_budget_manual_item"));
ipcMain.handle("db:loadBudgetTicketGroups", async (_event, scenarioId) => runBudgetRead(repository => repository.getBudgetTicketGroups(scenarioId)));
ipcMain.handle("db:saveBudgetTicketGroup", async (_event, payload) => runBudgetWrite(repository => repository.saveBudgetTicketGroup(payload), "save_budget_ticket_group"));
ipcMain.handle("db:deleteBudgetTicketGroup", async (_event, id) => runBudgetWrite(repository => repository.deleteBudgetTicketGroup(id), "delete_budget_ticket_group"));
ipcMain.handle("db:saveAll", async (_event, data) => saveAllData(data));
ipcMain.handle("db:saveKey", async (_event, key, value) => saveKeyData(key, value));
ipcMain.handle("db:backupAll", async (_event, data) => backupAllData(data));
ipcMain.handle("db:createBackup", async (_event, payload) => createRobustBackup(payload && payload.reason ? payload.reason : "manual", payload && payload.data ? payload.data : {}));
ipcMain.handle("db:getBackupStatus", async () => getBackupStatus());
ipcMain.handle("db:getMirrorStatus", async () => getMirrorStatus());
ipcMain.handle("db:updateLocalMirror", async () => updateLocalMirror("manual_ui"));
ipcMain.handle("db:useMirrorAsLocalDatabase", async () => useMirrorAsLocalDatabase());
ipcMain.handle("db:openMirrorFolder", async () => {
  const folder = path.dirname(getMirrorSqlitePath());
  ensureParentDir(getMirrorSqlitePath());
  const error = await shell.openPath(folder);
  return { ok: !error, path: folder, error: error || null };
});
ipcMain.handle("db:getLastSaveStatus", async () => getLastSaveStatus());
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
ipcMain.handle("msg:parseOutlookMsg", parseOutlookMsgInMain);

function createWindow() {
  Menu.setApplicationMenu(null);

  const win = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1100,
    minHeight: 750,
    title: "Cuadro de Mando de RRLL",
    icon: path.join(__dirname, "app", "assets", "icon.ico"),
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
  cleanupOldMirrorTempFiles(app.getPath("userData"), getMirrorSqlitePath(), getMirrorMetaPath());
  setMirrorStatusFromMeta(readMirrorMeta(getMirrorMetaPath()));
  const startupData = await loadAllData();
  try {
    const startupBackup = await createRobustBackup("app_start", startupData);
    if (!startupBackup || !startupBackup.ok) {
      console.warn("[RRLL][DB] El backup inicial no se ha creado. La aplicación continuará:", startupBackup && (startupBackup.error || startupBackup.skipped) ? (startupBackup.error || startupBackup.skipped) : "motivo no disponible");
    }
  } catch (error) {
    console.error("No se pudo crear backup al abrir:", error);
  }
  try {
    await updateLocalMirror("app_start");
  } catch (error) {
    console.error("No se pudo actualizar espejo local al abrir:", error);
  }
  startBackupScheduler();
  startMirrorScheduler();
  createWindow();
});

async function performControlledQuit() {
  stopBackupScheduler();
  stopMirrorScheduler();
  try {
    if (dirtySinceLastBackup) {
      await createRobustBackup("app_close", await loadAllData(), { throttleMs: 0 });
    }
    if (mirrorDirty) {
      await updateLocalMirror("app_close");
    }
  } catch (error) {
    console.error("No se pudo crear backup al cerrar:", error);
  } finally {
    isQuitting = true;
    app.quit();
  }
}

app.on("before-quit", event => {
  if (isQuitting) return;
  event.preventDefault();
  if (safeQuitInProgress) return;
  safeQuitInProgress = true;
  performControlledQuit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
