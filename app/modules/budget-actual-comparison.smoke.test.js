const assert = require("assert");
const BudgetDomain = require("./budget-domain");

const budgetResult = BudgetDomain.calculateBudgetScenarioYear({
  scenario: { year: 2026, ticket_amount: 10 },
  simulationYear: 2026,
  manualItems: [
    { concept: "Curso", category: "Formación", monthly_amount: 100 },
    { concept: "Partida sin real", category: "Vestuario", monthly_amount: 50 }
  ],
  ticketGroups: [{ name: "Oficinas", calculation_type: "manual_amount", manual_monthly_amount: 25 }]
});
const actuals = [
  { id: "a", year: 2026, month: 1, block: "Formación", concept: "Curso", amount: "1.250,50", notes: "enero" },
  { id: "b", year: 2026, month: 2, block: "Formación", concept: "Curso", amount: 49.5 },
  { id: "c", year: 2026, month: 1, block: "Otros", concept: "No presupuestado", amount: 25 },
  { id: "d", year: 2026, month: 3, block: "Formación", concept: "Fuera de corte", amount: 900 },
  { id: "e", year: 2025, month: 1, block: "Formación", concept: "Otro año", amount: 800 }
];

assert.deepEqual(BudgetDomain.normalizeBudgetActual(actuals[0]), { id: "a", year: 2026, month: 1, block: "Formación", concept: "Curso", amount: 1250.5, notes: "enero" });
const january = BudgetDomain.buildBudgetActualComparisonData({ budgetResult, actuals, cutoffMonth: 1 });
assert.equal(january.summary.annualBudget, 2100);
assert.equal(january.summary.budgetAccumulated, 175);
assert.equal(january.summary.actualAccumulated, 1275.5);
assert.equal(january.summary.difference, 1100.5);
assert.equal(january.summary.differencePercent, 1100.5 / 175);
assert.equal(january.actuals.length, 2);
assert.deepEqual(january.blocks.find(row => row.block === "Formación"), { block: "Formación", budget: 100, actual: 1250.5, budgetAccumulated: 100, actualAccumulated: 1250.5, difference: 1150.5, differencePercent: 11.505 });
assert.equal(january.concepts.find(row => row.concept === "No presupuestado").budgetAccumulated, 0);
assert.equal(january.concepts.find(row => row.concept === "Partida sin real").actualAccumulated, 0);

const february = BudgetDomain.buildBudgetActualComparisonData({ budgetResult, actuals, cutoffMonth: 2 });
assert.equal(february.summary.actualAccumulated, 1325);
assert.equal(february.summary.budgetAccumulated, 350);
assert.equal(february.summary.difference, 975);
assert.equal(february.blocks.find(row => row.block === "Formación").actualAccumulated, 1300);

const negative = BudgetDomain.buildBudgetActualComparisonData({ budgetResult, actuals: [], cutoffMonth: 12 });
assert.equal(negative.summary.difference, -2100);
assert.equal(negative.summary.differencePercent, -1);

const zeroBudget = BudgetDomain.buildBudgetActualComparisonData({ budgetResult: BudgetDomain.calculateBudgetScenarioYear({ scenario: { year: 2026 }, simulationYear: 2026 }), actuals: [{ year: 2026, month: 1, block: "Otros", concept: "Imprevisto", amount: 20 }], cutoffMonth: 1 });
assert.equal(zeroBudget.summary.difference, 20);
assert.equal(zeroBudget.summary.differencePercent, null);
assert.equal(zeroBudget.concepts[0].differencePercent, null);

console.log("budget actual comparison smoke test passed");
