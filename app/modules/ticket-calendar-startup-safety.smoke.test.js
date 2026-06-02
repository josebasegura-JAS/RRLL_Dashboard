const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const TicketCalendarDomain = require("./ticket-calendar-domain.js");
const { createTicketCalendarAdapter } = require("./ticket-calendar-adapter.js");

const fallbackNames = ["Servicios Centrales", "Ingeniería Ariz", "Instalaciones Sopela", "Liberados"];
function names(model) { return model.calendars.map(calendar => calendar.name); }

const warnings = [];
const emptyModel = createTicketCalendarAdapter({
  repository: { getTicketCalendars: () => [], getTicketCalendarAliases: () => [], getTicketCalendarWeekdays: () => [], getTicketCalendarExclusions: () => [], getTicketCalendarRules: () => [] },
  domain: TicketCalendarDomain,
  warn: (...args) => warnings.push(args)
}).readTicketCalendarModel();
assert.equal(emptyModel.source, "fallback");
assert.deepEqual(names(emptyModel), fallbackNames);

const failingModel = createTicketCalendarAdapter({
  repository: { getTicketCalendars() { throw new Error("SQLite rota"); } },
  domain: TicketCalendarDomain,
  warn: (...args) => warnings.push(args)
}).readTicketCalendarModel();
assert.equal(failingModel.source, "fallback");
assert.deepEqual(names(failingModel), fallbackNames);

const source = fs.readFileSync(path.join(__dirname, "ticket-calendar-management.js"), "utf8");
const elements = new Map([["ticketCalendarManagementBody", { innerHTML: "" }], ["ticketCalendarManagementNotice", { textContent: "", className: "" }]]);
const context = {
  console: { warn: (...args) => warnings.push(args) },
  document: { getElementById: id => elements.get(id) || null },
  escapeHtml: value => String(value),
  window: { rrllDB: { loadTicketCalendars: async () => { throw new Error("IPC no disponible"); }, saveTicketCalendar: async () => { throw new Error("guardado no disponible"); } } }
};
vm.createContext(context);
vm.runInContext(source, context, { filename: "ticket-calendar-management.js" });

(async () => {
  await context.window.hydrateTicketCalendarManagement();
  assert.match(elements.get("ticketCalendarManagementBody").innerHTML, /No hay calendarios disponibles/);
  assert.match(elements.get("ticketCalendarManagementNotice").textContent, /fallback/i);
  assert.doesNotThrow(() => context.window.editTicketCalendar(999));
  await context.window.saveTicketCalendarManagement({ preventDefault() {} });
  assert.match(elements.get("ticketCalendarManagementNotice").textContent, /guardado no disponible/i);

  context.window.rrllDB.loadTicketCalendars = async () => ({ source: "fallback", options: null, calendars: [] });
  await context.window.hydrateTicketCalendarManagement();
  assert.match(elements.get("ticketCalendarManagementBody").innerHTML, /No hay calendarios disponibles/);
  console.log("ticket-calendar-startup-safety smoke test passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
