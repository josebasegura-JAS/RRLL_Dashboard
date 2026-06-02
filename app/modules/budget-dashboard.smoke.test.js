const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const BudgetDomain = require("./budget-domain");

const budgetResult = BudgetDomain.calculateBudgetScenarioYear({
  scenario: { year: 2026 },
  simulationYear: 2026,
  manualItems: [
    { concept: "Curso", category: "Formación", monthly_amount: 100 },
    { concept: "Uniformes", category: "Vestuario", monthly_amount: 50 }
  ]
});
const comparison = {
  scenario: "Base",
  ...BudgetDomain.buildBudgetActualComparisonData({
    budgetResult,
    cutoffMonth: 2,
    actuals: [
      { year: 2026, month: 1, block: "Formación", concept: "Curso", amount: 250 },
      { year: 2026, month: 2, block: "Vestuario", concept: "Uniformes", amount: 10 }
    ]
  })
};
const dashboard = BudgetDomain.buildBudgetActualDashboardData(comparison);
assert.deepEqual(dashboard.monthly, [
  { month: 1, budget: 150, actual: 250, difference: 100 },
  { month: 2, budget: 150, actual: 10, difference: -140 }
]);
assert.equal(dashboard.blocks.length, 7);
assert.equal(dashboard.blocks.find(row => row.block === "Formación").difference, 50);
assert.equal(dashboard.blocks.find(row => row.block === "Vestuario").difference, -90);
assert.deepEqual(dashboard.concepts.map(row => row.concept), ["Uniformes", "Curso"]);
assert.equal(dashboard.summary.actualAnnualBudgetPercent, 260 / 1800);

const emptyComparison = BudgetDomain.buildBudgetActualComparisonData({ budgetResult, cutoffMonth: 1, actuals: [] });
const emptyDashboard = BudgetDomain.buildBudgetActualDashboardData(emptyComparison);
assert.deepEqual(emptyDashboard.monthly, [{ month: 1, budget: 150, actual: 0, difference: -150 }]);
assert.equal(emptyDashboard.summary.actualAccumulated, 0);
const decemberDashboard = BudgetDomain.buildBudgetActualDashboardData(BudgetDomain.buildBudgetActualComparisonData({ budgetResult, cutoffMonth: 12, actuals: [] }));
assert.equal(decemberDashboard.monthly.length, 12);

const budgetSource = fs.readFileSync(require.resolve("./budget"), "utf8");
assert.match(budgetSource, /async function openBudgetActualDashboard\(\).*renderBudgetActualDashboard/);
assert.doesNotMatch(budgetSource.slice(budgetSource.indexOf("async function refreshBudgetModule"), budgetSource.indexOf("async function renderBudgetScenarios")), /renderBudgetActualDashboard/);
const context = { console, window: {}, document: {}, alert: message => { throw new Error(message); }, openPrintPreviewWithHtml: html => { context.printHtml = html; } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(require.resolve("./budget-domain"), "utf8"), context);
vm.runInContext(budgetSource, context);
vm.runInContext(`rrllBudgetActualDashboardData = ${JSON.stringify(dashboard)}`, context);
context.printBudgetActualDashboard();
assert.match(context.printHtml, /<h1>Dashboard Presupuesto vs Real<\/h1>/);
assert.match(context.printHtml, /Filtros aplicados:/);
assert.match(context.printHtml, /<svg[^>]+role="img"[^>]+aria-label="Evolución mensual/);
assert.match(context.printHtml, /aria-label="Desviación acumulada por bloque"/);
assert.match(context.printHtml, /Mayores desviaciones por concepto/);
assert.doesNotMatch(context.printHtml, /<canvas/i);
console.log("budget dashboard smoke test passed");
