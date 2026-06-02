const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const TicketCalendarDomain = require("./ticket-calendar-domain.js");

const ticketRestaurantSource = fs.readFileSync(require.resolve("./ticket-restaurante.js"), "utf8");
const expectedCalendars = ["Servicios Centrales", "Ingeniería Ariz", "Instalaciones Sopela", "Liberados"];

function loadTicketRestaurant(domain) {
  const context = {
    console,
    window: domain ? { TicketCalendarDomain: domain } : {},
    calendarMarks: []
  };
  context.load = (key, fallback) => key === "rrll_ticket_restaurant_calendar_marks" ? context.calendarMarks : fallback;
  vm.createContext(context);
  vm.runInContext(ticketRestaurantSource, context, { filename: "ticket-restaurante.js" });
  return {
    context,
    getCalendars: () => JSON.parse(vm.runInContext("JSON.stringify(TICKET_RESTAURANT_CALENDARS)", context)),
    normalize: value => context.normalizeTicketCalendar(value),
    isKnown: value => context.isKnownTicketCalendar(value),
    countDays: (month, year, calendar) => context.ticketRestaurantWorkingDays(month, year, calendar),
    countNoTicketWeekdays: (month, year, calendar) => context.ticketRestaurantNoTicketWeekdays(month, year, calendar)
  };
}

const withDomain = loadTicketRestaurant(TicketCalendarDomain);
const fallback = loadTicketRestaurant(null);
assert.deepEqual(withDomain.getCalendars(), expectedCalendars);
assert.deepEqual(fallback.getCalendars(), expectedCalendars);

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

expectedCalendars.forEach(calendar => {
  assert.equal(withDomain.normalize(calendar), TicketCalendarDomain.normalizeTicketCalendar(calendar));
  assert.equal(fallback.normalize(calendar), TicketCalendarDomain.normalizeTicketCalendar(calendar));
  assert.equal(withDomain.isKnown(calendar), true);
  assert.equal(fallback.isKnown(calendar), true);
});
Object.entries(aliases).forEach(([alias, calendar]) => {
  assert.equal(withDomain.normalize(alias), calendar);
  assert.equal(fallback.normalize(alias), calendar);
  assert.equal(TicketCalendarDomain.normalizeTicketCalendar(alias), calendar);
  assert.equal(withDomain.isKnown(alias), true);
  assert.equal(fallback.isKnown(alias), true);
});
assert.equal(withDomain.isKnown("Calendario desconocido"), false);
assert.equal(fallback.isKnown("Calendario desconocido"), false);
assert.equal(TicketCalendarDomain.isKnownTicketCalendar("Calendario desconocido"), false);

const calendarMarks = [
  { calendar: "Servicios Centrales", date: "2026-06-01", noTicket: true },
  { calendar: "Servicios Centrales", date: "2026-06-06", noTicket: true }
];
withDomain.context.calendarMarks = calendarMarks;
fallback.context.calendarMarks = calendarMarks;
const periods = [
  { year: 2026, month: 2 },
  { year: 2026, month: 5 },
  { year: 2026, month: 6 }
];
expectedCalendars.forEach(calendar => periods.forEach(({ month, year }) => {
  const domainArgs = { calendarName: calendar, month, year, calendarMarks };
  const domainDays = TicketCalendarDomain.countTicketDaysForCalendar(domainArgs);
  const domainNoTicketWeekdays = TicketCalendarDomain.countNoTicketWeekdaysForCalendar(domainArgs);
  assert.equal(withDomain.countDays(month, year, calendar), domainDays);
  assert.equal(fallback.countDays(month, year, calendar), domainDays);
  assert.equal(withDomain.countNoTicketWeekdays(month, year, calendar), domainNoTicketWeekdays);
  assert.equal(fallback.countNoTicketWeekdays(month, year, calendar), domainNoTicketWeekdays);
}));

const juneWithoutMarks = TicketCalendarDomain.countTicketDaysForCalendar({ calendarName: "Servicios Centrales", year: 2026, month: 6 });
assert.equal(juneWithoutMarks, 22);
assert.equal(withDomain.countDays(6, 2026, "Servicios Centrales"), 21);
assert.equal(fallback.countDays(6, 2026, "Servicios Centrales"), 21);
assert.equal(withDomain.countNoTicketWeekdays(6, 2026, "Servicios Centrales"), 1);
assert.equal(fallback.countNoTicketWeekdays(6, 2026, "Servicios Centrales"), 1);

(async () => {
  const rejected = loadTicketRestaurant(TicketCalendarDomain);
  rejected.context.window.rrllDB = { loadTicketCalendars: async () => { throw new Error("IPC no disponible"); } };
  await rejected.context.hydrateTicketRestaurantCalendars();
  assert.deepEqual(rejected.getCalendars(), expectedCalendars);

  const invalid = loadTicketRestaurant(TicketCalendarDomain);
  invalid.context.window.rrllDB = { loadTicketCalendars: async () => ({ source: "sqlite", options: null }) };
  await invalid.context.hydrateTicketRestaurantCalendars();
  assert.deepEqual(invalid.getCalendars(), expectedCalendars);

  const hydrated = loadTicketRestaurant(TicketCalendarDomain);
  hydrated.context.window.rrllDB = {
    loadTicketCalendars: async () => ({
      source: "sqlite",
      options: {
        calendars: [{ id: 10, name: "Turno sábado", active: 1 }],
        aliases: [{ calendar_id: 10, alias: "sabado" }],
        weekdays: [{ calendar_id: 10, iso_weekday: 6 }],
        exclusions: [{ calendar_id: 10, date: "2026-06-06", no_ticket: 1 }],
        rules: []
      }
    })
  };
  await hydrated.context.hydrateTicketRestaurantCalendars();
  assert.deepEqual(hydrated.getCalendars(), ["Turno sábado"]);
  assert.equal(hydrated.normalize("sabado"), "Turno sábado");
  assert.equal(hydrated.isKnown("sabado"), true);
  assert.equal(hydrated.countDays(6, 2026, "sabado"), 3);
  assert.equal(hydrated.countNoTicketWeekdays(6, 2026, "sabado"), 1);
  console.log("ticket-restaurante calendar integration smoke test passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
