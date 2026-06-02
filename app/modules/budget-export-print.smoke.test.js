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
  rrllBudgetTicketGroups = [{ name: "Grupo", calculation_type: "manual_tickets", manual_tickets: 2, absence_rate: 0.05 }];
  rrllBudgetSimulationYears.set("scenario", 2031);
`, context);

(async () => {
  await context.exportBudgetScenarioExcel();
  await context.printBudgetScenario();
  assert.equal(context.excel.title, "Presupuesto - Copia - 2031");
  assert.equal(context.excel.rows.some(row => row[1] === "Año simulado" && row[2] === 2031), true);
  assert.equal(context.excel.rows.some(row => row[1] === "Absentismo general"), false);
  assert.equal(context.excel.rows.some(row => row[0] === "GRUPO TICKET" && row[8] === 0.05), true);
  assert.match(context.printHtml, /Presupuesto · Copia · 2031/);
  assert.match(context.printHtml, /Detalle grupos Ticket/);
  assert.match(context.printHtml, /5 %/);
  console.log("budget export and print smoke test passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
