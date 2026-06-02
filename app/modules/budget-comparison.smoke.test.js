const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const BudgetDomain = require("./budget-domain.js");

function exportData(name, simulationYear, totalManual, totalTicket, manualItems = [], ticketGroups = []) {
  return { scenario: { name, simulationYear }, summary: { totalManual, totalTicket, totalScenario: totalManual + totalTicket }, manualItems, ticketGroups };
}

const base = exportData("Base", 2030, 1200, 600, [{ concept: "Formación", totalCalculated: 1200 }], [{ name: "Oficinas", calendar: "General", totalCalculated: 600 }]);
const same = BudgetDomain.buildBudgetComparisonData({ scenarioA: base, scenarioB: base });
assert.equal(same.summary.difference, 0);
assert.equal(same.summary.differencePercent, 0);
assert.equal(same.blocks.every(block => block.difference === 0), true);

const optimistic = exportData("Optimista", 2030, 1500, 480, [{ concept: "Formación", totalCalculated: 1000 }, { concept: "Eventos", totalCalculated: 500 }], [{ name: "Oficinas", calendar: "General", totalCalculated: 400 }, { name: "Fábrica", calendar: "Turnos", totalCalculated: 80 }]);
const comparison = BudgetDomain.buildBudgetComparisonData({ scenarioA: base, scenarioB: optimistic });
assert.equal(comparison.summary.scenarioA, 1800);
assert.equal(comparison.summary.scenarioB, 1980);
assert.equal(comparison.summary.difference, 180);
assert.equal(comparison.summary.differencePercent, 0.1);
assert.equal(comparison.manualItems.find(item => item.name === "Formación").difference, -200);
assert.equal(comparison.manualItems.find(item => item.name === "Eventos").scenarioA, 0);
assert.equal(comparison.manualItems.find(item => item.name === "Eventos").difference, 500);
assert.equal(comparison.manualItems.find(item => item.name === "Eventos").differencePercent, null);
assert.equal(comparison.ticketGroups.find(item => item.name === "Fábrica").scenarioA, 0);
assert.equal(comparison.ticketGroups.find(item => item.name === "Fábrica").difference, 80);
assert.equal(comparison.ticketGroups.find(item => item.name === "Fábrica").calendar, "Turnos");
assert.throws(() => BudgetDomain.buildBudgetComparisonData({ scenarioA: base, scenarioB: { ...optimistic, scenario: { name: "Otro año", simulationYear: 2031 } } }), /mismo año/);

const elements = Object.fromEntries([
  "budgetComparisonScenarioA", "budgetComparisonScenarioB", "budgetComparisonYear", "budgetComparisonTitle", "budgetComparisonTotalA", "budgetComparisonTotalB", "budgetComparisonDifference", "budgetComparisonPercent", "budgetComparisonBlockRows", "budgetComparisonManualRows", "budgetComparisonTicketRows"
].map(id => [id, { value: "", textContent: "", innerHTML: "" }]));
elements.budgetComparisonScenarioA.value = "base";
elements.budgetComparisonScenarioB.value = "optimistic";
elements.budgetComparisonYear.value = "2030";
elements.budgetComparisonResult = { classList: { add() {}, remove() {} } };
const records = {
  base: { manual: [{ concept: "Formación", annual_amount: 1200 }], ticket: [{ name: "Oficinas", calculation_type: "manual_amount", manual_monthly_amount: 50 }] },
  optimistic: { manual: [{ concept: "Eventos", annual_amount: 1500 }], ticket: [{ name: "Fábrica", ticket_calendar: "Turnos", calculation_type: "manual_amount", manual_monthly_amount: 40 }] }
};
const context = {
  console,
  window: { rrllDB: {
    loadBudgetManualItems: async id => records[id].manual,
    loadBudgetTicketGroups: async id => records[id].ticket
  } },
  document: { getElementById: id => elements[id] || null },
  alert: message => { throw new Error(message); },
  exportExcelData: payload => { context.excel = payload; },
  openPrintPreviewWithHtml: html => { context.printHtml = html; }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(require.resolve("./budget-domain.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(require.resolve("./budget.js"), "utf8"), context);
vm.runInContext('rrllBudgetScenarios = [{ id: "base", name: "Base", year: 2026 }, { id: "optimistic", name: "Optimista", year: 2027 }];', context);

(async () => {
  await context.compareBudgetScenarios();
  assert.equal(elements.budgetComparisonTitle.textContent, "Base vs Optimista · Año 2030");
  assert.equal(elements.budgetComparisonDifference.textContent, "180,00 €");
  context.exportBudgetComparisonExcel();
  assert.equal(context.excel.title, "Comparativa presupuestos - Base vs Optimista - 2030");
  assert.equal(context.excel.rows.some(row => row[0] === "CABECERA" && row[1] === "Año simulado" && row[2] === 2030), true);
  assert.equal(context.excel.rows.some(row => row[0] === "PARTIDA MANUAL" && row[1] === "Eventos" && row[2] === 0 && row[3] === 1500), true);
  assert.equal(context.excel.rows.some(row => row[0] === "GRUPO TICKET" && row[1] === "Fábrica" && row[2] === 0 && row[3] === 480), true);
  context.printBudgetComparison();
  assert.match(context.printHtml, /Comparativa presupuestos · Base vs Optimista · 2030/);
  assert.match(context.printHtml, /Comparación por bloques/);
  assert.match(context.printHtml, /Detalle partidas manuales/);
  assert.match(context.printHtml, /Detalle grupos Ticket/);
  console.log("budget comparison smoke test passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
