const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const context = {
  console,
  window: {},
  document: {},
  alert: message => { throw new Error(message); },
  exportExcelData: payload => { context.excel = payload; },
  openPrintPreviewWithHtml: html => { context.printHtml = html; }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(require.resolve("./budget-domain"), "utf8"), context);
vm.runInContext(fs.readFileSync(require.resolve("./budget"), "utf8"), context);
vm.runInContext(`
  rrllBudgetScenarios = [{ id: "scenario", name: "Copia", year: 2026, ticket_amount: 10, notes: "Notas" }];
  rrllBudgetSelectedScenarioId = "scenario";
  rrllBudgetManualItems = [{ concept: "Manual", monthly_amount: 100 }];
  rrllBudgetTicketGroups = [{ name: "Grupo", calculation_type: "annual_tickets", annual_tickets: 120, ticket_amount: 11, absence_rate: 0.05 }];
  rrllBudgetSimulationYears.set("scenario", 2031);
`, context);

(async () => {
  await context.exportBudgetScenarioExcel();
  await context.printBudgetScenario();
  assert.equal(context.excel.title, "Presupuesto - Copia - 2031");
  assert.equal(context.excel.rows.some(row => row[1] === "Año simulado" && row[2] === 2031), true);
  assert.equal(context.excel.rows.some(row => row[1] === "Absentismo general"), false);
  assert.equal(context.excel.rows.some(row => row[0] === "GRUPO TICKET" && row[3] === "Tickets anuales" && row[6] === 120 && row[10] === 1320), true);
  assert.match(context.printHtml, /Presupuesto · Copia · 2031/);
  assert.match(context.printHtml, /Detalle grupos Ticket/);
  assert.match(context.printHtml, /Tickets anuales/);
  assert.match(context.printHtml, /1320,00 €/);
  vm.runInContext(`
    rrllBudgetActualComparisonData = { scenario: "Copia", simulationYear: 2031, cutoffMonth: 2, summary: { annualBudget: 1200, budgetAccumulated: 200, actualAccumulated: 250, difference: 50, differencePercent: 0.25 }, blocks: [{ block: "Formación", budgetAccumulated: 200, actualAccumulated: 250, difference: 50, differencePercent: 0.25 }], concepts: [{ block: "Formación", concept: "Curso", budgetAccumulated: 200, actualAccumulated: 250, difference: 50, differencePercent: 0.25 }], actuals: [{ year: 2031, month: 2, block: "Formación", concept: "Curso", amount: 250, notes: "Factura" }] };
  `, context);
  context.exportBudgetActualComparisonExcel();
  context.printBudgetActualComparison();
  assert.equal(context.excel.title, "Presupuesto vs Real - Copia - 2031 - Febrero");
  assert.equal(context.excel.rows.some(row => row[0] === "REAL UTILIZADO" && row[2] === "Curso" && row[3] === 250), true);
  assert.match(context.printHtml, /Presupuesto vs Real ejecutado/);
  assert.match(context.printHtml, /Detalle por concepto/);
  console.log("budget export and print smoke test passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
