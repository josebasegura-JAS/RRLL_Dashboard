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

  const saturdayCalendarId = repository.createTicketCalendar({
    name: "Turno sábado",
    aliases: "sabado, sábado, turno sabado",
    weekdays: [6],
    observations: "Calendario de prueba"
  });
  assert.ok(saturdayCalendarId > 0);
  assert.deepEqual(repository.getTicketCalendars().map(calendar => calendar.name), [...BASE_TICKET_CALENDARS.map(calendar => calendar.name), "Turno sábado"]);
  assert.deepEqual(repository.getTicketCalendarAliases().filter(alias => alias.calendar_id === saturdayCalendarId).map(alias => alias.alias), ["sabado", "turnosabado"]);
  assert.deepEqual(repository.getTicketCalendarWeekdays().filter(day => day.calendar_id === saturdayCalendarId).map(day => day.iso_weekday), [6]);

  repository.updateTicketCalendar(saturdayCalendarId, { name: "Turno fin de semana", aliases: "finde", weekdays: [6, 7], observations: "Editado" });
  assert.deepEqual(repository.getTicketCalendars().find(calendar => calendar.id === saturdayCalendarId), { id: saturdayCalendarId, name: "Turno fin de semana", display_order: 5, active: 1, observations: "Editado" });
  assert.deepEqual(repository.getTicketCalendarAliases().filter(alias => alias.calendar_id === saturdayCalendarId).map(alias => alias.alias), ["finde", "turnosabado"]);
  assert.deepEqual(repository.getTicketCalendarWeekdays().filter(day => day.calendar_id === saturdayCalendarId).map(day => day.iso_weekday), [6, 7]);
  assert.throws(() => repository.createTicketCalendar({ name: "", weekdays: [1] }), /nombre del calendario es obligatorio/i);
  assert.throws(() => repository.createTicketCalendar({ name: "Vacío", weekdays: [] }), /al menos un día ticket/i);
  assert.throws(() => repository.createTicketCalendar({ name: "servicios centrales", weekdays: [1] }), /ya existe un calendario con ese nombre/i);
  assert.throws(() => repository.createTicketCalendar({ name: "Otro", aliases: "SSCC", weekdays: [1] }), /alias "sscc" ya está utilizado/i);

  repository.disableTicketCalendar(saturdayCalendarId);
  assert.equal(repository.getTicketCalendars().find(calendar => calendar.id === saturdayCalendarId).active, 0);
  repository.enableTicketCalendar(saturdayCalendarId);
  assert.equal(repository.getTicketCalendars().find(calendar => calendar.id === saturdayCalendarId).active, 1);
  assert.throws(() => repository.disableTicketCalendar(repository.getTicketCalendars()[0].id), /calendarios base no se pueden desactivar/i);
  assert.throws(() => repository.deleteTicketCalendarIfUnused(repository.getTicketCalendars()[0].id), /calendarios base no se pueden borrar/i);

  const disposableId = repository.createTicketCalendar({ name: "Creado por error", aliases: "error", weekdays: [1, 2] });
  const disposableUsage = repository.getTicketCalendarUsage(disposableId);
  assert.deepEqual({ aliases: disposableUsage.aliases, weekdays: disposableUsage.weekdays, hasBlockingReferences: disposableUsage.hasBlockingReferences }, { aliases: 1, weekdays: 2, hasBlockingReferences: false });
  repository.deleteTicketCalendarIfUnused(disposableId);
  assert.equal(repository.getTicketCalendars().some(calendar => calendar.id === disposableId), false);
  assert.equal(repository.getTicketCalendarAliases().some(alias => alias.calendar_id === disposableId), false);
  assert.equal(repository.getTicketCalendarWeekdays().some(day => day.calendar_id === disposableId), false);

  const referencedId = repository.createTicketCalendar({ name: "Con referencias", aliases: "referenciada", weekdays: [1] });
  db.run("INSERT INTO ticket_calendar_exclusions (calendar_id, date, no_ticket, source) VALUES (?, '2026-07-01', 1, 'manual')", [referencedId]);
  db.run("INSERT INTO ticket_calendar_rules (calendar_id, rule_type, rule_value, active) VALUES (?, 'test', '', 1)", [referencedId]);
  db.run("INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)", ["rrll_ticket_restaurant_people", JSON.stringify([{ employeeNumber: "7", calendar: "Con referencias" }]), new Date().toISOString()]);
  db.run("UPDATE kv_store SET value = ? WHERE key = 'rrll_ticket_restaurant_calendar_marks'", [JSON.stringify([{ calendarId: referencedId, date: "2026-07-02", noTicket: true }])]);
  const referencedUsage = repository.getTicketCalendarUsage(referencedId);
  assert.deepEqual({ exclusions: referencedUsage.exclusions, rules: referencedUsage.rules, people: referencedUsage.people, marks: referencedUsage.marks, hasBlockingReferences: referencedUsage.hasBlockingReferences }, { exclusions: 1, rules: 1, people: 1, marks: 1, hasBlockingReferences: true });
  assert.throws(() => repository.deleteTicketCalendarIfUnused(referencedId), /No se puede borrar porque tiene personas, exclusiones, reglas o marcas asociadas\. Puedes desactivarlo\./);
  assert.equal(repository.getTicketCalendars().some(calendar => calendar.id === referencedId), true);
  assert.equal(repository.getTicketCalendarExclusions().some(exclusion => exclusion.calendar_id === referencedId), true);
  assert.equal(repository.getTicketCalendarRules().some(rule => rule.calendar_id === referencedId), true);
  db.run("DELETE FROM ticket_calendar_exclusions WHERE calendar_id = ?", [referencedId]);
  db.run("DELETE FROM ticket_calendar_rules WHERE calendar_id = ?", [referencedId]);
  db.run("DELETE FROM kv_store WHERE key = 'rrll_ticket_restaurant_people'");
  db.run("UPDATE kv_store SET value = '[]' WHERE key = 'rrll_ticket_restaurant_calendar_marks'");
  repository.deleteTicketCalendarIfUnused(referencedId);

  const persisted = db.export();
  db.close();

  db = new SQL.Database(persisted);
  const reopenedRepository = createTicketCalendarRepository({ db });
  reopenedRepository.ensureTicketCalendarSchema();
  assert.equal(reopenedRepository.seedBaseTicketCalendars(), 0);
  assert.equal(reopenedRepository.migrateLegacyTicketCalendarExclusions(), 0);
  assert.equal(reopenedRepository.getTicketCalendars().length, 5);
  assert.equal(reopenedRepository.getTicketCalendarAliases().length, 11);
  assert.equal(reopenedRepository.getTicketCalendarWeekdays().length, 22);
  assert.deepEqual(reopenedRepository.getTicketCalendars().slice(0, 4).map(calendar => calendar.name), BASE_TICKET_CALENDARS.map(calendar => calendar.name));
  assert.equal(reopenedRepository.getTicketCalendars()[4].name, "Turno fin de semana");
  assert.equal(reopenedRepository.getTicketCalendarRules().length, 1);
  assert.equal(reopenedRepository.getTicketCalendarExclusions().length, 2);

  assert.equal(db.exec("SELECT value FROM kv_store WHERE key = 'rrll_ticket_restaurant_calendar_marks'")[0].values.length, 1);
  db.close();

  const legacySchemaDb = new SQL.Database();
  legacySchemaDb.run("CREATE TABLE ticket_calendars (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, display_order INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1)");
  createTicketCalendarRepository({ db: legacySchemaDb }).ensureTicketCalendarSchema();
  assert.ok(legacySchemaDb.exec("PRAGMA table_info(ticket_calendars)")[0].values.some(column => column[1] === "observations"));
  legacySchemaDb.close();
  console.log("ticket-calendar-repository smoke test passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
