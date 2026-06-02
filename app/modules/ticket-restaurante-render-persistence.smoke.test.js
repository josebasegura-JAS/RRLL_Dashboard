const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync(require.resolve("./ticket-restaurante.js"), "utf8");
let ledger = {};
const saves = [];
const people = [{ employeeNumber: "001", name: "Ana", surname1: "Prueba", calendar: "Servicios Centrales" }];
const context = {
  console,
  window: {},
  load: (key, fallback) => {
    if (key === "rrll_ticket_restaurant_pending_discounts") return ledger;
    if (key === "rrll_ticket_restaurant_people") return people;
    if (key === "rrll_ticket_restaurant_absences" || key === "rrll_ticket_restaurant_calendar_marks") return [];
    return fallback;
  },
  save: (key, value) => { saves.push({ key, value }); if (key === "rrll_ticket_restaurant_pending_discounts") ledger = value; },
  document: {
    getElementById: () => null,
    querySelectorAll: () => [],
    querySelector: () => null
  }
};
vm.createContext(context);
vm.runInContext(source, context, { filename: "ticket-restaurante.js" });

// A representative compute remains functionally equivalent and does not persist its preview ledger.
const representative = context.calculateTicketRestaurantCompute({ month: 6, year: 2026 });
assert.equal(representative.rows.length, 1);
assert.equal(representative.rows[0].theoretical, 22);
assert.equal(representative.rows[0].finalTickets, 22);
assert.equal(saves.length, 0);

// The ensuring facade is pure in preview mode and only persists stable ledger changes.
context.buildTicketRestaurantPendingDiscountLedgerFromAbsences = () => ({ employee: { pendingDebt: 1 } });
context.ensureTicketRestaurantPendingDiscountLedgerFromAbsences({ persist: false });
assert.equal(saves.length, 0);
context.ensureTicketRestaurantPendingDiscountLedgerFromAbsences({ persist: true });
assert.equal(saves.length, 1);
context.ensureTicketRestaurantPendingDiscountLedgerFromAbsences({ persist: true });
assert.equal(saves.length, 1);

// Rendering a non-compute area must not enter compute controls or any ledger save.
let computeControlRenders = 0;
context.renderTicketRestaurantCalendarSelector = () => {};
context.renderTicketRestaurantCalendar = () => {};
context.renderTicketRestaurantPeople = () => {};
context.renderTicketRestaurantAbsences = () => {};
context.renderTicketRestaurantConfig = () => {};
context.renderTicketRestaurantComputeControls = () => { computeControlRenders += 1; };
vm.runInContext('ticketRestaurantActiveArea = "people"; renderTicketRestaurant();', context);
assert.equal(computeControlRenders, 0);
assert.equal(saves.length, 1);

// The calculate path explicitly requests a pure ledger snapshot and no longer saves it.
assert.match(source, /ensureTicketRestaurantPendingDiscountLedgerFromAbsences\(\{ persist: false, absences, people, previousLedger \}\)/);
const calculateBody = source.slice(source.indexOf("function calculateTicketRestaurantCompute"), source.indexOf("function setTicketRestaurantComputeSort"));
assert.doesNotMatch(calculateBody, /saveTicketRestaurantPendingDiscountLedger\(/);

console.log("ticket-restaurante render persistence smoke test passed");
