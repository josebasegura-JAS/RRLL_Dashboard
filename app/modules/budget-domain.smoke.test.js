const assert = require("assert");
const BudgetDomain = require("./budget-domain");

const context = {
  normalizeTicketCalendar: value => String(value || "").trim(),
  isKnownTicketCalendar: value => value === "Servicios Centrales",
  countTicketDaysForCalendar: (_calendar, year, month) => {
    if (month === 8) return 0;
    if (year === 2027) return month === 2 ? 18 : 8;
    return month === 2 ? 20 : 10;
  }
};
const legacyScenario = { year: 2026, ticket_amount: 10, absence_rate: 0.06, name: "Base", notes: "Hipótesis estable" };
const calendarGroup = { name: "Oficinas", calculation_type: "calendar_people", people_count: 2, ticket_calendar: "Servicios Centrales", absence_rate: 0.06 };

assert.equal(BudgetDomain.normalizeBudgetNumber("14,57"), 14.57);
assert.equal(BudgetDomain.normalizeBudgetRate(6), 0.06);
assert.equal(BudgetDomain.normalizeBudgetRate(0.06), 0.06);
assert.equal(BudgetDomain.normalizeBudgetRate("6%"), 0.06);
assert.equal(BudgetDomain.resolveBudgetSimulationYear(legacyScenario), 2026);
assert.equal(BudgetDomain.resolveBudgetSimulationYear(legacyScenario, 2027), 2027);
assert.equal(BudgetDomain.calculateBudgetManualItemYear({ monthly_amount: 100, annual_amount: 900 }), 900);
assert.equal(BudgetDomain.calculateBudgetManualItemMonth({ monthly_amount: 100, annual_amount: 900 }, 1), 75);
assert.equal(BudgetDomain.calculateBudgetManualItemYear({ monthly_amount: 100 }), 1200);
assert.equal(BudgetDomain.calculateBudgetManualItemsYear([{ annual_amount: 900 }, { monthly_amount: 100 }]), 2100);

// El campo year antiguo sigue siendo el fallback compatible cuando no se informa un año de simulación.
// El absentismo general histórico del escenario ya no interviene: únicamente se aplica el del grupo.
assert.equal(BudgetDomain.calculateBudgetTicketGroupMonth({ ...calendarGroup, absence_rate: undefined }, legacyScenario, 1, context), 200);
assert.equal(BudgetDomain.calculateBudgetTicketGroupMonth(calendarGroup, legacyScenario, 1, context), 188);
assert.equal(BudgetDomain.calculateBudgetTicketGroupYear(calendarGroup, legacyScenario, context).totalTicket, 2256);
assert.equal(BudgetDomain.calculateBudgetTicketGroupMonth({ ...calendarGroup, absence_rate: 0.1 }, legacyScenario, 1, context), 180);
assert.equal(BudgetDomain.calculateBudgetTicketGroupMonth({ ...calendarGroup, ticket_amount: 15 }, legacyScenario, 1, context), 282);
assert.equal(BudgetDomain.calculateBudgetTicketGroupMonth({ calculation_type: "manual_tickets", manual_tickets: 50 }, legacyScenario, 1, context), 500);
assert.equal(BudgetDomain.calculateBudgetTicketGroupMonth({ calculation_type: "manual_amount", manual_monthly_amount: 650 }, legacyScenario, 1, context), 650);

// El mismo escenario se simula en otro año sin duplicarlo y agosto queda explícitamente a cero por calendario.
const total2026 = BudgetDomain.calculateBudgetScenarioYear({ manualItems: [{ annual_amount: 1200 }], ticketGroups: [calendarGroup], scenario: legacyScenario, context, simulationYear: 2026 });
const total2027 = BudgetDomain.calculateBudgetScenarioYear({ manualItems: [{ annual_amount: 1200 }], ticketGroups: [calendarGroup], scenario: legacyScenario, context, simulationYear: 2027 });
assert.equal(total2026.simulationYear, 2026);
assert.equal(total2027.simulationYear, 2027);
assert.equal(total2026.totalManual, 1200);
assert.equal(total2026.totalTicket, 2256);
assert.equal(total2026.totalScenario, 3456);
assert.equal(total2027.totalTicket, 1842.4);
assert.notEqual(total2026.totalTicket, total2027.totalTicket);
assert.deepEqual({ manual: total2026.byMonth[0].totalManual, ticket: total2026.byMonth[0].totalTicket, total: total2026.byMonth[0].totalScenario }, { manual: 100, ticket: 188, total: 288 });
assert.deepEqual({ month: total2026.byMonth[7].month, ticket: total2026.byMonth[7].totalTicket }, { month: 8, ticket: 0 });

// Los datos exportables proceden del mismo cálculo puro y conservan año, resumen, meses y detalle.
const exportable = BudgetDomain.buildBudgetScenarioExportData({ manualItems: [{ concept: "Formación", category: "Desarrollo", monthly_amount: 100 }], ticketGroups: [calendarGroup], scenario: legacyScenario, context, simulationYear: 2027 });
assert.equal(exportable.scenario.name, "Base");
assert.equal(exportable.scenario.simulationYear, 2027);
assert.equal(exportable.scenario.absenceRate, undefined);
assert.equal(exportable.summary.totalScenario, 3042.4);
assert.equal(exportable.monthly[7].totalTicket, 0);
assert.deepEqual(exportable.manualItems[0], { concept: "Formación", type: "Desarrollo", monthlyAmount: 100, annualAmount: undefined, totalCalculated: 1200 });
assert.equal(exportable.ticketGroups[0].totalCalculated, 1842.4);

console.log("budget-domain smoke test passed");
