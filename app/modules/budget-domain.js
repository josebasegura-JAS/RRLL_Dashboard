const BudgetDomain = (() => {
  const MONTHS = Object.freeze(Array.from({ length: 12 }, (_, index) => index + 1));
  const CALCULATION_TYPES = Object.freeze(["calendar_people", "manual_tickets", "manual_amount"]);
  const ACTUAL_BLOCKS = Object.freeze(["Ticket Restaurante", "Formación", "Vestuario", "Consultoría", "Reconocimientos médicos", "Gastos sindicales", "Otros"]);

  function hasValue(value) {
    return value !== null && value !== undefined && String(value).trim() !== "";
  }

  function normalizeBudgetNumber(value, fallback = 0) {
    if (!hasValue(value)) return fallback;
    const normalized = typeof value === "string"
      ? value.trim().replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".")
      : value;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeBudgetRate(value, fallback = 0) {
    if (!hasValue(value)) return fallback;
    const text = String(value).trim();
    const explicitPercent = text.includes("%");
    const number = normalizeBudgetNumber(text.replace(/%/g, ""), NaN);
    if (!Number.isFinite(number)) return fallback;
    return explicitPercent || Math.abs(number) > 1 ? number / 100 : number;
  }

  function getValue(source, camelName, snakeName) {
    return source && source[camelName] !== undefined ? source[camelName] : source && source[snakeName];
  }

  function calculateBudgetManualItemYear(item = {}) {
    const annual = getValue(item, "importeAnual", "annual_amount");
    if (hasValue(annual)) return normalizeBudgetNumber(annual);
    return normalizeBudgetNumber(getValue(item, "importeMensual", "monthly_amount")) * 12;
  }

  function calculateBudgetManualItemMonth(item = {}, month) {
    if (!MONTHS.includes(Number(month))) return 0;
    return calculateBudgetManualItemYear(item) / 12;
  }

  function calculateBudgetManualItemsYear(items = []) {
    return (Array.isArray(items) ? items : []).reduce((total, item) => total + calculateBudgetManualItemYear(item), 0);
  }

  function calculateBudgetManualItemsMonth(items = [], month) {
    return (Array.isArray(items) ? items : []).reduce((total, item) => total + calculateBudgetManualItemMonth(item, month), 0);
  }

  function normalizeCalculationType(group = {}) {
    const value = String(getValue(group, "tipoCalculo", "calculation_type") || "calendar_people");
    return CALCULATION_TYPES.includes(value) ? value : "calendar_people";
  }

  function getTicketAmount(group = {}, scenario = {}) {
    const own = getValue(group, "importeTicketPropio", "ticket_amount");
    return normalizeBudgetNumber(hasValue(own) ? own : getValue(scenario, "importeTicket", "ticket_amount"));
  }

  function getAbsenceRate(group = {}) {
    return normalizeBudgetRate(getValue(group, "absentismoPropio", "absence_rate"));
  }

  function resolveBudgetSimulationYear(scenario = {}, simulationYear) {
    const explicitYear = Number(simulationYear);
    if (Number.isInteger(explicitYear)) return explicitYear;
    const legacyYear = Number(getValue(scenario, "año", "year"));
    return Number.isInteger(legacyYear) ? legacyYear : 0;
  }

  function calculateBudgetTicketGroupMonth(group = {}, scenario = {}, month, context = {}, simulationYear) {
    const normalizedMonth = Number(month);
    if (!MONTHS.includes(normalizedMonth)) return 0;
    const type = normalizeCalculationType(group);
    if (type === "manual_amount") return normalizeBudgetNumber(getValue(group, "importeManualMensual", "manual_monthly_amount"));
    const ticketAmount = getTicketAmount(group, scenario);
    if (type === "manual_tickets") return normalizeBudgetNumber(getValue(group, "ticketsManuales", "manual_tickets")) * ticketAmount;
    const rawCalendar = getValue(group, "calendarioTicket", "ticket_calendar");
    const calendar = typeof context.normalizeTicketCalendar === "function" ? context.normalizeTicketCalendar(rawCalendar) : rawCalendar;
    if (!calendar || (typeof context.isKnownTicketCalendar === "function" && !context.isKnownTicketCalendar(calendar))) return 0;
    const ticketDays = typeof context.countTicketDaysForCalendar === "function"
      ? normalizeBudgetNumber(context.countTicketDaysForCalendar(calendar, resolveBudgetSimulationYear(scenario, simulationYear), normalizedMonth))
      : 0;
    const people = normalizeBudgetNumber(getValue(group, "numeroPersonas", "people_count"));
    return people * ticketDays * ticketAmount * (1 - getAbsenceRate(group, scenario));
  }

  function calculateBudgetTicketGroupYear(group = {}, scenario = {}, context = {}, simulationYear) {
    const byMonth = MONTHS.map(month => ({ month, totalTicket: calculateBudgetTicketGroupMonth(group, scenario, month, context, simulationYear) }));
    return { totalTicket: byMonth.reduce((total, item) => total + item.totalTicket, 0), byMonth };
  }

  function calculateBudgetTicketScenarioMonth(groups = [], scenario = {}, month, context = {}, simulationYear) {
    const byGroup = (Array.isArray(groups) ? groups : []).map(group => ({ group, totalTicket: calculateBudgetTicketGroupMonth(group, scenario, month, context, simulationYear) }));
    return { totalTicket: byGroup.reduce((total, item) => total + item.totalTicket, 0), byGroup };
  }

  function calculateBudgetTicketScenarioYear(groups = [], scenario = {}, context = {}, simulationYear) {
    const byMonth = MONTHS.map(month => ({ month, ...calculateBudgetTicketScenarioMonth(groups, scenario, month, context, simulationYear) }));
    const byGroup = (Array.isArray(groups) ? groups : []).map(group => ({ group, ...calculateBudgetTicketGroupYear(group, scenario, context, simulationYear) }));
    return { totalTicket: byMonth.reduce((total, item) => total + item.totalTicket, 0), byMonth, byGroup };
  }

  function calculateBudgetScenarioMonth({ manualItems = [], ticketGroups = [], scenario = {}, month, context = {}, simulationYear } = {}) {
    const byManualItem = (Array.isArray(manualItems) ? manualItems : []).map(item => ({ item, totalManual: calculateBudgetManualItemMonth(item, month) }));
    const ticket = calculateBudgetTicketScenarioMonth(ticketGroups, scenario, month, context, simulationYear);
    const totalManual = byManualItem.reduce((total, item) => total + item.totalManual, 0);
    return { month: Number(month), totalManual, totalTicket: ticket.totalTicket, totalScenario: totalManual + ticket.totalTicket, byManualItem, byGroup: ticket.byGroup };
  }

  function calculateBudgetScenarioYear({ manualItems = [], ticketGroups = [], scenario = {}, context = {}, simulationYear } = {}) {
    const resolvedSimulationYear = resolveBudgetSimulationYear(scenario, simulationYear);
    const byMonth = MONTHS.map(month => calculateBudgetScenarioMonth({ manualItems, ticketGroups, scenario, month, context, simulationYear: resolvedSimulationYear }));
    const byManualItem = (Array.isArray(manualItems) ? manualItems : []).map(item => ({ item, totalManual: calculateBudgetManualItemYear(item) }));
    const ticket = calculateBudgetTicketScenarioYear(ticketGroups, scenario, context, resolvedSimulationYear);
    const totalManual = byManualItem.reduce((total, item) => total + item.totalManual, 0);
    return { simulationYear: resolvedSimulationYear, totalManual, totalTicket: ticket.totalTicket, totalScenario: totalManual + ticket.totalTicket, byMonth, byManualItem, byGroup: ticket.byGroup };
  }

  function buildBudgetScenarioExportData({ manualItems = [], ticketGroups = [], scenario = {}, context = {}, simulationYear } = {}) {
    const totals = calculateBudgetScenarioYear({ manualItems, ticketGroups, scenario, context, simulationYear });
    return {
      scenario: {
        name: getValue(scenario, "nombre", "name") || "",
        simulationYear: totals.simulationYear,
        ticketAmount: normalizeBudgetNumber(getValue(scenario, "importeTicket", "ticket_amount")),
        notes: getValue(scenario, "observaciones", "notes") || ""
      },
      summary: { totalManual: totals.totalManual, totalTicket: totals.totalTicket, totalScenario: totals.totalScenario },
      monthly: totals.byMonth.map(item => ({ month: item.month, totalManual: item.totalManual, totalTicket: item.totalTicket, totalScenario: item.totalScenario })),
      manualItems: totals.byManualItem.map(({ item, totalManual }) => ({ concept: getValue(item, "concepto", "concept") || "", type: getValue(item, "categoría", "category") || "", monthlyAmount: getValue(item, "importeMensual", "monthly_amount"), annualAmount: getValue(item, "importeAnual", "annual_amount"), totalCalculated: totalManual })),
      ticketGroups: totals.byGroup.map(({ group, totalTicket }) => ({ name: getValue(group, "nombre", "name") || "", calendar: getValue(group, "calendarioTicket", "ticket_calendar") || "", type: normalizeCalculationType(group), people: normalizeBudgetNumber(getValue(group, "numeroPersonas", "people_count")), manualTickets: normalizeBudgetNumber(getValue(group, "ticketsManuales", "manual_tickets")), manualAmount: normalizeBudgetNumber(getValue(group, "importeManualMensual", "manual_monthly_amount")), ticketAmount: getTicketAmount(group, scenario), absenceRate: getAbsenceRate(group, scenario), totalCalculated: totalTicket }))
    };
  }

  function normalizeBudgetActual(actual = {}) {
    return {
      id: getValue(actual, "id", "id") || "",
      year: Number(getValue(actual, "año", "year")),
      month: Number(getValue(actual, "mes", "month")),
      block: String(getValue(actual, "bloque", "block") || "").trim(),
      concept: String(getValue(actual, "concepto", "concept") || "").trim(),
      amount: normalizeBudgetNumber(getValue(actual, "importe", "amount")),
      notes: String(getValue(actual, "observaciones", "notes") || "").trim()
    };
  }

  function buildBudgetActualDifference(budget, actual) {
    const budgetAccumulated = normalizeBudgetNumber(budget);
    const actualAccumulated = normalizeBudgetNumber(actual);
    const difference = actualAccumulated - budgetAccumulated;
    return { budgetAccumulated, actualAccumulated, difference, differencePercent: budgetAccumulated === 0 ? null : difference / budgetAccumulated };
  }

  function buildBudgetActualComparisonData({ budgetResult = {}, actuals = [], cutoffMonth = 12 } = {}) {
    const normalizedCutoffMonth = Number(cutoffMonth);
    if (!MONTHS.includes(normalizedCutoffMonth)) throw new Error("El mes de corte debe estar entre 1 y 12.");
    const simulationYear = Number(budgetResult.simulationYear);
    if (!Number.isInteger(simulationYear)) throw new Error("El resultado presupuestario debe incluir un año de simulación válido.");
    const blocks = new Map();
    const concepts = new Map();
    const ensureBlock = block => { const key = comparisonKey(block); if (!blocks.has(key)) blocks.set(key, { block, budget: 0, actual: 0 }); return blocks.get(key); };
    const ensureConcept = (block, concept) => { const key = `${comparisonKey(block)}::${comparisonKey(concept)}`; if (!concepts.has(key)) concepts.set(key, { block, concept, budget: 0, actual: 0 }); return concepts.get(key); };
    const addBudget = (block, concept, amount) => { const normalized = normalizeBudgetNumber(amount); ensureBlock(block).budget += normalized; ensureConcept(block, concept).budget += normalized; };
    const manualBlock = item => { const category = String(getValue(item, "categoría", "category") || "").trim(); return ACTUAL_BLOCKS.includes(category) && category !== "Ticket Restaurante" ? category : "Otros"; };
    const addActual = actual => { ensureBlock(actual.block).actual += actual.amount; ensureConcept(actual.block, actual.concept).actual += actual.amount; };
    (Array.isArray(budgetResult.byMonth) ? budgetResult.byMonth : []).filter(item => Number(item.month) <= normalizedCutoffMonth).forEach(month => {
      (Array.isArray(month.byManualItem) ? month.byManualItem : []).forEach(({ item, totalManual }) => addBudget(manualBlock(item), String(getValue(item, "concepto", "concept") || "Sin concepto").trim() || "Sin concepto", totalManual));
      (Array.isArray(month.byGroup) ? month.byGroup : []).forEach(({ group, totalTicket }) => addBudget("Ticket Restaurante", String(getValue(group, "nombre", "name") || "Ticket Restaurante").trim() || "Ticket Restaurante", totalTicket));
    });
    const usedActuals = (Array.isArray(actuals) ? actuals : []).map(normalizeBudgetActual).filter(actual => actual.year === simulationYear && MONTHS.includes(actual.month) && actual.month <= normalizedCutoffMonth && actual.block && actual.concept);
    usedActuals.forEach(addActual);
    const withDifference = row => ({ ...row, ...buildBudgetActualDifference(row.budget, row.actual) });
    const blockRows = [...blocks.values()].map(withDifference).sort((a, b) => a.block.localeCompare(b.block, "es"));
    const conceptRows = [...concepts.values()].map(withDifference).sort((a, b) => a.block.localeCompare(b.block, "es") || a.concept.localeCompare(b.concept, "es"));
    const budgetAccumulated = (Array.isArray(budgetResult.byMonth) ? budgetResult.byMonth : []).filter(item => Number(item.month) <= normalizedCutoffMonth).reduce((total, item) => total + normalizeBudgetNumber(item.totalScenario), 0);
    const actualAccumulated = usedActuals.reduce((total, actual) => total + actual.amount, 0);
    return { simulationYear, cutoffMonth: normalizedCutoffMonth, annualBudget: normalizeBudgetNumber(budgetResult.totalScenario), summary: { annualBudget: normalizeBudgetNumber(budgetResult.totalScenario), ...buildBudgetActualDifference(budgetAccumulated, actualAccumulated) }, blocks: blockRows, concepts: conceptRows, actuals: usedActuals };
  }

  function buildBudgetDifference(totalA, totalB) {
    const scenarioA = normalizeBudgetNumber(totalA);
    const scenarioB = normalizeBudgetNumber(totalB);
    const difference = scenarioB - scenarioA;
    return { scenarioA, scenarioB, difference, differencePercent: scenarioA === 0 ? (scenarioB === 0 ? 0 : null) : difference / scenarioA };
  }

  function comparisonKey(value) {
    return String(value || "").trim().toLocaleLowerCase();
  }

  function mergeBudgetComparisonRows(itemsA = [], itemsB = [], { label, calendar } = {}) {
    const rows = new Map();
    const add = (item, side) => {
      const name = String(item[label] || "").trim();
      const key = comparisonKey(name);
      if (!rows.has(key)) rows.set(key, { name, calendars: new Set(), scenarioA: 0, scenarioB: 0 });
      const row = rows.get(key);
      if (!row.name) row.name = name;
      if (calendar && item[calendar]) row.calendars.add(String(item[calendar]).trim());
      row[side] += normalizeBudgetNumber(item.totalCalculated);
    };
    (Array.isArray(itemsA) ? itemsA : []).forEach(item => add(item, "scenarioA"));
    (Array.isArray(itemsB) ? itemsB : []).forEach(item => add(item, "scenarioB"));
    return [...rows.values()].map(row => ({ name: row.name, ...(calendar ? { calendar: [...row.calendars].join(" · ") } : {}), ...buildBudgetDifference(row.scenarioA, row.scenarioB) }));
  }

  function buildBudgetComparisonData({ scenarioA = {}, scenarioB = {} } = {}) {
    const simulationYear = Number(scenarioA.scenario && scenarioA.scenario.simulationYear);
    if (!Number.isInteger(simulationYear) || simulationYear !== Number(scenarioB.scenario && scenarioB.scenario.simulationYear)) throw new Error("Los escenarios comparados deben usar el mismo año de simulación.");
    const blocks = [
      { name: "Ticket Restaurante", ...buildBudgetDifference(scenarioA.summary && scenarioA.summary.totalTicket, scenarioB.summary && scenarioB.summary.totalTicket) },
      { name: "Partidas manuales", ...buildBudgetDifference(scenarioA.summary && scenarioA.summary.totalManual, scenarioB.summary && scenarioB.summary.totalManual) },
      { name: "Total general", ...buildBudgetDifference(scenarioA.summary && scenarioA.summary.totalScenario, scenarioB.summary && scenarioB.summary.totalScenario) }
    ];
    return {
      simulationYear,
      scenarioA: scenarioA.scenario && scenarioA.scenario.name || "",
      scenarioB: scenarioB.scenario && scenarioB.scenario.name || "",
      summary: { ...buildBudgetDifference(scenarioA.summary && scenarioA.summary.totalScenario, scenarioB.summary && scenarioB.summary.totalScenario) },
      blocks,
      manualItems: mergeBudgetComparisonRows(scenarioA.manualItems, scenarioB.manualItems, { label: "concept" }),
      ticketGroups: mergeBudgetComparisonRows(scenarioA.ticketGroups, scenarioB.ticketGroups, { label: "name", calendar: "calendar" })
    };
  }

  return Object.freeze({
    normalizeBudgetNumber, normalizeBudgetRate, resolveBudgetSimulationYear,
    calculateBudgetManualItemMonth, calculateBudgetManualItemYear, calculateBudgetManualItemsYear, calculateBudgetManualItemsMonth,
    calculateBudgetTicketGroupMonth, calculateBudgetTicketGroupYear, calculateBudgetTicketScenarioMonth, calculateBudgetTicketScenarioYear,
    calculateBudgetScenarioMonth, calculateBudgetScenarioYear, buildBudgetScenarioExportData, buildBudgetComparisonData,
    normalizeBudgetActual, buildBudgetActualComparisonData
  });
})();

if (typeof module !== "undefined" && module.exports) module.exports = BudgetDomain;
