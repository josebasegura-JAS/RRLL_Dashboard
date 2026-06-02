const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const budgetSource = fs.readFileSync(require.resolve("./budget.js"), "utf8");
const dashboardSource = fs.readFileSync(require.resolve("../dashboard.html"), "utf8");
const classes = new Set(["budget-form-hidden"]);
const elements = {
  budgetSimulationYear: { value: "" },
  budgetSimulationYearError: {
    textContent: "",
    classList: { toggle(name, hidden) { hidden ? classes.add(name) : classes.delete(name); } }
  }
};
const context = {
  console,
  window: {},
  document: { getElementById: id => elements[id] || null }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(require.resolve("./budget-domain"), "utf8"), context);
vm.runInContext(budgetSource, context);

assert.match(dashboardSource, /id="budgetSimulationYear"[^>]*type="number"[^>]*min="1900"[^>]*max="9999"/);
assert.match(dashboardSource, /id="budgetSimulationYearError"[^>]*role="alert"/);
assert.doesNotMatch(budgetSource, /\b(?:window\.)?prompt\s*\(/);
vm.runInContext('rrllBudgetScenarios = [{ id: "scenario", name: "Prueba", year: 2026 }]; rrllBudgetSelectedScenarioId = "scenario"; rrllBudgetSyncSimulationYearInput();', context);
assert.equal(elements.budgetSimulationYear.value, 2026);
elements.budgetSimulationYear.value = "2032";
assert.equal(vm.runInContext("rrllBudgetReadSimulationYear()", context), 2032);
assert.equal(vm.runInContext("rrllBudgetSimulationYear()", context), 2032);
(async () => {
  elements.budgetSimulationYear.value = "1899";
  await context.simulateBudgetScenario("scenario");
  assert.equal(elements.budgetSimulationYearError.textContent, "Indica un año de simulación válido.");
  assert.equal(classes.has("budget-form-hidden"), false);
  console.log("budget simulation year UI smoke test passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
