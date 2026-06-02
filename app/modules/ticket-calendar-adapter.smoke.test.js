const assert = require("node:assert/strict");
const initSqlJs = require("sql.js");
const TicketCalendarDomain = require("./ticket-calendar-domain.js");
const { createTicketCalendarRepository } = require("./ticket-calendar-repository.js");
const { createTicketCalendarAdapter } = require("./ticket-calendar-adapter.js");

(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run("CREATE TABLE kv_store (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)");
  const repository = createTicketCalendarRepository({ db });
  repository.ensureTicketCalendarSchema();
  repository.seedBaseTicketCalendars();
  db.run("INSERT INTO ticket_calendar_exclusions (calendar_id, date, no_ticket, source) SELECT id, '2026-06-01', 1, 'configured' FROM ticket_calendars WHERE name = 'Servicios Centrales'");

  const warnings = [];
  const adapter = createTicketCalendarAdapter({ repository, domain: TicketCalendarDomain, warn: (...args) => warnings.push(args) });
  const model = adapter.readTicketCalendarModel();
  assert.equal(model.source, "sqlite");
  assert.equal(model.options.calendars.length, 4);
  assert.equal(model.options.aliases.length, 9);
  assert.equal(model.options.weekdays.length, 20);
  assert.equal(model.options.exclusions.length, 1);
  assert.deepEqual(model.options.rules.map(rule => [rule.rule_type, rule.rule_value]), [["absence_reason_without_discount", "SIN"]]);
  assert.deepEqual(model.calendars.map(calendar => calendar.name), ["Servicios Centrales", "Ingeniería Ariz", "Instalaciones Sopela", "Liberados"]);
  assert.equal(TicketCalendarDomain.normalizeTicketCalendar("sscc", model.options), "Servicios Centrales");
  assert.equal(TicketCalendarDomain.calendarHasTicketRightOnDate({ calendarName: "Servicios Centrales", date: "2026-06-01", ...model.options }), false);
  assert.equal(TicketCalendarDomain.countTicketDaysForCalendar({ calendarName: "Servicios Centrales", year: 2026, month: 6, ...model.options }), 21);
  assert.equal(TicketCalendarDomain.countNoTicketWeekdaysForCalendar({ calendarName: "Servicios Centrales", year: 2026, month: 6, ...model.options }), 1);

  const historicalMarks = [{ calendar: "Servicios Centrales", date: "2026-06-01", noTicket: true }];
  model.calendars.forEach(calendar => {
    const calendarName = calendar.name;
    assert.equal(TicketCalendarDomain.normalizeTicketCalendar(calendarName, model.options), TicketCalendarDomain.normalizeTicketCalendar(calendarName));
    assert.equal(TicketCalendarDomain.isKnownTicketCalendar(calendarName, model.options), TicketCalendarDomain.isKnownTicketCalendar(calendarName));
    assert.equal(
      TicketCalendarDomain.calendarHasTicketRightOnDate({ calendarName, date: "2026-06-02", ...model.options }),
      TicketCalendarDomain.calendarHasTicketRightOnDate({ calendarName, date: "2026-06-02", calendarMarks: historicalMarks })
    );
    assert.equal(
      TicketCalendarDomain.countTicketDaysForCalendar({ calendarName, year: 2026, month: 6, ...model.options }),
      TicketCalendarDomain.countTicketDaysForCalendar({ calendarName, year: 2026, month: 6, calendarMarks: historicalMarks })
    );
    assert.equal(
      TicketCalendarDomain.countNoTicketWeekdaysForCalendar({ calendarName, year: 2026, month: 6, ...model.options }),
      TicketCalendarDomain.countNoTicketWeekdaysForCalendar({ calendarName, year: 2026, month: 6, calendarMarks: historicalMarks })
    );
  });
  assert.equal(warnings.length, 0);

  const emptyRepository = {
    getTicketCalendars: () => [],
    getTicketCalendarAliases: () => [],
    getTicketCalendarWeekdays: () => [],
    getTicketCalendarExclusions: () => [],
    getTicketCalendarRules: () => []
  };
  const emptyModel = createTicketCalendarAdapter({ repository: emptyRepository, domain: TicketCalendarDomain, warn: (...args) => warnings.push(args) }).readTicketCalendarModel();
  assert.equal(emptyModel.source, "fallback");
  assert.deepEqual(emptyModel.calendars.map(calendar => calendar.name), ["Servicios Centrales", "Ingeniería Ariz", "Instalaciones Sopela", "Liberados"]);

  const failingModel = createTicketCalendarAdapter({
    repository: { getTicketCalendars: () => { throw new Error("SQLite no disponible"); } },
    domain: TicketCalendarDomain,
    warn: (...args) => warnings.push(args)
  }).readTicketCalendarModel();
  assert.equal(failingModel.source, "fallback");
  assert.deepEqual(failingModel.calendars.map(calendar => calendar.name), ["Servicios Centrales", "Ingeniería Ariz", "Instalaciones Sopela", "Liberados"]);
  assert.equal(warnings.length, 2);

  db.close();
  console.log("ticket-calendar-adapter smoke test passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
