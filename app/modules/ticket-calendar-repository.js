/**
 * Persistencia SQLite preparada para los calendarios de Ticket Restaurante.
 *
 * Esta capa todavía no sustituye las lecturas KV ni el fallback del dominio.
 * Expone únicamente consultas y utilidades idempotentes de inicialización.
 */

const BASE_TICKET_CALENDARS = Object.freeze([
  Object.freeze({
    name: "Servicios Centrales",
    aliases: Object.freeze(["sscc", "servicioscentrales", "serviciocentrales"]),
    displayOrder: 1
  }),
  Object.freeze({
    name: "Ingeniería Ariz",
    aliases: Object.freeze(["ariz", "ingenieriaariz"]),
    displayOrder: 2
  }),
  Object.freeze({
    name: "Instalaciones Sopela",
    aliases: Object.freeze(["sopela", "instalacionessopela", "instalacionsopela"]),
    displayOrder: 3
  }),
  Object.freeze({
    name: "Liberados",
    aliases: Object.freeze(["liberados"]),
    displayOrder: 4
  })
]);

const DEFAULT_TICKET_ISO_WEEKDAYS = Object.freeze([1, 2, 3, 4, 5]);
const LEGACY_CALENDAR_MARKS_KEY = "rrll_ticket_restaurant_calendar_marks";

function normalizeCompactText(value) {
  return String(value == null ? "" : value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/º/g, "o")
    .replace(/ª/g, "a")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function parseIsoDate(value) {
  const text = String(value == null ? "" : value).trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return text;
}

function rowsFromExec(db, sql, params = []) {
  const result = db.exec(sql, params);
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map(row => Object.fromEntries(columns.map((column, index) => [column, row[index]])));
}

function runAndCount(db, sql, params = []) {
  db.run(sql, params);
  return Number(db.getRowsModified()) || 0;
}


const TICKET_CALENDAR_TABLE_COLUMNS = Object.freeze({
  ticket_calendars: Object.freeze(["id", "name", "display_order", "active", "observations"]),
  ticket_calendar_aliases: Object.freeze(["id", "calendar_id", "alias"]),
  ticket_calendar_weekdays: Object.freeze(["calendar_id", "iso_weekday"]),
  ticket_calendar_exclusions: Object.freeze(["id", "calendar_id", "date", "no_ticket", "source"]),
  ticket_calendar_rules: Object.freeze(["id", "calendar_id", "rule_type", "rule_value", "active"])
});

function getTicketCalendarSchemaInfo(db) {
  const tableNames = rowsFromExec(db, `
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name LIKE 'ticket_calendar%'
  `).map(row => row.name);
  const existingTables = new Set(tableNames);
  const columns = {};
  const columnTypes = {};
  tableNames.forEach(tableName => {
    const tableColumns = rowsFromExec(db, `PRAGMA table_info(${tableName})`);
    columns[tableName] = tableColumns.map(row => String(row.name));
    columnTypes[tableName] = Object.fromEntries(tableColumns.map(row => [String(row.name), String(row.type || "").toUpperCase()]));
  });
  const hasColumns = (tableName, required) => {
    const available = new Set(columns[tableName] || []);
    return required.every(column => available.has(column));
  };
  const hasAnyTables = tableNames.length > 0;
  const currentCompatible = Object.entries(TICKET_CALENDAR_TABLE_COLUMNS)
    .every(([tableName, required]) => existingTables.has(tableName) && hasColumns(tableName, required));
  const calendarIdIsInteger = !existingTables.has("ticket_calendars") || (columnTypes.ticket_calendars || {}).id === "INTEGER";
  const calendarsCanBeUpgraded = !existingTables.has("ticket_calendars")
    || (calendarIdIsInteger && hasColumns("ticket_calendars", ["id", "name", "display_order", "active"]));
  const relationsCanBeInitialized = Object.entries(TICKET_CALENDAR_TABLE_COLUMNS)
    .filter(([tableName]) => tableName !== "ticket_calendars")
    .every(([tableName, required]) => !existingTables.has(tableName) || hasColumns(tableName, required));
  const safeToInitialize = !hasAnyTables || (calendarsCanBeUpgraded && relationsCanBeInitialized);
  const readCompatible = existingTables.has("ticket_calendars") && hasColumns("ticket_calendars", ["id", "name"]);
  return Object.freeze({ hasAnyTables, currentCompatible: currentCompatible && calendarIdIsInteger, safeToInitialize, readCompatible, tables: Object.freeze(tableNames), columns: Object.freeze(columns), columnTypes: Object.freeze(columnTypes) });
}

function createTicketCalendarRepository({ db, warn = console.warn }) {
  if (!db || typeof db.run !== "function" || typeof db.exec !== "function") {
    throw new Error("Se requiere una conexión SQLite válida para TicketCalendarRepository.");
  }

  function ensureTicketCalendarSchema() {
    const before = getTicketCalendarSchemaInfo(db);
    if (before.hasAnyTables && !before.safeToInitialize) {
      warn("Esquema SQLite de calendarios Ticket incompatible; se conserva sin migración destructiva y se usará fallback.", before);
      return before;
    }
    db.run(`
      CREATE TABLE IF NOT EXISTS ticket_calendars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        display_order INTEGER NOT NULL,
        active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
        observations TEXT NOT NULL DEFAULT ''
      );
    `);
    try { db.run("ALTER TABLE ticket_calendars ADD COLUMN observations TEXT NOT NULL DEFAULT ''"); } catch {}
    db.run(`
      CREATE TABLE IF NOT EXISTS ticket_calendar_aliases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        calendar_id INTEGER NOT NULL,
        alias TEXT NOT NULL,
        FOREIGN KEY (calendar_id) REFERENCES ticket_calendars(id),
        UNIQUE (calendar_id, alias)
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS ticket_calendar_weekdays (
        calendar_id INTEGER NOT NULL,
        iso_weekday INTEGER NOT NULL CHECK (iso_weekday BETWEEN 1 AND 7),
        FOREIGN KEY (calendar_id) REFERENCES ticket_calendars(id),
        PRIMARY KEY (calendar_id, iso_weekday)
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS ticket_calendar_exclusions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        calendar_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        no_ticket INTEGER NOT NULL DEFAULT 1 CHECK (no_ticket IN (0, 1)),
        source TEXT NOT NULL DEFAULT 'configured',
        FOREIGN KEY (calendar_id) REFERENCES ticket_calendars(id),
        UNIQUE (calendar_id, date)
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS ticket_calendar_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        calendar_id INTEGER NOT NULL,
        rule_type TEXT NOT NULL,
        rule_value TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
        FOREIGN KEY (calendar_id) REFERENCES ticket_calendars(id),
        UNIQUE (calendar_id, rule_type, rule_value)
      );
    `);
    return getTicketCalendarSchemaInfo(db);
  }

  function assertCurrentSchema(operation) {
    const info = getTicketCalendarSchemaInfo(db);
    if (info.currentCompatible) return info;
    const error = new Error(`Esquema SQLite de calendarios Ticket incompatible para ${operation}; se conserva la BBDD sin cambios.`);
    error.code = "ticket_calendar_schema_incompatible";
    throw error;
  }

  function hasTable(tableName) {
    return getTicketCalendarSchemaInfo(db).tables.includes(tableName);
  }

  function getCalendarIdByName(name) {
    const rows = rowsFromExec(db, "SELECT id FROM ticket_calendars WHERE name = ? LIMIT 1", [name]);
    return rows.length ? Number(rows[0].id) : 0;
  }

  function seedBaseTicketCalendars() {
    assertCurrentSchema("insertar calendarios base");
    let inserted = 0;
    BASE_TICKET_CALENDARS.forEach(calendar => {
      inserted += runAndCount(db, "INSERT OR IGNORE INTO ticket_calendars (name, display_order, active) VALUES (?, ?, 1)", [calendar.name, calendar.displayOrder]);
      const calendarId = getCalendarIdByName(calendar.name);
      if (!calendarId) return;
      calendar.aliases.forEach(alias => {
        inserted += runAndCount(db, "INSERT OR IGNORE INTO ticket_calendar_aliases (calendar_id, alias) VALUES (?, ?)", [calendarId, alias]);
      });
      DEFAULT_TICKET_ISO_WEEKDAYS.forEach(isoWeekday => {
        inserted += runAndCount(db, "INSERT OR IGNORE INTO ticket_calendar_weekdays (calendar_id, iso_weekday) VALUES (?, ?)", [calendarId, isoWeekday]);
      });
    });

    const liberadosId = getCalendarIdByName("Liberados");
    if (liberadosId) {
      inserted += runAndCount(db, `
        INSERT OR IGNORE INTO ticket_calendar_rules (calendar_id, rule_type, rule_value, active)
        VALUES (?, 'absence_reason_without_discount', 'SIN', 1)
      `, [liberadosId]);
    }
    return inserted;
  }

  function normalizeTicketCalendarInput(input = {}) {
    const name = String(input.name == null ? "" : input.name).trim();
    const aliases = [...new Set((Array.isArray(input.aliases) ? input.aliases : String(input.aliases == null ? "" : input.aliases).split(","))
      .map(alias => normalizeCompactText(alias))
      .filter(Boolean))];
    const weekdays = [...new Set((Array.isArray(input.weekdays) ? input.weekdays : [])
      .map(Number)
      .filter(day => Number.isInteger(day) && day >= 1 && day <= 7))]
      .sort((left, right) => left - right);
    return { name, aliases, weekdays, observations: String(input.observations == null ? "" : input.observations).trim() };
  }

  function createValidationError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function validateTicketCalendar(input, calendarId = 0) {
    const calendar = normalizeTicketCalendarInput(input);
    if (!calendar.name) throw createValidationError("ticket_calendar_name_required", "El nombre del calendario es obligatorio.");
    if (!calendar.weekdays.length) throw createValidationError("ticket_calendar_weekday_required", "Selecciona al menos un día ticket.");

    const normalizedName = normalizeCompactText(calendar.name);
    const calendars = getTicketCalendars();
    const aliases = getTicketCalendarAliases();
    const conflictingCalendar = calendars.find(item => Number(item.id) !== Number(calendarId) && normalizeCompactText(item.name) === normalizedName);
    if (conflictingCalendar) throw createValidationError("ticket_calendar_name_duplicate", "Ya existe un calendario con ese nombre.");

    const ownAliases = new Set(calendar.aliases);
    if (ownAliases.size !== calendar.aliases.length) throw createValidationError("ticket_calendar_alias_duplicate", "No se pueden repetir aliases.");
    const reservedNames = new Map(calendars
      .filter(item => Number(item.id) !== Number(calendarId))
      .map(item => [normalizeCompactText(item.name), item.name]));
    const reservedAliases = new Map(aliases
      .filter(item => Number(item.calendar_id) !== Number(calendarId))
      .map(item => [normalizeCompactText(item.alias), item.alias]));
    calendar.aliases.forEach(alias => {
      if (reservedNames.has(alias) || reservedAliases.has(alias)) {
        throw createValidationError("ticket_calendar_alias_duplicate", `El alias "${alias}" ya está utilizado por otro calendario.`);
      }
    });
    if (reservedAliases.has(normalizedName)) throw createValidationError("ticket_calendar_name_duplicate", "El nombre coincide con un alias ya utilizado por otro calendario.");
    return calendar;
  }

  function getNextDisplayOrder() {
    const rows = rowsFromExec(db, "SELECT COALESCE(MAX(display_order), 0) + 1 AS display_order FROM ticket_calendars");
    return rows.length ? Number(rows[0].display_order) : 1;
  }

  function replaceTicketCalendarRelations(calendarId, calendar) {
    db.run("DELETE FROM ticket_calendar_aliases WHERE calendar_id = ?", [calendarId]);
    calendar.aliases.forEach(alias => db.run("INSERT INTO ticket_calendar_aliases (calendar_id, alias) VALUES (?, ?)", [calendarId, alias]));
    db.run("DELETE FROM ticket_calendar_weekdays WHERE calendar_id = ?", [calendarId]);
    calendar.weekdays.forEach(day => db.run("INSERT INTO ticket_calendar_weekdays (calendar_id, iso_weekday) VALUES (?, ?)", [calendarId, day]));
  }

  function createTicketCalendar(input) {
    assertCurrentSchema("crear un calendario");
    const calendar = validateTicketCalendar(input);
    db.run("BEGIN");
    try {
      db.run("INSERT INTO ticket_calendars (name, display_order, active, observations) VALUES (?, ?, 1, ?)", [calendar.name, getNextDisplayOrder(), calendar.observations]);
      const calendarId = getCalendarIdByName(calendar.name);
      replaceTicketCalendarRelations(calendarId, calendar);
      db.run("COMMIT");
      return calendarId;
    } catch (error) {
      db.run("ROLLBACK");
      throw error;
    }
  }

  function updateTicketCalendar(calendarId, input) {
    assertCurrentSchema("editar un calendario");
    const id = Number(calendarId);
    if (!Number.isInteger(id) || id <= 0 || !getTicketCalendars().some(calendar => Number(calendar.id) === id)) {
      throw createValidationError("ticket_calendar_not_found", "No se ha encontrado el calendario que quieres editar.");
    }
    const previous = getTicketCalendars().find(calendar => Number(calendar.id) === id);
    const renamedInput = normalizeCompactText(previous.name) === normalizeCompactText(input && input.name)
      ? input
      : { ...input, aliases: [...(Array.isArray(input && input.aliases) ? input.aliases : String(input && input.aliases == null ? "" : input.aliases).split(",")), previous.name] };
    const calendar = validateTicketCalendar(renamedInput, id);
    db.run("BEGIN");
    try {
      db.run("UPDATE ticket_calendars SET name = ?, observations = ? WHERE id = ?", [calendar.name, calendar.observations, id]);
      replaceTicketCalendarRelations(id, calendar);
      db.run("COMMIT");
      return id;
    } catch (error) {
      db.run("ROLLBACK");
      throw error;
    }
  }

  function getTicketCalendars() {
    const info = getTicketCalendarSchemaInfo(db);
    if (!info.readCompatible) return [];
    const available = new Set(info.columns.ticket_calendars || []);
    const displayOrder = available.has("display_order") ? "display_order" : "NULL AS display_order";
    const active = available.has("active") ? "active" : "1 AS active";
    const observations = available.has("observations") ? "observations" : available.has("notes") ? "notes AS observations" : "'' AS observations";
    const order = available.has("display_order") ? "display_order, id" : available.has("name") ? "name, id" : "id";
    return rowsFromExec(db, `SELECT id, name, ${displayOrder}, ${active}, ${observations} FROM ticket_calendars ORDER BY ${order}`);
  }

  function getTicketCalendarAliases() {
    const info = getTicketCalendarSchemaInfo(db);
    return info.tables.includes("ticket_calendar_aliases") && ["id", "calendar_id", "alias"].every(column => (info.columns.ticket_calendar_aliases || []).includes(column))
      ? rowsFromExec(db, "SELECT id, calendar_id, alias FROM ticket_calendar_aliases ORDER BY calendar_id, id") : [];
  }

  function getTicketCalendarWeekdays() {
    const info = getTicketCalendarSchemaInfo(db);
    return info.tables.includes("ticket_calendar_weekdays") && ["calendar_id", "iso_weekday"].every(column => (info.columns.ticket_calendar_weekdays || []).includes(column))
      ? rowsFromExec(db, "SELECT calendar_id, iso_weekday FROM ticket_calendar_weekdays ORDER BY calendar_id, iso_weekday") : [];
  }

  function getTicketCalendarExclusions() {
    const info = getTicketCalendarSchemaInfo(db);
    if (!info.tables.includes("ticket_calendar_exclusions") || !["id", "calendar_id"].every(column => (info.columns.ticket_calendar_exclusions || []).includes(column))) return [];
    const available = new Set(info.columns.ticket_calendar_exclusions || []);
    const date = available.has("date") ? "date" : available.has("exclusion_date") ? "exclusion_date AS date" : "NULL AS date";
    const noTicket = available.has("no_ticket") ? "no_ticket" : available.has("exclusion_type") ? "CASE WHEN exclusion_type IS NULL OR exclusion_type != 'ticket' THEN 1 ELSE 0 END AS no_ticket" : "1 AS no_ticket";
    const source = available.has("source") ? "source" : "'legacy_schema' AS source";
    return rowsFromExec(db, `SELECT id, calendar_id, ${date}, ${noTicket}, ${source} FROM ticket_calendar_exclusions ORDER BY calendar_id, date, id`);
  }

  function getTicketCalendarRules() {
    const info = getTicketCalendarSchemaInfo(db);
    if (!info.tables.includes("ticket_calendar_rules") || !["id", "calendar_id", "rule_type"].every(column => (info.columns.ticket_calendar_rules || []).includes(column))) return [];
    const available = new Set(info.columns.ticket_calendar_rules || []);
    const ruleValue = available.has("rule_value") ? "rule_value" : available.has("rule_payload") ? "rule_payload AS rule_value" : "'' AS rule_value";
    const active = available.has("active") ? "active" : "1 AS active";
    return rowsFromExec(db, `SELECT id, calendar_id, rule_type, ${ruleValue}, ${active} FROM ticket_calendar_rules ORDER BY calendar_id, id`);
  }

  function getCalendarIdLookup() {
    const lookup = new Map();
    getTicketCalendars().forEach(calendar => lookup.set(normalizeCompactText(calendar.name), Number(calendar.id)));
    getTicketCalendarAliases().forEach(alias => lookup.set(normalizeCompactText(alias.alias), Number(alias.calendar_id)));
    return lookup;
  }

  function readLegacyCalendarMarks() {
    const rows = rowsFromExec(db, "SELECT value FROM kv_store WHERE key = ? LIMIT 1", [LEGACY_CALENDAR_MARKS_KEY]);
    if (!rows.length) return [];
    try {
      const parsed = JSON.parse(rows[0].value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function migrateLegacyTicketCalendarExclusions() {
    assertCurrentSchema("copiar exclusiones KV");
    const calendarIds = getCalendarIdLookup();
    let inserted = 0;
    readLegacyCalendarMarks().forEach(mark => {
      if (!mark || !mark.noTicket) return;
      const calendarId = calendarIds.get(normalizeCompactText(mark.calendarName == null ? mark.calendar : mark.calendarName));
      const date = parseIsoDate(mark.date);
      if (!calendarId || !date) return;
      inserted += runAndCount(db, `
        INSERT OR IGNORE INTO ticket_calendar_exclusions (calendar_id, date, no_ticket, source)
        VALUES (?, ?, 1, 'legacy_kv')
      `, [calendarId, date]);
    });
    return inserted;
  }

  return Object.freeze({
    getTicketCalendarSchemaInfo: () => getTicketCalendarSchemaInfo(db),
    ensureTicketCalendarSchema,
    seedBaseTicketCalendars,
    migrateLegacyTicketCalendarExclusions,
    getTicketCalendars,
    getTicketCalendarAliases,
    getTicketCalendarWeekdays,
    getTicketCalendarExclusions,
    getTicketCalendarRules,
    createTicketCalendar,
    updateTicketCalendar
  });
}

const TicketCalendarRepository = Object.freeze({
  BASE_TICKET_CALENDARS,
  DEFAULT_TICKET_ISO_WEEKDAYS,
  LEGACY_CALENDAR_MARKS_KEY,
  getTicketCalendarSchemaInfo,
  createTicketCalendarRepository
});

if (typeof window !== "undefined") window.TicketCalendarRepository = TicketCalendarRepository;
if (typeof module !== "undefined" && module.exports) module.exports = TicketCalendarRepository;
