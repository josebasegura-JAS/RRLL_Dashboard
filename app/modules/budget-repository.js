const crypto = require("crypto");

function createBudgetRepository({ db, now = () => new Date().toISOString(), createId = () => crypto.randomUUID() } = {}) {
  if (!db || typeof db.run !== "function" || typeof db.exec !== "function") throw new Error("Se requiere una conexión SQLite válida para Presupuestos.");

  function rows(sql, params = []) {
    const statement = db.prepare(sql);
    try {
      statement.bind(params);
      const output = [];
      while (statement.step()) output.push(statement.getAsObject());
      return output;
    } finally { statement.free(); }
  }

  function hasTable(name) {
    return rows("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", [name]).length > 0;
  }

  function ensureBudgetSchema() {
    const names = ["budget_scenarios", "budget_manual_items", "budget_ticket_groups"];
    const created = names.filter(name => !hasTable(name));
    db.run(`CREATE TABLE IF NOT EXISTS budget_scenarios (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, year INTEGER NOT NULL, ticket_amount REAL NOT NULL DEFAULT 0,
      absence_rate REAL NOT NULL DEFAULT 0, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS budget_manual_items (
      id TEXT PRIMARY KEY, scenario_id TEXT NOT NULL, concept TEXT NOT NULL, category TEXT, monthly_amount REAL,
      annual_amount REAL, notes TEXT, display_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS budget_ticket_groups (
      id TEXT PRIMARY KEY, scenario_id TEXT NOT NULL, name TEXT NOT NULL, people_count REAL NOT NULL DEFAULT 0,
      ticket_calendar TEXT, absence_rate REAL, ticket_amount REAL, calculation_type TEXT NOT NULL DEFAULT 'calendar_people',
      manual_tickets REAL, manual_monthly_amount REAL, notes TEXT, display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`);
    // Compatibilidad no destructiva: materializa en cada grupo histórico el antiguo fallback del escenario.
    db.run(`UPDATE budget_ticket_groups
      SET absence_rate = COALESCE((SELECT absence_rate FROM budget_scenarios WHERE budget_scenarios.id = budget_ticket_groups.scenario_id), 0)
      WHERE calculation_type = 'calendar_people' AND absence_rate IS NULL`);
    return { created };
  }

  function value(input, camelName, snakeName, fallback = null) {
    if (input && input[camelName] !== undefined) return input[camelName];
    if (input && input[snakeName] !== undefined) return input[snakeName];
    return fallback;
  }
  function optionalNumber(input, camelName, snakeName) {
    const current = value(input, camelName, snakeName);
    return current === "" || current === null || current === undefined ? null : Number(current);
  }
  function requireText(input, camelName, snakeName, message) {
    const text = String(value(input, camelName, snakeName, "")).trim();
    if (!text) throw new Error(message);
    return text;
  }
  function getExisting(table, id) { return id ? rows(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [id])[0] : null; }

  function getBudgetScenarios() { return rows("SELECT * FROM budget_scenarios ORDER BY year DESC, name COLLATE NOCASE, created_at"); }
  function getBudgetScenario(id) { return getExisting("budget_scenarios", id) || null; }
  function saveBudgetScenario(input = {}) {
    const existing = getBudgetScenario(input.id);
    const id = existing ? existing.id : (input.id || createId());
    const timestamp = now();
    const name = requireText(input, "nombre", "name", "El nombre del escenario es obligatorio.");
    const year = Number(value(input, "año", "year"));
    const ticketAmount = Number(value(input, "importeTicket", "ticket_amount", 0));
    if (!Number.isInteger(year)) throw new Error("El año del escenario debe ser numérico.");
    if (!Number.isFinite(ticketAmount) || ticketAmount < 0) throw new Error("El importe ticket no puede ser negativo.");
    // absence_rate se conserva físicamente para abrir BBDD antiguas, pero ya no forma parte del escenario funcional.
    const legacyAbsenceRate = existing ? existing.absence_rate : 0;
    db.run(`INSERT OR REPLACE INTO budget_scenarios (id, name, year, ticket_amount, absence_rate, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [id, name, year, ticketAmount, legacyAbsenceRate, value(input, "observaciones", "notes", ""), existing ? existing.created_at : timestamp, timestamp]);
    return id;
  }

  function getBudgetManualItems(scenarioId) { return rows("SELECT * FROM budget_manual_items WHERE scenario_id = ? ORDER BY display_order, created_at", [scenarioId]); }
  function saveBudgetManualItem(input = {}) {
    const existing = getExisting("budget_manual_items", input.id);
    const id = existing ? existing.id : (input.id || createId());
    const timestamp = now();
    const scenarioId = requireText(input, "scenarioId", "scenario_id", "El escenario de la partida es obligatorio.");
    const concept = requireText(input, "concepto", "concept", "El concepto de la partida es obligatorio.");
    const monthly = optionalNumber(input, "importeMensual", "monthly_amount");
    const annual = optionalNumber(input, "importeAnual", "annual_amount");
    if (monthly === null && annual === null) throw new Error("Indica un importe mensual o anual.");
    if ((monthly !== null && (!Number.isFinite(monthly) || monthly < 0)) || (annual !== null && (!Number.isFinite(annual) || annual < 0))) throw new Error("Los importes de la partida no pueden ser negativos.");
    db.run(`INSERT OR REPLACE INTO budget_manual_items (id, scenario_id, concept, category, monthly_amount, annual_amount, notes, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, scenarioId, concept, value(input, "categoría", "category", ""), monthly, annual, value(input, "observaciones", "notes", ""), Number(value(input, "displayOrder", "display_order", 0)) || 0, existing ? existing.created_at : timestamp, timestamp]);
    return id;
  }
  function deleteBudgetManualItem(id) { db.run("DELETE FROM budget_manual_items WHERE id = ?", [id]); return id; }

  function getBudgetTicketGroups(scenarioId) { return rows("SELECT * FROM budget_ticket_groups WHERE scenario_id = ? ORDER BY display_order, created_at", [scenarioId]); }
  function saveBudgetTicketGroup(input = {}) {
    const existing = getExisting("budget_ticket_groups", input.id);
    const id = existing ? existing.id : (input.id || createId());
    const timestamp = now();
    const scenarioId = requireText(input, "scenarioId", "scenario_id", "El escenario del grupo es obligatorio.");
    const name = requireText(input, "nombre", "name", "El nombre del grupo es obligatorio.");
    const calculationType = String(value(input, "tipoCalculo", "calculation_type", "calendar_people"));
    if (!["calendar_people", "manual_tickets", "manual_amount"].includes(calculationType)) throw new Error("El tipo de cálculo Ticket no es válido.");
    const people = Number(value(input, "numeroPersonas", "people_count", 0));
    const absence = optionalNumber(input, "absentismoPropio", "absence_rate");
    const ticketAmount = optionalNumber(input, "importeTicketPropio", "ticket_amount");
    const manualTickets = optionalNumber(input, "ticketsManuales", "manual_tickets");
    const manualAmount = optionalNumber(input, "importeManualMensual", "manual_monthly_amount");
    if (!Number.isFinite(people) || people < 0) throw new Error("El número de personas no puede ser negativo.");
    if (absence !== null && (!Number.isFinite(absence) || absence < 0 || absence > 1)) throw new Error("El absentismo propio debe estar entre 0 y 1.");
    if (ticketAmount !== null && (!Number.isFinite(ticketAmount) || ticketAmount < 0)) throw new Error("El importe ticket propio no puede ser negativo.");
    if (manualTickets !== null && (!Number.isFinite(manualTickets) || manualTickets < 0)) throw new Error("Los tickets manuales no pueden ser negativos.");
    if (manualAmount !== null && (!Number.isFinite(manualAmount) || manualAmount < 0)) throw new Error("El importe mensual manual no puede ser negativo.");
    db.run(`INSERT OR REPLACE INTO budget_ticket_groups (id, scenario_id, name, people_count, ticket_calendar, absence_rate, ticket_amount, calculation_type, manual_tickets, manual_monthly_amount, notes, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, scenarioId, name, people, value(input, "calendarioTicket", "ticket_calendar", ""), absence, ticketAmount, calculationType, manualTickets, manualAmount, value(input, "observaciones", "notes", ""), Number(value(input, "displayOrder", "display_order", 0)) || 0, existing ? existing.created_at : timestamp, timestamp]);
    return id;
  }
  function deleteBudgetTicketGroup(id) { db.run("DELETE FROM budget_ticket_groups WHERE id = ?", [id]); return id; }

  function duplicateBudgetScenario(scenarioId, newName) {
    const scenario = getBudgetScenario(scenarioId);
    if (!scenario) throw new Error("El escenario que deseas duplicar no existe.");
    const name = String(newName || "").trim();
    if (!name) throw new Error("El nombre del nuevo escenario es obligatorio.");
    db.run("BEGIN TRANSACTION");
    try {
      const duplicateId = saveBudgetScenario({ name, year: scenario.year, ticket_amount: scenario.ticket_amount, notes: scenario.notes });
      getBudgetManualItems(scenario.id).forEach(item => saveBudgetManualItem({ ...item, id: undefined, scenario_id: duplicateId }));
      getBudgetTicketGroups(scenario.id).forEach(group => saveBudgetTicketGroup({ ...group, id: undefined, scenario_id: duplicateId }));
      db.run("COMMIT");
      return duplicateId;
    } catch (error) {
      db.run("ROLLBACK");
      throw error;
    }
  }

  ensureBudgetSchema();
  return { ensureBudgetSchema, getBudgetScenarios, getBudgetScenario, saveBudgetScenario, duplicateBudgetScenario, getBudgetManualItems, saveBudgetManualItem, deleteBudgetManualItem, getBudgetTicketGroups, saveBudgetTicketGroup, deleteBudgetTicketGroup };
}

if (typeof module !== "undefined" && module.exports) module.exports = { createBudgetRepository };
