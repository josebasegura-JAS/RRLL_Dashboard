const assert = require("node:assert/strict");
const initSqlJs = require("sql.js");
const {
  createTicketCalendarRepository,
  BASE_TICKET_CALENDARS,
  DEFAULT_TICKET_ISO_WEEKDAYS
} = require("./ticket-calendar-repository.js");

(async () => {
  const SQL = await initSqlJs();
  let db = new SQL.Database();
  db.run("CREATE TABLE kv_store (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)");
  db.run("INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)", [
    "rrll_ticket_restaurant_calendar_marks",
    JSON.stringify([
      { calendar: "sscc", date: "2026-06-01", noTicket: true },
      { calendar: "Servicios Centrales", date: "2026-06-01", noTicket: true },
      { calendar: "Ingeniería Ariz", date: "2026-06-02", noTicket: true },
      { calendar: "Liberados", date: "fecha-invalida", noTicket: true },
      { calendar: "Liberados", date: "2026-06-03", noTicket: false },
      { calendar: "Calendario desconocido", date: "2026-06-04", noTicket: true }
    ]),
    new Date().toISOString()
  ]);

  const repository = createTicketCalendarRepository({ db });
  repository.ensureTicketCalendarSchema();
  assert.ok(repository.seedBaseTicketCalendars() > 0);

  const tableNames = db.exec(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name LIKE 'ticket_calendar%'
    ORDER BY name
  `)[0].values.map(([name]) => name);
  assert.deepEqual(tableNames, [
    "ticket_calendar_aliases",
    "ticket_calendar_exclusions",
    "ticket_calendar_rules",
    "ticket_calendar_weekdays",
    "ticket_calendars"
  ]);

  assert.deepEqual(repository.getTicketCalendars().map(calendar => calendar.name), BASE_TICKET_CALENDARS.map(calendar => calendar.name));
  assert.equal(repository.getTicketCalendarAliases().length, 9);
  assert.equal(repository.getTicketCalendarWeekdays().length, BASE_TICKET_CALENDARS.length * DEFAULT_TICKET_ISO_WEEKDAYS.length);
  assert.deepEqual(repository.getTicketCalendarRules().map(rule => [rule.rule_type, rule.rule_value]), [["absence_reason_without_discount", "SIN"]]);

  assert.equal(repository.migrateLegacyTicketCalendarExclusions(), 2);
  assert.equal(repository.getTicketCalendarExclusions().length, 2);

  const persisted = db.export();
  db.close();

  db = new SQL.Database(persisted);
  const reopenedRepository = createTicketCalendarRepository({ db });
  reopenedRepository.ensureTicketCalendarSchema();
  assert.equal(reopenedRepository.seedBaseTicketCalendars(), 0);
  assert.equal(reopenedRepository.migrateLegacyTicketCalendarExclusions(), 0);
  assert.equal(reopenedRepository.getTicketCalendars().length, 4);
  assert.equal(reopenedRepository.getTicketCalendarAliases().length, 9);
  assert.equal(reopenedRepository.getTicketCalendarWeekdays().length, 20);
  assert.equal(reopenedRepository.getTicketCalendarRules().length, 1);
  assert.equal(reopenedRepository.getTicketCalendarExclusions().length, 2);

  assert.equal(db.exec("SELECT value FROM kv_store WHERE key = 'rrll_ticket_restaurant_calendar_marks'")[0].values.length, 1);
  db.close();
  console.log("ticket-calendar-repository smoke test passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
