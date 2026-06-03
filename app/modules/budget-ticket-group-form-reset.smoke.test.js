const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const budgetSource = fs.readFileSync(require.resolve("./budget.js"), "utf8");
const formClasses = new Set(["budget-form-hidden"]);
const fieldNames = ["Id", "Name", "Type", "People", "Calendar", "Absence", "Amount", "ManualTickets", "AnnualTickets", "ManualAmount", "Notes"];
const elements = Object.fromEntries(fieldNames.map(name => [`budgetTicketGroup${name}`, { value: "", disabled: false }]));
elements.budgetTicketGroupForm = { classList: { add: name => formClasses.add(name), remove: name => formClasses.delete(name) } };
const visibilityLog = new Map();
const visibilityFields = ["people", "calendar", "absence", "ticket-amount", "manual-tickets", "annual-tickets", "manual-amount"].map(name => ({ dataset: { budgetTicketField: name }, classList: { toggle(_className, hidden) { visibilityLog.set(name, !hidden); } } }));
const controls = fieldNames.map(name => elements[`budgetTicketGroup${name}`]);
const savedGroups = [];
const deletedGroups = [];
const context = {
  alert(message) { throw new Error(message); },
  confirm: () => true,
  console,
  window: { rrllDB: {
    async deleteBudgetTicketGroup(id) { deletedGroups.push(id); return { ok: true }; },
    async saveBudgetTicketGroup(group) { savedGroups.push(group); return { ok: true, id: "new-group" }; }
  } },
  document: {
    getElementById: id => elements[id] || null,
    querySelectorAll(selector) { return selector === "[data-budget-ticket-field]" ? visibilityFields : controls; }
  }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(require.resolve("./budget-domain"), "utf8"), context);
vm.runInContext(budgetSource, context);
vm.runInContext("populateBudgetTicketCalendars = async selected => { document.getElementById('budgetTicketGroupCalendar').value = selected || ''; }; rrllBudgetCalendarContext = async () => ({ isKnownTicketCalendar: () => true }); refreshBudgetModule = async () => {}; rrllBudgetSelectedScenarioId = 'scenario';", context);

(async () => {
  const oldGroup = { id: "deleted-group", name: "Grupo anterior", calculation_type: "manual_amount", people_count: 7, ticket_calendar: "Calendario anterior", absence_rate: 0.25, ticket_amount: 12, manual_tickets: 15, manual_monthly_amount: 300, notes: "Datos residuales" };
  await context.openBudgetTicketGroupForm(oldGroup);
  assert.equal(elements.budgetTicketGroupId.value, "deleted-group");
  assert.equal(elements.budgetTicketGroupName.value, "Grupo anterior");

  controls.forEach(control => { control.disabled = true; });
  await context.deleteBudgetTicketGroup("deleted-group");
  assert.deepEqual(deletedGroups, ["deleted-group"]);
  assert.equal(formClasses.has("budget-form-hidden"), true);
  assert.deepEqual(fieldNames.map(name => elements[`budgetTicketGroup${name}`].value), ["", "", "calendar_people", 0, "", 0, "", "", "", "", ""]);
  assert.equal(controls.every(control => control.disabled === false), true);

  await context.openBudgetTicketGroupForm();
  assert.equal(formClasses.has("budget-form-hidden"), false);
  assert.equal(elements.budgetTicketGroupId.value, "");
  assert.equal(elements.budgetTicketGroupType.value, "calendar_people");

  const newGroups = [
    { name: "Grupo calendario", type: "calendar_people", calendar: "General" },
    { name: "Grupo tickets", type: "manual_tickets", manualTickets: "15" },
    { name: "Grupo importe", type: "manual_amount", manualAmount: "450" },
    { name: "Grupo anual", type: "annual_tickets", annualTickets: "240" }
  ];
  for (const group of newGroups) {
    await context.openBudgetTicketGroupForm();
    elements.budgetTicketGroupName.value = group.name;
    elements.budgetTicketGroupType.value = group.type;
    elements.budgetTicketGroupCalendar.value = group.calendar || "";
    elements.budgetTicketGroupManualTickets.value = group.manualTickets || "";
    elements.budgetTicketGroupAnnualTickets.value = group.annualTickets || "";
    elements.budgetTicketGroupManualAmount.value = group.manualAmount || "";
    await context.saveBudgetTicketGroupFromForm({ preventDefault() {} });
  }
  assert.equal(savedGroups.length, 4);
  assert.deepEqual(savedGroups.map(group => group.id), [undefined, undefined, undefined, undefined]);
  assert.deepEqual(savedGroups.map(group => group.calculation_type), ["calendar_people", "manual_tickets", "manual_amount", "annual_tickets"]);
  assert.equal(savedGroups[2].manual_monthly_amount, 450);
  assert.equal(savedGroups[3].annual_tickets, 240);
  elements.budgetTicketGroupType.value = "annual_tickets";
  context.renderBudgetTicketGroupFieldVisibility();
  assert.equal(visibilityLog.get("annual-tickets"), true);
  assert.equal(visibilityLog.get("calendar"), false);
  assert.equal(visibilityLog.get("people"), false);
  assert.equal(visibilityLog.get("absence"), false);
  assert.equal(visibilityLog.get("manual-tickets"), false);
  assert.equal(visibilityLog.get("manual-amount"), false);
  console.log("budget ticket group form reset smoke test passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
