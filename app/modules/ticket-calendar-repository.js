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

function createTicketCalendarRepository({ db }) {
  if (!db || typeof db.run !== "function" || typeof db.exec !== "function") {
    throw new Error("Se requiere una conexión SQLite válida para TicketCalendarRepository.");
  }

  function ensureTicketCalendarSchema() {
    db.run(`
      CREATE TABLE IF NOT EXISTS ticket_calendars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        display_order INTEGER NOT NULL,
        active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
      );
    `);
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
  }

  function getCalendarIdByName(name) {
    const rows = rowsFromExec(db, "SELECT id FROM ticket_calendars WHERE name = ? LIMIT 1", [name]);
    return rows.length ? Number(rows[0].id) : 0;
  }

  function seedBaseTicketCalendars() {
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

  function getTicketCalendars() {
    return rowsFromExec(db, "SELECT id, name, display_order, active FROM ticket_calendars ORDER BY display_order, id");
  }

  function getTicketCalendarAliases() {
    return rowsFromExec(db, "SELECT id, calendar_id, alias FROM ticket_calendar_aliases ORDER BY calendar_id, id");
  }

  function getTicketCalendarWeekdays() {
    return rowsFromExec(db, "SELECT calendar_id, iso_weekday FROM ticket_calendar_weekdays ORDER BY calendar_id, iso_weekday");
  }

  function getTicketCalendarExclusions() {
    return rowsFromExec(db, "SELECT id, calendar_id, date, no_ticket, source FROM ticket_calendar_exclusions ORDER BY calendar_id, date, id");
  }

  function getTicketCalendarRules() {
    return rowsFromExec(db, "SELECT id, calendar_id, rule_type, rule_value, active FROM ticket_calendar_rules ORDER BY calendar_id, id");
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
    ensureTicketCalendarSchema,
    seedBaseTicketCalendars,
    migrateLegacyTicketCalendarExclusions,
    getTicketCalendars,
    getTicketCalendarAliases,
    getTicketCalendarWeekdays,
    getTicketCalendarExclusions,
    getTicketCalendarRules
  });
}

const TicketCalendarRepository = Object.freeze({
  BASE_TICKET_CALENDARS,
  DEFAULT_TICKET_ISO_WEEKDAYS,
  LEGACY_CALENDAR_MARKS_KEY,
  createTicketCalendarRepository
});

if (typeof window !== "undefined") window.TicketCalendarRepository = TicketCalendarRepository;
if (typeof module !== "undefined" && module.exports) module.exports = TicketCalendarRepository;
