const assert = require("node:assert/strict");
const initSqlJs = require("sql.js");
const TicketCalendarDomain = require("./ticket-calendar-domain.js");
const { createTicketCalendarRepository } = require("./ticket-calendar-repository.js");
const { createTicketCalendarAdapter } = require("./ticket-calendar-adapter.js");

(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run("CREATE TABLE kv_store (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)");
  db.run("CREATE TABLE ticket_calendars (id TEXT PRIMARY KEY, code TEXT, name TEXT, notes TEXT, active INTEGER, display_order INTEGER, created_at TEXT, updated_at TEXT)");
  db.run("CREATE TABLE ticket_calendar_exclusions (id TEXT PRIMARY KEY, calendar_id TEXT, exclusion_date TEXT, exclusion_type TEXT)");
  db.run("CREATE TABLE ticket_calendar_rules (id TEXT PRIMARY KEY, calendar_id TEXT, rule_type TEXT, rule_payload TEXT)");
  db.run("INSERT INTO ticket_calendars (id, code, name, notes, active, display_order) VALUES ('legacy-1', 'LEG', 'Calendario legacy', 'Dato histórico', 1, 1)");
  db.run("INSERT INTO ticket_calendar_exclusions (id, calendar_id, exclusion_date, exclusion_type) VALUES ('ex-1', 'legacy-1', '2026-06-01', 'no_ticket')");
  db.run("INSERT INTO ticket_calendar_rules (id, calendar_id, rule_type, rule_payload) VALUES ('rule-1', 'legacy-1', 'legacy_rule', '{\"enabled\":true}')");

  const warnings = [];
  const repository = createTicketCalendarRepository({ db, warn: (...args) => warnings.push(args) });
  const before = db.export();
  const schemaInfo = repository.ensureTicketCalendarSchema();
  assert.equal(schemaInfo.currentCompatible, false);
  assert.equal(schemaInfo.safeToInitialize, false);
  assert.equal(warnings.length, 1);
  assert.deepEqual([...db.export()], [...before], "la detección legacy no debe alterar la BBDD");

  assert.deepEqual(repository.getTicketCalendars(), [{ id: "legacy-1", name: "Calendario legacy", display_order: 1, active: 1, observations: "Dato histórico" }]);
  assert.deepEqual(repository.getTicketCalendarExclusions(), [{ id: "ex-1", calendar_id: "legacy-1", date: "2026-06-01", no_ticket: 1, source: "legacy_schema" }]);
  assert.deepEqual(repository.getTicketCalendarRules(), [{ id: "rule-1", calendar_id: "legacy-1", rule_type: "legacy_rule", rule_value: '{"enabled":true}', active: 1 }]);
  assert.throws(() => repository.seedBaseTicketCalendars(), error => error.code === "ticket_calendar_schema_incompatible");
  assert.throws(() => repository.migrateLegacyTicketCalendarExclusions(), error => error.code === "ticket_calendar_schema_incompatible");
  assert.throws(() => repository.createTicketCalendar({ name: "Nuevo", weekdays: [1] }), error => error.code === "ticket_calendar_schema_incompatible");

  const model = createTicketCalendarAdapter({ repository, domain: TicketCalendarDomain, warn: (...args) => warnings.push(args) }).readTicketCalendarModel();
  assert.equal(model.source, "sqlite");
  assert.equal(model.calendars[0].name, "Calendario legacy");
  assert.deepEqual([...db.export()], [...before], "la lectura compatible no debe alterar la BBDD");
  db.close();
  console.log("ticket-calendar-legacy-schema smoke test passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
