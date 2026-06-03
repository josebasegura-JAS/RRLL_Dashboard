const assert = require("node:assert/strict");
const fs = require("node:fs");

const budgetSource = fs.readFileSync(require.resolve("./budget.js"), "utf8");

function functionBody(name, nextName) {
  return budgetSource.slice(
    budgetSource.indexOf(`async function ${name}`),
    budgetSource.indexOf(nextName)
  );
}

const saveManualBody = functionBody("saveBudgetManualItemFromForm", "async function deleteBudgetManualItem");
const deleteManualBody = functionBody("deleteBudgetManualItem", "function resetBudgetTicketGroupForm");
const saveTicketBody = functionBody("saveBudgetTicketGroupFromForm", "async function deleteBudgetTicketGroup");
const deleteTicketBody = functionBody("deleteBudgetTicketGroup", "window.initializeBudgetModule");
const selectScenarioBody = functionBody("selectBudgetScenario", "async function simulateBudgetScenario");
const simulateScenarioBody = functionBody("simulateBudgetScenario", "async function recalculateBudgetScenario");

assert.match(budgetSource, /let rrllBudgetCalendarContextCache = null/);
assert.match(budgetSource, /let rrllBudgetCalendarContextPromise = null/);
assert.match(budgetSource, /if \(rrllBudgetCalendarContextCache\) return rrllBudgetCalendarContextCache/);
assert.match(budgetSource, /function rrllBudgetScenarioRowHtml/);
assert.match(budgetSource, /async function refreshBudgetSelectedScenarioData/);
assert.match(budgetSource, /async function refreshBudgetSelectedScenarioView/);
assert.match(budgetSource, /async function refreshBudgetScenarioRowTotals/);
assert.match(budgetSource, /data-budget-scenario-row/);

assert.doesNotMatch(saveManualBody, /refreshBudgetModule\(/);
assert.match(saveManualBody, /refreshBudgetSelectedScenarioView\(\{ manualItems: true, ticketGroups: false \}\)/);
assert.doesNotMatch(deleteManualBody, /refreshBudgetModule\(/);
assert.match(deleteManualBody, /refreshBudgetSelectedScenarioView\(\{ manualItems: true, ticketGroups: false \}\)/);

assert.doesNotMatch(saveTicketBody, /refreshBudgetModule\(/);
assert.match(saveTicketBody, /refreshBudgetSelectedScenarioView\(\{ manualItems: false, ticketGroups: true \}\)/);
assert.doesNotMatch(deleteTicketBody, /refreshBudgetModule\(/);
assert.match(deleteTicketBody, /refreshBudgetSelectedScenarioView\(\{ manualItems: false, ticketGroups: true \}\)/);

assert.doesNotMatch(selectScenarioBody, /renderBudgetScenarios\(/);
assert.match(selectScenarioBody, /renderBudgetScenarioSelectionState\(\)/);
assert.match(selectScenarioBody, /loadSelectedBudgetScenario\(\)/);
assert.doesNotMatch(simulateScenarioBody, /renderBudgetScenarios\(/);
assert.match(simulateScenarioBody, /refreshBudgetScenarioRowTotals\(\)/);

console.log("budget partial refresh smoke test passed");
