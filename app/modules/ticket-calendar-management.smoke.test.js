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
element("ticketCalendarManagementShowInactive");
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
let cacheInvalidations = 0;
let restaurantHydrateOptions = null;
const lifecycleCalls = [];
const model = {
  source: "sqlite",
  options: {
    calendars: [{ id: 1, name: "Servicios Centrales", active: 1, observations: "Histórico" }, { id: 2, name: "Turno antiguo", active: 0, observations: "" }],
    aliases: [{ calendar_id: 1, alias: "sscc" }],
    weekdays: [1, 2, 3, 4, 5].map(iso_weekday => ({ calendar_id: 1, iso_weekday })).concat([{ calendar_id: 2, iso_weekday: 6 }]),
    exclusions: [],
    rules: []
  }
};
const context = {
  console,
  document: { getElementById: id => elements.get(id) || null },
  escapeHtml: value => String(value),
  hydrateTicketRestaurantCalendars: async options => { restaurantHydrations += 1; restaurantHydrateOptions = options; },
  renderTicketRestaurant: () => { restaurantRenders += 1; },
  window: {
    invalidateTicketCalendarModelCache: () => { cacheInvalidations += 1; },
    rrllDB: {
      loadTicketCalendars: async () => model,
      saveTicketCalendar: async payload => { savedPayload = payload; return { ok: true, id: 1 }; },
      disableTicketCalendar: async id => { lifecycleCalls.push(["disable", id]); return { ok: true, id }; },
      enableTicketCalendar: async id => { lifecycleCalls.push(["enable", id]); return { ok: true, id }; },
      deleteTicketCalendar: async id => { lifecycleCalls.push(["delete", id]); return { ok: true, id }; }
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
  assert.doesNotMatch(elements.get("ticketCalendarManagementBody").innerHTML, /Turno antiguo/);
  elements.get("ticketCalendarManagementShowInactive").checked = true;
  context.window.renderTicketCalendarManagement();
  assert.match(elements.get("ticketCalendarManagementBody").innerHTML, /Turno antiguo/);
  assert.match(elements.get("ticketCalendarManagementBody").innerHTML, /Inactivo/);

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
  assert.equal(cacheInvalidations, 1);
  assert.equal(restaurantHydrateOptions.force, true);
  assert.equal(restaurantRenders, 1);
  assert.match(elements.get("ticketCalendarManagementNotice").textContent, /guardado correctamente/i);
  await context.executeTicketCalendarManagementAction("disableTicketCalendar", 2, "desactivado");
  await context.executeTicketCalendarManagementAction("enableTicketCalendar", 2, "reactivado");
  await context.executeTicketCalendarManagementAction("deleteTicketCalendar", 2, "borrado");
  assert.deepEqual(lifecycleCalls, [["disable", 2], ["enable", 2], ["delete", 2]]);
  console.log("ticket-calendar-management smoke test passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
