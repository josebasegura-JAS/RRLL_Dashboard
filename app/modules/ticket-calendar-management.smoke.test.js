const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync(require.resolve("./ticket-calendar-management.js"), "utf8");
const elements = new Map();
function element(id, initial = {}) {
  const value = { id, value: "", checked: false, textContent: "", className: "", innerHTML: "", reset() {}, ...initial };
  elements.set(id, value);
  return value;
}

element("ticketCalendarManagementBody");
element("ticketCalendarManagementNotice");
element("ticketCalendarManagementFormTitle");
element("ticketCalendarManagementName");
element("ticketCalendarManagementAliases");
element("ticketCalendarManagementObservations");
element("ticketCalendarManagementForm", { reset() {
  elements.get("ticketCalendarManagementName").value = "";
  elements.get("ticketCalendarManagementAliases").value = "";
  elements.get("ticketCalendarManagementObservations").value = "";
} });
for (let day = 1; day <= 7; day += 1) element(`ticketCalendarWeekday${day}`);

let savedPayload = null;
let restaurantHydrations = 0;
let restaurantRenders = 0;
const model = {
  source: "sqlite",
  options: {
    calendars: [{ id: 1, name: "Servicios Centrales", active: 1, observations: "Histórico" }],
    aliases: [{ calendar_id: 1, alias: "sscc" }],
    weekdays: [1, 2, 3, 4, 5].map(iso_weekday => ({ calendar_id: 1, iso_weekday })),
    exclusions: [],
    rules: []
  }
};
const context = {
  console,
  document: { getElementById: id => elements.get(id) || null },
  escapeHtml: value => String(value),
  hydrateTicketRestaurantCalendars: async () => { restaurantHydrations += 1; },
  renderTicketRestaurant: () => { restaurantRenders += 1; },
  window: {
    rrllDB: {
      loadTicketCalendars: async () => model,
      saveTicketCalendar: async payload => { savedPayload = payload; return { ok: true, id: 1 }; }
    }
  }
};
vm.createContext(context);
vm.runInContext(source, context, { filename: "ticket-calendar-management.js" });

(async () => {
  await context.window.hydrateTicketCalendarManagement();
  assert.match(elements.get("ticketCalendarManagementBody").innerHTML, /Servicios Centrales/);
  assert.match(elements.get("ticketCalendarManagementBody").innerHTML, /sscc/);
  assert.match(elements.get("ticketCalendarManagementBody").innerHTML, /L M X J V/);

  context.window.editTicketCalendar(1);
  assert.equal(elements.get("ticketCalendarManagementName").value, "Servicios Centrales");
  assert.equal(elements.get("ticketCalendarManagementObservations").value, "Histórico");
  assert.equal(elements.get("ticketCalendarWeekday5").checked, true);
  assert.equal(elements.get("ticketCalendarWeekday6").checked, false);

  elements.get("ticketCalendarManagementName").value = "Servicios Centrales editado";
  elements.get("ticketCalendarManagementAliases").value = "sscc, central";
  await context.window.saveTicketCalendarManagement({ preventDefault() {} });
  assert.equal(savedPayload.id, 1);
  assert.equal(savedPayload.name, "Servicios Centrales editado");
  assert.deepEqual([...savedPayload.weekdays], [1, 2, 3, 4, 5]);
  assert.equal(restaurantHydrations, 1);
  assert.equal(restaurantRenders, 1);
  assert.match(elements.get("ticketCalendarManagementNotice").textContent, /guardado correctamente/i);
  console.log("ticket-calendar-management smoke test passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
