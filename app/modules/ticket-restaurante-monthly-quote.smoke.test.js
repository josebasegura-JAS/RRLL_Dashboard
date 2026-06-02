const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync(require.resolve("./ticket-restaurante.js"), "utf8");
const dashboard = fs.readFileSync(require.resolve("../dashboard.html"), "utf8");
assert.match(dashboard, /data-ticket-monthly-quote-sort="calendar"/);
assert.match(dashboard, /id="ticketMonthlyQuoteFilterCalendar"/);
assert.match(source, /ticketRestaurantMonthlyQuoteRowsCache/);
assert.match(source, /calendar: hasCalendar \? normalizedCalendar : \(person\.calendar \|\| "Sin calendario"\)/);

const body = { innerHTML: "" };
const period = { textContent: "", insertAdjacentHTML() {} };
const panel = { hidden: true };
const elements = new Map([
  ["ticketRestaurantMonthlyQuoteBody", body],
  ["ticketRestaurantMonthlyQuotePeriod", period],
  ["ticketRestaurantMonthlyQuotePanel", panel]
]);
const context = {
  console,
  window: {},
  load: (_key, fallback) => fallback,
  save: () => { throw new Error("sorting must not save"); },
  escapeHtml: value => String(value),
  document: {
    getElementById: id => elements.get(id) || null,
    querySelectorAll: () => [],
    querySelector: () => null
  }
};
vm.createContext(context);
vm.runInContext(source, context, { filename: "ticket-restaurante.js" });
const rows = [
  { employeeNumber: "10", fullName: "Zeta", calendar: "Servicios Centrales", ticketDays: 2, ticketAmount: "9,50" },
  { employeeNumber: "2", fullName: "Álvaro", calendar: "Ingeniería Ariz", ticketDays: 12, ticketAmount: "14,57" },
  { employeeNumber: "", fullName: "Vacío", calendar: "", ticketDays: 1, ticketAmount: "1,00" }
];
function sorted(key, direction) {
  context.__rows = rows;
  return vm.runInContext(`ticketRestaurantMonthlyQuoteSortKey = ${JSON.stringify(key)}; ticketRestaurantMonthlyQuoteSortDirection = ${JSON.stringify(direction)}; sortTicketRestaurantMonthlyQuoteRows(__rows).map(row => row.employeeNumber || "empty")`, context);
}
assert.deepEqual([...sorted("calendar", "asc")], ["2", "10", "empty"]);
assert.deepEqual([...sorted("calendar", "desc")], ["10", "2", "empty"]);
assert.deepEqual([...sorted("employee", "asc")], ["2", "10", "empty"]);
assert.deepEqual([...sorted("name", "asc")], ["2", "empty", "10"]);
assert.deepEqual([...sorted("amount", "asc")], ["empty", "10", "2"]);
assert.equal(rows.reduce((sum, row) => sum + row.ticketDays, 0), sorted("days", "desc") && 15);

context.__calc = { month: 6, year: 2026, rows };
vm.runInContext(`ticketRestaurantLastVisibleMonthlyQuote = __calc;
  calculateTicketRestaurantMonthlyQuote = () => { throw new Error("sorting must not recalculate"); };
  renderTicketContributionMonthSelector = () => {};
  applyTicketEmployeeNameColumnLayout = () => {};
  setTicketRestaurantMonthlyQuoteSort("calendar");`, context);
assert.match(body.innerHTML, /Ingeniería Ariz/);
assert.match(body.innerHTML, /Servicios Centrales/);
assert.equal(panel.hidden, false);
console.log("ticket-restaurante monthly quote smoke test passed");
