const assert = require("assert");
const initSqlJs = require("sql.js");
const { createBudgetRepository } = require("./budget-repository");

(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run("CREATE TABLE untouched_module (id TEXT PRIMARY KEY, value TEXT)");
  db.run("INSERT INTO untouched_module (id, value) VALUES ('keep', 'intact')");
  let sequence = 0;
  const repository = createBudgetRepository({ db, now: () => "2026-06-02T00:00:00.000Z", createId: () => `id-${++sequence}` });
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'budget_%' ORDER BY name")[0].values.map(row => row[0]);
  assert.deepEqual(tables, ["budget_manual_items", "budget_scenarios", "budget_ticket_groups"]);

  const scenarioId = repository.saveBudgetScenario({ name: "Presupuesto 2026 Base", year: 2026, ticket_amount: 14.57, absence_rate: 0.06 });
  assert.equal(repository.getBudgetScenario(scenarioId).name, "Presupuesto 2026 Base");
  assert.equal(repository.getBudgetScenario(scenarioId).absence_rate, 0);
  repository.saveBudgetScenario({ id: scenarioId, name: "Presupuesto actualizado", year: 2027, ticket_amount: 15, absence_rate: 0.05 });
  assert.equal(repository.getBudgetScenario(scenarioId).year, 2027);
  assert.equal(repository.getBudgetScenario(scenarioId).absence_rate, 0);

  const itemId = repository.saveBudgetManualItem({ scenario_id: scenarioId, concept: "Formación", annual_amount: 12000, notes: "Original" });
  assert.equal(repository.getBudgetManualItems(scenarioId)[0].concept, "Formación");

  const groupId = repository.saveBudgetTicketGroup({ scenario_id: scenarioId, name: "Oficinas", people_count: 10, ticket_calendar: "Servicios Centrales", absence_rate: 0.08, calculation_type: "calendar_people" });
  assert.equal(repository.getBudgetTicketGroups(scenarioId)[0].absence_rate, 0.08);

  const duplicateId = repository.duplicateBudgetScenario(scenarioId, "Presupuesto duplicado");
  assert.notEqual(duplicateId, scenarioId);
  assert.equal(repository.getBudgetScenario(duplicateId).name, "Presupuesto duplicado");
  assert.equal(repository.getBudgetScenario(duplicateId).year, 2027);
  assert.equal(repository.getBudgetScenario(duplicateId).ticket_amount, 15);
  const duplicateItems = repository.getBudgetManualItems(duplicateId);
  const duplicateGroups = repository.getBudgetTicketGroups(duplicateId);
  assert.equal(duplicateItems.length, 1);
  assert.equal(duplicateGroups.length, 1);
  assert.notEqual(duplicateItems[0].id, itemId);
  assert.notEqual(duplicateGroups[0].id, groupId);
  assert.equal(duplicateGroups[0].absence_rate, 0.08);

  repository.saveBudgetManualItem({ id: duplicateItems[0].id, scenario_id: duplicateId, concept: "Copia independiente", monthly_amount: 100 });
  repository.saveBudgetTicketGroup({ id: duplicateGroups[0].id, scenario_id: duplicateId, name: "Copia", people_count: 5, ticket_calendar: "Servicios Centrales", absence_rate: 0.03, calculation_type: "calendar_people" });
  assert.equal(repository.getBudgetManualItems(scenarioId)[0].concept, "Formación");
  assert.equal(repository.getBudgetTicketGroups(scenarioId)[0].people_count, 10);
  assert.equal(repository.getBudgetTicketGroups(scenarioId)[0].absence_rate, 0.08);
  repository.deleteBudgetManualItem(itemId);
  repository.deleteBudgetTicketGroup(groupId);
  assert.equal(repository.getBudgetManualItems(scenarioId).length, 0);
  assert.equal(repository.getBudgetTicketGroups(scenarioId).length, 0);
  assert.deepEqual(db.exec("SELECT id, value FROM untouched_module")[0].values, [["keep", "intact"]]);
  db.close();

  const legacyDb = new SQL.Database();
  legacyDb.run("CREATE TABLE budget_scenarios (id TEXT PRIMARY KEY, name TEXT NOT NULL, year INTEGER NOT NULL, ticket_amount REAL NOT NULL DEFAULT 0, absence_rate REAL NOT NULL DEFAULT 0, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
  legacyDb.run("CREATE TABLE budget_manual_items (id TEXT PRIMARY KEY, scenario_id TEXT NOT NULL, concept TEXT NOT NULL, category TEXT, monthly_amount REAL, annual_amount REAL, notes TEXT, display_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
  legacyDb.run("CREATE TABLE budget_ticket_groups (id TEXT PRIMARY KEY, scenario_id TEXT NOT NULL, name TEXT NOT NULL, people_count REAL NOT NULL DEFAULT 0, ticket_calendar TEXT, absence_rate REAL, ticket_amount REAL, calculation_type TEXT NOT NULL DEFAULT 'calendar_people', manual_tickets REAL, manual_monthly_amount REAL, notes TEXT, display_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
  legacyDb.run("INSERT INTO budget_scenarios VALUES ('legacy-scenario', 'Antiguo', 2026, 10, 0.07, '', 'created', 'updated')");
  legacyDb.run("INSERT INTO budget_ticket_groups VALUES ('legacy-group', 'legacy-scenario', 'Histórico', 3, 'Servicios Centrales', NULL, NULL, 'calendar_people', NULL, NULL, '', 0, 'created', 'updated')");
  const legacyRepository = createBudgetRepository({ db: legacyDb });
  assert.equal(legacyRepository.getBudgetTicketGroups("legacy-scenario")[0].absence_rate, 0.07);
  assert.equal(legacyRepository.getBudgetScenario("legacy-scenario").absence_rate, 0.07);
  legacyDb.close();
  console.log("budget-repository smoke test passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
