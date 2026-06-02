const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const bootstrapSource = fs.readFileSync(require.resolve("./bootstrap.js"), "utf8");
const navigationSource = fs.readFileSync(require.resolve("./navigation.js"), "utf8");
const ticketSource = fs.readFileSync(require.resolve("./ticket-restaurante.js"), "utf8");
const dashboardSource = fs.readFileSync(require.resolve("../dashboard.html"), "utf8");

const renderAllDataViewsBody = bootstrapSource.slice(
  bootstrapSource.indexOf("function renderAllDataViews"),
  bootstrapSource.indexOf("function waitForDatabaseBridge")
);
assert.match(renderAllDataViewsBody, /document\.getElementById\("gestor-ticket-restaurante"\)/);
assert.match(renderAllDataViewsBody, /!ticketModule\.hidden/);
assert.match(renderAllDataViewsBody, /ticketModule\.classList\.contains\("rrll-active-module"\)/);
assert.match(renderAllDataViewsBody, /if \(isTicketActive\) rrllSafeCall\("Ticket Restaurante"/);

const initializeAppBody = bootstrapSource.slice(
  bootstrapSource.indexOf("async function initializeApp"),
  bootstrapSource.indexOf('document.addEventListener("keydown"')
);
assert.doesNotMatch(initializeAppBody, /hydrateTicketRestaurantCalendars/);
assert.doesNotMatch(initializeAppBody, /hydrateTicketCalendarManagement/);

const phase4ShowModuleBody = navigationSource.slice(
  navigationSource.indexOf("function phase4ShowModule"),
  navigationSource.indexOf("function openMainGestor")
);
assert.match(phase4ShowModuleBody, /gestorId === "gestor-ticket-restaurante"/);
assert.match(phase4ShowModuleBody, /window\.ensureTicketRestaurantReady\(\)/);
assert.match(phase4ShowModuleBody, /window\.renderTicketRestaurant\(\)/);

assert.match(ticketSource, /let ticketRestaurantActiveArea = "calendar";/);
assert.match(dashboardSource, /class="ticket-restaurant-tab active" data-ticket-area="calendar"/);
assert.match(dashboardSource, /class="ticket-restaurant-area" data-ticket-area="compute" hidden/);

const context = {
  console,
  window: {},
  load: (_key, fallback) => fallback,
  save: () => {},
  document: {
    getElementById: () => null,
    querySelectorAll: () => [],
    querySelector: () => null
  }
};
vm.createContext(context);
vm.runInContext(ticketSource, context, { filename: "ticket-restaurante.js" });

const renders = Object.create(null);
[
  "renderTicketRestaurantCalendarSelector",
  "renderTicketRestaurantCalendar",
  "renderTicketRestaurantPeople",
  "renderTicketRestaurantAbsences",
  "renderTicketRestaurantComputeControls",
  "renderTicketRestaurantComputePreview",
  "renderTicketRestaurantMonthlyQuotePreview",
  "renderTicketRestaurantConfig",
  "renderTicketCalendarManagement"
].forEach(name => {
  renders[name] = 0;
  context[name] = () => { renders[name] += 1; };
});
function resetRenders() { Object.keys(renders).forEach(name => { renders[name] = 0; }); }

// The initial and calendar areas are light: neither enters the compute preview.
context.renderTicketRestaurant();
assert.equal(renders.renderTicketRestaurantCalendarSelector, 1);
assert.equal(renders.renderTicketRestaurantCalendar, 1);
assert.equal(renders.renderTicketRestaurantComputePreview, 0);

resetRenders();
vm.runInContext('showTicketRestaurantArea("people")', context);
assert.equal(renders.renderTicketRestaurantPeople, 1);
assert.equal(renders.renderTicketRestaurantComputePreview, 0);
assert.equal(renders.renderTicketRestaurantCalendar, 0);
assert.equal(renders.renderTicketRestaurantAbsences, 0);

resetRenders();
vm.runInContext('showTicketRestaurantArea("compute")', context);
assert.equal(renders.renderTicketRestaurantComputeControls, 1);
assert.equal(renders.renderTicketRestaurantComputePreview, 1);
assert.equal(renders.renderTicketRestaurantPeople, 0);
assert.equal(renders.renderTicketRestaurantCalendar, 0);
assert.equal(renders.renderTicketRestaurantAbsences, 0);

resetRenders();
vm.runInContext('showTicketRestaurantArea("calendar-management")', context);
assert.equal(renders.renderTicketCalendarManagement, 1);
assert.equal(renders.renderTicketRestaurantComputePreview, 0);
assert.equal(Object.values(renders).reduce((sum, value) => sum + value, 0), 1);

// Calendar hydration is lazy, cached after first activation, and refreshable explicitly.
let restaurantHydrates = 0;
let managementHydrates = 0;
context.hydrateTicketRestaurantCalendars = async () => { restaurantHydrates += 1; };
context.hydrateTicketCalendarManagement = async options => {
  managementHydrates += 1;
  assert.equal(options.render, false);
};
(async () => {
  await context.window.ensureTicketRestaurantReady();
  await context.window.ensureTicketRestaurantReady();
  assert.equal(restaurantHydrates, 1);
  assert.equal(managementHydrates, 1);
  await context.window.ensureTicketRestaurantReady({ force: true });
  assert.equal(restaurantHydrates, 2);
  assert.equal(managementHydrates, 2);
  console.log("ticket-restaurante lazy render smoke test passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
