const assert = require("node:assert/strict");
const fs = require("node:fs");

const budgetSource = fs.readFileSync(require.resolve("./budget.js"), "utf8");
const navigationSource = fs.readFileSync(require.resolve("./navigation.js"), "utf8");

const calendarContextBody = budgetSource.slice(
  budgetSource.indexOf("async function rrllBudgetCalendarContext"),
  budgetSource.indexOf("async function initializeBudgetModule")
);
assert.match(calendarContextBody, /hydrateTicketRestaurantCalendars\(\)/);
assert.doesNotMatch(calendarContextBody, /ensureTicketRestaurantReady/);
assert.doesNotMatch(budgetSource, /setTimeout\(initializeBudgetModule/);
assert.match(budgetSource, /window\.initializeBudgetModule = initializeBudgetModule/);
assert.match(budgetSource, /needsTicketCalendars \? await rrllBudgetCalendarContext\(\) : \{\}/);
assert.match(budgetSource, /type === "calendar_people" \? await rrllBudgetCalendarContext\(\) : null/);

const phase4ShowModuleBody = navigationSource.slice(
  navigationSource.indexOf("function phase4ShowModule"),
  navigationSource.indexOf("function openMainGestor")
);
assert.match(phase4ShowModuleBody, /gestorId === "gestor-presupuestos"/);
assert.match(phase4ShowModuleBody, /window\.initializeBudgetModule\(\)/);

console.log("budget lazy initialization smoke test passed");
