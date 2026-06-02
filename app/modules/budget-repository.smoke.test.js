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
  repository.saveBudgetScenario({ id: scenarioId, name: "Presupuesto actualizado", year: 2027, ticket_amount: 15, absence_rate: 0.05 });
  assert.equal(repository.getBudgetScenario(scenarioId).year, 2027);

  const itemId = repository.saveBudgetManualItem({ scenario_id: scenarioId, concept: "Formación", annual_amount: 12000 });
  assert.equal(repository.getBudgetManualItems(scenarioId)[0].concept, "Formación");
  repository.saveBudgetManualItem({ id: itemId, scenario_id: scenarioId, concept: "Consultoría", monthly_amount: 100 });
  assert.equal(repository.getBudgetManualItems(scenarioId)[0].concept, "Consultoría");
  repository.deleteBudgetManualItem(itemId);
  assert.equal(repository.getBudgetManualItems(scenarioId).length, 0);

  const groupId = repository.saveBudgetTicketGroup({ scenario_id: scenarioId, name: "Oficinas", people_count: 10, ticket_calendar: "Servicios Centrales", calculation_type: "calendar_people" });
  assert.equal(repository.getBudgetTicketGroups(scenarioId)[0].people_count, 10);
  repository.saveBudgetTicketGroup({ id: groupId, scenario_id: scenarioId, name: "Manual", calculation_type: "manual_amount", manual_monthly_amount: 500 });
  assert.equal(repository.getBudgetTicketGroups(scenarioId)[0].manual_monthly_amount, 500);
  repository.deleteBudgetTicketGroup(groupId);
  assert.equal(repository.getBudgetTicketGroups(scenarioId).length, 0);
  assert.deepEqual(db.exec("SELECT id, value FROM untouched_module")[0].values, [["keep", "intact"]]);
  db.close();
  console.log("budget-repository smoke test passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
