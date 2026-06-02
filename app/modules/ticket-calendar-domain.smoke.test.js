const assert = require("node:assert/strict");
const TicketCalendarDomain = require("./ticket-calendar-domain.js");

const {
  normalizeTicketCalendar,
  isKnownTicketCalendar,
  getTicketCalendars,
  calendarHasTicketRightOnDate,
  countTicketDaysForCalendar,
  countNoTicketWeekdaysForCalendar
} = TicketCalendarDomain;

[
  normalizeTicketCalendar,
  isKnownTicketCalendar,
  getTicketCalendars,
  calendarHasTicketRightOnDate,
  countTicketDaysForCalendar,
  countNoTicketWeekdaysForCalendar
].forEach(fn => assert.equal(typeof fn, "function"));

const expectedCalendars = ["Servicios Centrales", "Ingeniería Ariz", "Instalaciones Sopela", "Liberados"];
const fallbackCalendars = getTicketCalendars();
assert.deepEqual(fallbackCalendars.map(calendar => calendar.name), expectedCalendars);
assert.equal(Object.isFrozen(fallbackCalendars), true);
fallbackCalendars.forEach(calendar => {
  assert.deepEqual(calendar.ticketIsoWeekdays, [1, 2, 3, 4, 5]);
  assert.equal(Object.isFrozen(calendar), true);
  assert.equal(Object.isFrozen(calendar.aliases), true);
  assert.equal(Object.isFrozen(calendar.ticketIsoWeekdays), true);
});
expectedCalendars.forEach(calendar => assert.equal(isKnownTicketCalendar(calendar), true));

const aliases = {
  sscc: "Servicios Centrales",
  servicioscentrales: "Servicios Centrales",
  serviciocentrales: "Servicios Centrales",
  ariz: "Ingeniería Ariz",
  ingenieriaariz: "Ingeniería Ariz",
  sopela: "Instalaciones Sopela",
  instalacionessopela: "Instalaciones Sopela",
  instalacionsopela: "Instalaciones Sopela",
  liberados: "Liberados"
};
Object.entries(aliases).forEach(([alias, calendar]) => {
  assert.equal(normalizeTicketCalendar(alias), calendar);
  assert.equal(isKnownTicketCalendar(alias), true);
});
assert.equal(isKnownTicketCalendar("Calendario desconocido"), false);

const calendarName = "Servicios Centrales";
const calendarMarks = [
  { calendar: calendarName, date: "2026-06-01", noTicket: true },
  { calendar: calendarName, date: "2026-06-06", noTicket: true }
];
assert.equal(calendarHasTicketRightOnDate({ calendarName, date: "2026-06-02" }), true);
assert.equal(calendarHasTicketRightOnDate({ calendarName, date: "2026-06-06" }), false);
assert.equal(calendarHasTicketRightOnDate({ calendarName, date: "2026-06-07" }), false);
assert.equal(calendarHasTicketRightOnDate({ calendarName, date: "2026-06-01", calendarMarks }), false);
assert.equal(countTicketDaysForCalendar({ calendarName, year: 2026, month: 6, calendarMarks }), 21);
assert.equal(countNoTicketWeekdaysForCalendar({ calendarName, year: 2026, month: 6, calendarMarks }), 1);
assert.equal(typeof countTicketDaysForCalendar({ calendarName, year: 2026, month: 6 }), "number");
assert.equal(typeof countNoTicketWeekdaysForCalendar({ calendarName, year: 2026, month: 6 }), "number");

const externalCalendars = [{ name: "Turno sábado", aliases: ["sabado"], ticketIsoWeekdays: [6] }];
assert.equal(isKnownTicketCalendar("sscc", externalCalendars), false);
assert.equal(normalizeTicketCalendar("sabado", externalCalendars), "Turno sábado");
assert.equal(calendarHasTicketRightOnDate({ calendarName: "sabado", date: "2026-06-06", calendars: externalCalendars }), true);
assert.equal(calendarHasTicketRightOnDate({ calendarName: "sabado", date: "2026-06-08", calendars: externalCalendars }), false);

console.log("ticket-calendar-domain smoke test passed");
