const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const TicketCalendarDomain = require("./ticket-calendar-domain.js");

const source = fs.readFileSync(require.resolve("./ticket-restaurante.js"), "utf8");
const data = {
  rrll_ticket_restaurant_calendar_marks: [],
  rrll_ticket_restaurant_people: [
    { employeeNumber: "1", name: "Ana", surname1: "Sábado", calendar: "sabado" },
    { employeeNumber: "2", name: "Luis", surname1: "Liberado", calendar: "Liberados" }
  ],
  rrll_ticket_restaurant_absences: [
    { id: 1, employeeNumber: "1", from: "2026-06-13", to: "2026-06-13", reason: "vacaciones" },
    { id: 2, employeeNumber: "2", from: "2026-06-15", to: "2026-06-15", reason: "SIN" }
  ],
  rrll_ticket_restaurant_pending_discounts: {},
  rrll_ticket_restaurant_config: { pedido: "2404407", importe: "14,57" }
};
let sqliteLoads = 0;
let saves = 0;
const context = {
  console,
  load: (key, fallback) => key in data ? data[key] : fallback,
  save: () => { saves += 1; },
  window: {
    TicketCalendarDomain,
    localStorage: { getItem: () => null },
    rrllDB: {
      loadTicketCalendars: async () => {
        sqliteLoads += 1;
        return {
          source: "sqlite",
          options: {
            calendars: [
              { id: 10, name: "Turno sábado", active: 1 },
              { id: 20, name: "Liberados", active: 1 }
            ],
            aliases: [{ calendar_id: 10, alias: "sabado" }],
            weekdays: [{ calendar_id: 10, iso_weekday: 6 }, ...[1, 2, 3, 4, 5].map(iso_weekday => ({ calendar_id: 20, iso_weekday }))],
            exclusions: [{ calendar_id: 10, date: "2026-06-06", no_ticket: 1 }],
            rules: []
          }
        };
      }
    }
  }
};
vm.createContext(context);
vm.runInContext(source, context, { filename: "ticket-restaurante.js" });

(async () => {
  await context.hydrateTicketRestaurantCalendars();
  assert.equal(sqliteLoads, 1);
  assert.equal(context.ticketRestaurantWorkingDays(6, 2026, "sabado"), 3);
  assert.equal(context.ticketRestaurantNoTicketWeekdays(6, 2026, "sabado"), 1);

  const loadsBeforeMonthly = sqliteLoads;
  const savesBeforeMonthly = saves;
  const monthly = context.calculateTicketRestaurantMonthlyQuote({ year: 2026, month: 6 });
  assert.equal(sqliteLoads, loadsBeforeMonthly, "cotización mensual no debe volver a SQLite");
  assert.equal(saves, savesBeforeMonthly, "preview mensual no debe guardar");
  assert.equal(monthly.rows.find(row => row.employeeNumber === "1").ticketDays, 2, "el calendario configurable respeta sábado y exclusión noTicket");
  assert.equal(monthly.rows.find(row => row.employeeNumber === "2").ticketDays, 22, "Liberados + SIN conserva el derecho mensual");

  const loadsBeforeCompute = sqliteLoads;
  const savesBeforeCompute = saves;
  const compute = context.calculateTicketRestaurantCompute({ year: 2026, month: 7 });
  assert.equal(sqliteLoads, loadsBeforeCompute, "calculateTicketRestaurantCompute no debe volver a SQLite");
  assert.equal(saves, savesBeforeCompute, "preview de cómputo no debe guardar");
  assert.equal(compute.rows.find(row => row.person.employeeNumber === "1").finalTickets, 3, "la deuda pendiente usa el snapshot configurable");
  assert.equal(compute.rows.find(row => row.person.employeeNumber === "2").finalTickets, 23, "Liberados + SIN no genera descuento pendiente");

  console.log("ticket-restaurante runtime snapshot smoke test passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
