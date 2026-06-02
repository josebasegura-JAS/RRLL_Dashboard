const assert = require("assert");
const BudgetDomain = require("./budget-domain");

const context = {
  normalizeTicketCalendar: value => String(value || "").trim(),
  isKnownTicketCalendar: value => value === "Servicios Centrales",
  countTicketDaysForCalendar: (_calendar, _year, month) => month === 2 ? 20 : 10
};
const scenario = { year: 2026, ticket_amount: 10, absence_rate: 0.06 };

assert.equal(BudgetDomain.normalizeBudgetNumber("14,57"), 14.57);
assert.equal(BudgetDomain.normalizeBudgetRate(6), 0.06);
assert.equal(BudgetDomain.normalizeBudgetRate(0.06), 0.06);
assert.equal(BudgetDomain.normalizeBudgetRate("6%"), 0.06);
assert.equal(BudgetDomain.calculateBudgetManualItemYear({ monthly_amount: 100, annual_amount: 900 }), 900);
assert.equal(BudgetDomain.calculateBudgetManualItemMonth({ monthly_amount: 100, annual_amount: 900 }, 1), 75);
assert.equal(BudgetDomain.calculateBudgetManualItemYear({ monthly_amount: 100 }), 1200);
assert.equal(BudgetDomain.calculateBudgetManualItemsYear([{ annual_amount: 900 }, { monthly_amount: 100 }]), 2100);
const calendarGroup = { name: "Oficinas", calculation_type: "calendar_people", people_count: 2, ticket_calendar: "Servicios Centrales" };
assert.equal(BudgetDomain.calculateBudgetTicketGroupMonth(calendarGroup, scenario, 1, context), 188);
assert.equal(BudgetDomain.calculateBudgetTicketGroupYear(calendarGroup, scenario, context).totalTicket, 2444);
assert.equal(BudgetDomain.calculateBudgetTicketGroupMonth({ ...calendarGroup, absence_rate: 0.1 }, scenario, 1, context), 180);
assert.equal(BudgetDomain.calculateBudgetTicketGroupMonth({ ...calendarGroup, ticket_amount: 15 }, scenario, 1, context), 282);
assert.equal(BudgetDomain.calculateBudgetTicketGroupMonth({ calculation_type: "manual_tickets", manual_tickets: 50 }, scenario, 1, context), 500);
assert.equal(BudgetDomain.calculateBudgetTicketGroupMonth({ calculation_type: "manual_amount", manual_monthly_amount: 650 }, scenario, 1, context), 650);
const total = BudgetDomain.calculateBudgetScenarioYear({ manualItems: [{ annual_amount: 1200 }], ticketGroups: [calendarGroup], scenario, context });
assert.equal(total.totalManual, 1200);
assert.equal(total.totalTicket, 2444);
assert.equal(total.totalScenario, 3644);
assert.deepEqual({ manual: total.byMonth[0].totalManual, ticket: total.byMonth[0].totalTicket, total: total.byMonth[0].totalScenario }, { manual: 100, ticket: 188, total: 288 });
console.log("budget-domain smoke test passed");
