const { app, BrowserWindow, shell, ipcMain, Menu, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

let lastBackupAt = 0;
let sqlReadyPromise = null;
let SQLRef = null;

function getLocalSqlitePath() {
  return path.join(app.getPath("userData"), "rrll-dashboard.sqlite");
}

function getLegacyJsonPath() {
  return path.join(app.getPath("userData"), "rrll-dashboard-db-v1-1-beta.json");
}

function getDbConfigPath() {
  return path.join(app.getPath("userData"), "rrll-db-config.json");
}

function getBackupsDir() {
  return path.join(app.getPath("userData"), "backups");
}

function ensureBackupsDir() {
  const dir = getBackupsDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function ts() {
  const now = new Date();
  const pad = value => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function getWindowsUser() {
  const domain = process.env.USERDOMAIN || os.hostname();
  const username = process.env.USERNAME || os.userInfo().username || "usuario";
  return `${domain}\\${username}`;
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
  const info = getActiveDbInfo();
  return withFileLock(info.path, async () => {
    const { db } = await openDatabase(info.path);
    try {
      const result = { mode: info.mode, path: info.path, user: info.user, lastUpdate: null, lastUpdateBy: null, token: null };
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
  const info = getActiveDbInfo();
  return withFileLock(info.path, async () => {
    const { db, existed } = await openDatabase(info.path);
    try {
      if (!existed && info.mode === "local") {
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
  const info = getActiveDbInfo();
  return withFileLock(info.path, async () => {
    const { db } = await openDatabase(info.path);
    try {
      const now = new Date().toISOString();
      db.run("INSERT OR REPLACE INTO kv_store (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)", [key, serializeValue(value), now, getWindowsUser()]);
      if (key === "rrll_criteria") syncCriteriaTable(db, value);
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
  const info = getActiveDbInfo();
  return withFileLock(info.path, async () => {
    const { db } = await openDatabase(info.path);
    try {
      const now = new Date().toISOString();
      db.run("BEGIN TRANSACTION");
      try {
        db.run("DELETE FROM kv_store WHERE key LIKE 'rrll_%'");
        const stmt = db.prepare("INSERT OR REPLACE INTO kv_store (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)");
        Object.entries(safe).forEach(([key, value]) => {
          if (typeof key === "string" && key.startsWith("rrll_")) stmt.run([key, serializeValue(value), now, getWindowsUser()]);
        });
        stmt.free();
        syncCriteriaTable(db, safe.rrll_criteria);
        addAudit(db, "save_all", null, "Guardado completo / importación");
        touchDatabaseState(db);
        db.run("COMMIT");
      } catch (error) {
        try { db.run("ROLLBACK"); } catch {}
        throw error;
      }
      persistDb(db, info.path);
      return true;
    } finally {
      try { db.close(); } catch {}
    }
  });
}

async function backupAllData(data) {
  const nowMs = Date.now();
  if (nowMs - lastBackupAt < 600) return false;
  lastBackupAt = nowMs;

  const safe = isPlainObject(data) ? data : {};
  const info = getActiveDbInfo();
  const file = path.join(ensureBackupsDir(), `backup-${ts()}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify({
      app: "Cuadro de Mando de RRLL",
      version: "1.0-beta-backup",
      createdAt: new Date().toISOString(),
      databaseMode: info.mode,
      databasePath: info.path,
      user: getWindowsUser(),
      values: safe
    }, null, 2),
    "utf-8"
  );
  return true;
}

async function getDbInfo() {
  const info = getActiveDbInfo();
  return { mode: info.mode, path: info.path, sharedDir: info.sharedDir || "", user: info.user, localPath: info.localPath };
}

async function chooseSharedDirectory() {
  const result = await dialog.showOpenDialog({
    title: "Seleccionar carpeta compartida para la base de datos",
    properties: ["openDirectory", "createDirectory"]
  });
  if (result.canceled || !result.filePaths || !result.filePaths[0]) return null;
  return result.filePaths[0];
}

async function setSharedDirectory(_event, directory, currentData) {
  if (!directory || typeof directory !== "string") throw new Error("Carpeta compartida no válida.");
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

  const sharedDbPath = path.join(directory, "rrll-dashboard-shared.sqlite");
  writeDbConfig({ mode: "shared", sharedDir: directory, sharedDbPath });

  const exists = fs.existsSync(sharedDbPath);
  const existingData = exists ? await loadAllData() : {};
  if (!exists || !Object.keys(existingData).length) {
    await saveAllData(isPlainObject(currentData) ? currentData : {});
  }
  return getDbInfo();
}

async function useLocalDatabase(_event, currentData) {
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

ipcMain.handle("db:loadAll", async () => loadAllData());
ipcMain.handle("db:saveAll", async (_event, data) => saveAllData(data));
ipcMain.handle("db:saveKey", async (_event, key, value) => saveKeyData(key, value));
ipcMain.handle("db:backupAll", async (_event, data) => backupAllData(data));
ipcMain.handle("db:getInfo", async () => getDbInfo());
ipcMain.handle("db:getState", async () => getDbState());
ipcMain.handle("db:chooseSharedDirectory", chooseSharedDirectory);
ipcMain.handle("db:setSharedDirectory", setSharedDirectory);
ipcMain.handle("db:useLocalDatabase", useLocalDatabase);
ipcMain.handle("db:importCommitteeHistoryDocx", importCommitteeHistoryDocx);
ipcMain.handle("db:importParitariaHistoryDocx", importParitariaHistoryDocx);
ipcMain.handle("db:generateCommitteeMinutesDraft", generateCommitteeMinutesDraft);

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
  await loadAllData();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
