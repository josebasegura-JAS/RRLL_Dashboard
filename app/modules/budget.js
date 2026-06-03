const RRLL_BUDGET_MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
let rrllBudgetScenarios = [];
let rrllBudgetManualItems = [];
let rrllBudgetTicketGroups = [];
let rrllBudgetSelectedScenarioId = "";
let rrllBudgetCalendarFallback = false;
let rrllBudgetInitialized = false;
let rrllBudgetInitializePromise = null;
const rrllBudgetSimulationYears = new Map();
let rrllBudgetComparisonData = null;
let rrllBudgetActuals = [];
let rrllBudgetActualComparisonData = null;
let rrllBudgetActualDashboardData = null;
const RRLL_BUDGET_ACTUAL_BLOCKS = ["Ticket Restaurante", "Formación", "Vestuario", "Consultoría", "Reconocimientos médicos", "Gastos sindicales", "Otros"];
const RRLL_BUDGET_TICKET_TYPE_LABELS = Object.freeze({ calendar_people: "Calendario × personas", manual_tickets: "Tickets manuales / mes", manual_amount: "Importe mensual manual", annual_tickets: "Tickets anuales" });

function rrllBudgetBridge() { return window.rrllDB || null; }
function rrllBudgetScenario() { return rrllBudgetScenarios.find(item => item.id === rrllBudgetSelectedScenarioId) || null; }
function rrllBudgetHasValue(value) { return value !== null && value !== undefined && String(value).trim() !== ""; }
function rrllBudgetEscape(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function rrllBudgetMoney(value) { return `${BudgetDomain.normalizeBudgetNumber(value).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`; }
function rrllBudgetPercent(value) { return `${(BudgetDomain.normalizeBudgetRate(value) * 100).toLocaleString("es-ES", { maximumFractionDigits: 2 })} %`; }
function rrllBudgetInputNumber(id, fallback = null) { const value = document.getElementById(id).value; return rrllBudgetHasValue(value) ? BudgetDomain.normalizeBudgetNumber(value, NaN) : fallback; }
function rrllBudgetRate(id, fallback = null) { const value = document.getElementById(id).value; return rrllBudgetHasValue(value) ? BudgetDomain.normalizeBudgetRate(value, NaN) : fallback; }
function rrllBudgetAssert(condition, message) { if (!condition) throw new Error(message); }
function rrllBudgetTicketTypeLabel(type) { return RRLL_BUDGET_TICKET_TYPE_LABELS[type] || type || "—"; }
function rrllBudgetResult(result) { if (!result || !result.ok) throw new Error(result && result.message ? result.message : "No se pudo guardar el presupuesto."); return result; }
function rrllBudgetSimulationYear(scenario = rrllBudgetScenario()) { return scenario ? (rrllBudgetSimulationYears.get(scenario.id) || BudgetDomain.resolveBudgetSimulationYear(scenario)) : new Date().getFullYear(); }
function rrllBudgetSimulationYearError(message = "") { const error = document.getElementById("budgetSimulationYearError"); if (!error) return; error.textContent = message; error.classList.toggle("budget-form-hidden", !message); }
function rrllBudgetSyncSimulationYearInput(scenario = rrllBudgetScenario()) { const input = document.getElementById("budgetSimulationYear"); if (!input) return; input.value = rrllBudgetSimulationYear(scenario); rrllBudgetSimulationYearError(); }
function rrllBudgetReadSimulationYear(scenario = rrllBudgetScenario()) {
  if (!scenario) return 0;
  const input = document.getElementById("budgetSimulationYear");
  const year = Number(input && String(input.value).trim());
  rrllBudgetAssert(Number.isInteger(year) && year >= 1900 && year <= 9999, "Indica un año de simulación válido.");
  rrllBudgetSimulationYears.set(scenario.id, year);
  rrllBudgetSimulationYearError();
  return year;
}

async function rrllBudgetCalendarContext() {
  if (typeof hydrateTicketRestaurantCalendars === "function") await hydrateTicketRestaurantCalendars();
  const runtime = typeof getTicketRestaurantCalendarRuntime === "function" ? getTicketRestaurantCalendarRuntime() : null;
  const domain = window.TicketCalendarDomain;
  return {
    calendars: runtime && runtime.calendars ? runtime.calendars : (typeof TICKET_RESTAURANT_CALENDARS !== "undefined" ? [...TICKET_RESTAURANT_CALENDARS] : []),
    normalizeTicketCalendar(calendar) { return typeof normalizeTicketCalendar === "function" ? normalizeTicketCalendar(calendar) : domain.normalizeTicketCalendar(calendar, runtime && runtime.optionsForDomain); },
    isKnownTicketCalendar(calendar) { return typeof isKnownTicketCalendar === "function" ? isKnownTicketCalendar(calendar) : domain.isKnownTicketCalendar(calendar, runtime && runtime.optionsForDomain); },
    countTicketDaysForCalendar(calendar, year, month) {
      if (!domain || typeof domain.countTicketDaysForCalendar !== "function") return 0;
      return domain.countTicketDaysForCalendar({ calendarName: calendar, year, month, calendarMarks: runtime && runtime.calendarMarks, ...(runtime && runtime.optionsForDomain ? runtime.optionsForDomain : {}) });
    }
  };
}

async function initializeBudgetModule() {
  if (rrllBudgetInitialized) return;
  if (rrllBudgetInitializePromise) return await rrllBudgetInitializePromise;
  const bridge = rrllBudgetBridge();
  if (!bridge || typeof bridge.loadBudgetScenarios !== "function") return;
  rrllBudgetInitializePromise = refreshBudgetModule()
    .then(() => { rrllBudgetInitialized = true; })
    .catch(error => { console.error("No se pudo iniciar Presupuestos:", error); })
    .finally(() => { rrllBudgetInitializePromise = null; });
  return await rrllBudgetInitializePromise;
}

async function refreshBudgetModule() {
  rrllBudgetScenarios = await rrllBudgetBridge().loadBudgetScenarios();
  if (rrllBudgetSelectedScenarioId && !rrllBudgetScenarios.some(item => item.id === rrllBudgetSelectedScenarioId)) rrllBudgetSelectedScenarioId = "";
  rrllBudgetSyncSimulationYearInput();
  renderBudgetComparisonSelectors();
  renderBudgetActualComparisonSelectors();
  await renderBudgetActuals();
  await renderBudgetScenarios();
  await loadSelectedBudgetScenario();
}

async function renderBudgetScenarios() {
  const body = document.getElementById("budgetScenarioRows");
  if (!body) return;
  const rows = await Promise.all(rrllBudgetScenarios.map(async scenario => {
    const [manualItems, ticketGroups] = await Promise.all([rrllBudgetBridge().loadBudgetManualItems(scenario.id), rrllBudgetBridge().loadBudgetTicketGroups(scenario.id)]);
    return { scenario, manualItems, ticketGroups };
  }));
  const needsTicketCalendars = rows.some(({ ticketGroups }) => ticketGroups.some(group => group.calculation_type === "calendar_people"));
  const context = needsTicketCalendars ? await rrllBudgetCalendarContext() : {};
  rows.forEach(row => { row.totals = BudgetDomain.calculateBudgetScenarioYear({ ...row, context, simulationYear: rrllBudgetSimulationYear(row.scenario) }); });
  body.innerHTML = rows.length ? rows.map(({ scenario, totals }) => `<tr class="${scenario.id === rrllBudgetSelectedScenarioId ? "budget-row-selected" : ""}"><td>${rrllBudgetEscape(scenario.name)}</td><td>${scenario.year}</td><td>${rrllBudgetMoney(scenario.ticket_amount)}</td><td>${rrllBudgetMoney(totals.totalManual)}</td><td>${rrllBudgetMoney(totals.totalTicket)}</td><td><strong>${rrllBudgetMoney(totals.totalScenario)}</strong></td><td><div class="budget-actions-inline"><button class="secondary" type="button" onclick="editBudgetScenario('${scenario.id}')">Editar</button><button class="secondary" type="button" onclick="duplicateBudgetScenario('${scenario.id}')">Duplicar</button><button type="button" onclick="simulateBudgetScenario('${scenario.id}')">Simular</button></div></td></tr>`).join("") : '<tr><td colspan="7" class="muted">Todavía no hay escenarios de presupuesto.</td></tr>';
}

async function selectBudgetScenario(id) { rrllBudgetSelectedScenarioId = id; rrllBudgetSyncSimulationYearInput(); await renderBudgetScenarios(); await loadSelectedBudgetScenario(); }
async function simulateBudgetScenario(id = rrllBudgetSelectedScenarioId) {
  const scenario = rrllBudgetScenarios.find(item => item.id === id);
  if (!scenario) return;
  try {
    rrllBudgetReadSimulationYear(scenario);
    rrllBudgetSelectedScenarioId = id;
    await renderBudgetScenarios();
    await loadSelectedBudgetScenario();
  } catch (error) { rrllBudgetSimulationYearError(error.message); }
}
async function recalculateBudgetScenario() { await simulateBudgetScenario(rrllBudgetSelectedScenarioId); }
async function loadSelectedBudgetScenario() {
  const scenario = rrllBudgetScenario();
  document.getElementById("budgetSelectedScenarioEmpty")?.classList.toggle("budget-form-hidden", !!scenario);
  document.getElementById("budgetSelectedScenario")?.classList.toggle("budget-form-hidden", !scenario);
  if (!scenario) return;
  [rrllBudgetManualItems, rrllBudgetTicketGroups] = await Promise.all([rrllBudgetBridge().loadBudgetManualItems(scenario.id), rrllBudgetBridge().loadBudgetTicketGroups(scenario.id)]);
  await renderBudgetSelectedScenario();
}

async function rrllBudgetCalculatedExportData() {
  const scenario = rrllBudgetScenario();
  rrllBudgetAssert(scenario, "Selecciona y simula un escenario antes de continuar.");
  const simulationYear = rrllBudgetSimulationYear(scenario);
  const needsTicketCalendars = rrllBudgetTicketGroups.some(group => group.calculation_type === "calendar_people");
  const context = needsTicketCalendars ? await rrllBudgetCalendarContext() : {};
  return BudgetDomain.buildBudgetScenarioExportData({ manualItems: rrllBudgetManualItems, ticketGroups: rrllBudgetTicketGroups, scenario, context, simulationYear });
}

async function renderBudgetSelectedScenario() {
  const scenario = rrllBudgetScenario(); if (!scenario) return;
  const simulationYear = rrllBudgetSimulationYear(scenario);
  const needsTicketCalendars = rrllBudgetTicketGroups.some(group => group.calculation_type === "calendar_people");
  const context = needsTicketCalendars ? await rrllBudgetCalendarContext() : {};
  const totals = BudgetDomain.calculateBudgetScenarioYear({ manualItems: rrllBudgetManualItems, ticketGroups: rrllBudgetTicketGroups, scenario, context, simulationYear });
  document.getElementById("budgetSimulatedYear").textContent = simulationYear;
  document.getElementById("budgetMonthlyYear").textContent = simulationYear;
  document.getElementById("budgetSummaryManual").textContent = rrllBudgetMoney(totals.totalManual);
  document.getElementById("budgetSummaryTicket").textContent = rrllBudgetMoney(totals.totalTicket);
  document.getElementById("budgetSummaryTotal").textContent = rrllBudgetMoney(totals.totalScenario);
  document.getElementById("budgetManualItemRows").innerHTML = rrllBudgetManualItems.length ? rrllBudgetManualItems.map(item => `<tr><td>${rrllBudgetEscape(item.concept)}</td><td>${rrllBudgetEscape(item.category)}</td><td>${item.monthly_amount == null ? "—" : rrllBudgetMoney(item.monthly_amount)}</td><td>${item.annual_amount == null ? "—" : `${rrllBudgetMoney(item.annual_amount)} <small>(prevalece)</small>`}</td><td><strong>${rrllBudgetMoney(BudgetDomain.calculateBudgetManualItemYear(item))}</strong></td><td>${rrllBudgetEscape(item.notes)}</td><td><div class="budget-actions-inline"><button class="secondary" type="button" onclick="editBudgetManualItem('${item.id}')">Editar</button><button class="danger" type="button" onclick="deleteBudgetManualItem('${item.id}')">Eliminar</button></div></td></tr>`).join("") : '<tr><td colspan="7" class="muted">No hay partidas manuales.</td></tr>';
  document.getElementById("budgetTicketGroupRows").innerHTML = rrllBudgetTicketGroups.length ? rrllBudgetTicketGroups.map(group => {
    const type = group.calculation_type || "calendar_people";
    const annual = BudgetDomain.calculateBudgetTicketGroupYear(group, scenario, context, simulationYear).totalTicket;
    const absence = type === "calendar_people" ? rrllBudgetPercent(group.absence_rate) : "—";
    const amount = type === "manual_amount" ? "—" : (group.ticket_amount == null ? `Escenario (${rrllBudgetMoney(scenario.ticket_amount)})` : rrllBudgetMoney(group.ticket_amount));
    const tickets = type === "annual_tickets" ? BudgetDomain.normalizeBudgetNumber(group.annual_tickets) : (type === "manual_tickets" ? `${BudgetDomain.normalizeBudgetNumber(group.manual_tickets)} / mes` : "—");
    const calendar = type === "calendar_people" ? group.ticket_calendar : "";
    return `<tr><td>${rrllBudgetEscape(group.name)}</td><td>${type === "calendar_people" ? group.people_count : "—"}</td><td>${rrllBudgetEscape(calendar || "—")}</td><td>${absence}</td><td>${amount}</td><td>${rrllBudgetEscape(rrllBudgetTicketTypeLabel(type))}</td><td>${tickets}</td><td><strong>${rrllBudgetMoney(annual)}</strong></td><td><div class="budget-actions-inline"><button class="secondary" type="button" onclick="editBudgetTicketGroup('${group.id}')">Editar</button><button class="danger" type="button" onclick="deleteBudgetTicketGroup('${group.id}')">Eliminar</button></div></td></tr>`;
  }).join("") : '<tr><td colspan="9" class="muted">No hay grupos Ticket.</td></tr>';
  document.getElementById("budgetMonthlyRows").innerHTML = totals.byMonth.map(item => `<tr><td>${RRLL_BUDGET_MONTH_NAMES[item.month - 1]}</td><td>${rrllBudgetMoney(item.totalManual)}</td><td>${rrllBudgetMoney(item.totalTicket)}</td><td><strong>${rrllBudgetMoney(item.totalScenario)}</strong></td></tr>`).join("");
  document.getElementById("budgetYearManual").textContent = rrllBudgetMoney(totals.totalManual);
  document.getElementById("budgetYearTicket").textContent = rrllBudgetMoney(totals.totalTicket);
  document.getElementById("budgetYearTotal").textContent = rrllBudgetMoney(totals.totalScenario);
}

function rrllBudgetExcelRows(data) {
  const rows = [];
  const add = (...cells) => rows.push(cells);
  add("CABECERA", "Nombre escenario", data.scenario.name);
  add("CABECERA", "Año simulado", data.scenario.simulationYear);
  add("CABECERA", "Importe ticket general", data.scenario.ticketAmount);
  add("CABECERA", "Observaciones", data.scenario.notes);
  add("RESUMEN GLOBAL", "Total partidas manuales", data.summary.totalManual);
  add("RESUMEN GLOBAL", "Total Ticket Restaurante", data.summary.totalTicket);
  add("RESUMEN GLOBAL", "Total escenario", data.summary.totalScenario);
  data.monthly.forEach(item => add("RESUMEN MENSUAL", RRLL_BUDGET_MONTH_NAMES[item.month - 1], item.totalManual, item.totalTicket, item.totalScenario));
  data.manualItems.forEach(item => add("PARTIDA MANUAL", item.concept, item.type, item.monthlyAmount ?? "", item.annualAmount ?? "", item.totalCalculated));
  data.ticketGroups.forEach(group => add("GRUPO TICKET", group.name, group.calendar, rrllBudgetTicketTypeLabel(group.type), group.people, group.manualTickets, group.annualTickets, group.manualAmount, group.ticketAmount, group.absenceRate, group.totalCalculated));
  return rows;
}
async function exportBudgetScenarioExcel() {
  try {
    rrllBudgetAssert(typeof exportExcelData === "function", "La exportación Excel no está disponible.");
    const data = await rrllBudgetCalculatedExportData();
    exportExcelData({ title: `Presupuesto - ${data.scenario.name} - ${data.scenario.simulationYear}`, filename: `presupuesto-${data.scenario.name}-${data.scenario.simulationYear}`.replace(/[^a-zA-Z0-9_-]/g, "-"), headers: ["Sección", "Campo / concepto", "Tipo / valor", "Mensual / Ticket", "Personas", "Tickets mes", "Tickets año", "Importe manual", "Importe ticket", "Absentismo", "Total grupo"], rows: rrllBudgetExcelRows(data) });
  } catch (error) { alert(error.message); }
}
function rrllBudgetPrintTable(headers, rows) { return `<table><thead><tr>${headers.map(header => `<th>${rrllBudgetEscape(header)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map(row => `<tr>${row.map(cell => `<td>${rrllBudgetEscape(cell)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}">Sin registros.</td></tr>`}</tbody></table>`; }
async function printBudgetScenario() {
  try {
    rrllBudgetAssert(typeof openPrintPreviewWithHtml === "function", "La impresión no está disponible.");
    const data = await rrllBudgetCalculatedExportData();
    const monthlyRows = data.monthly.map(item => [RRLL_BUDGET_MONTH_NAMES[item.month - 1], rrllBudgetMoney(item.totalManual), rrllBudgetMoney(item.totalTicket), rrllBudgetMoney(item.totalScenario)]);
    const manualRows = data.manualItems.map(item => [item.concept, item.type, item.monthlyAmount == null ? "—" : rrllBudgetMoney(item.monthlyAmount), item.annualAmount == null ? "—" : rrllBudgetMoney(item.annualAmount), rrllBudgetMoney(item.totalCalculated)]);
    const ticketRows = data.ticketGroups.map(group => [group.name, group.calendar || "—", rrllBudgetTicketTypeLabel(group.type), group.people || "—", group.manualTickets || "—", group.annualTickets || "—", rrllBudgetMoney(group.manualAmount), rrllBudgetMoney(group.ticketAmount), rrllBudgetPercent(group.absenceRate), rrllBudgetMoney(group.totalCalculated)]);
    openPrintPreviewWithHtml(`<h1>Presupuesto · ${rrllBudgetEscape(data.scenario.name)} · ${data.scenario.simulationYear}</h1><h2>Resumen global</h2>${rrllBudgetPrintTable(["Partidas manuales", "Ticket Restaurante", "Total escenario"], [[rrllBudgetMoney(data.summary.totalManual), rrllBudgetMoney(data.summary.totalTicket), rrllBudgetMoney(data.summary.totalScenario)]])}<h2>Resumen mensual</h2>${rrllBudgetPrintTable(["Mes", "Partidas manuales", "Ticket Restaurante", "Total mensual"], monthlyRows)}<h2>Detalle partidas manuales</h2>${rrllBudgetPrintTable(["Concepto", "Tipo", "Importe mensual", "Importe anual", "Total calculado"], manualRows)}<h2>Detalle grupos Ticket</h2>${rrllBudgetPrintTable(["Nombre grupo", "Calendario", "Tipo", "Personas", "Tickets mes", "Tickets año", "Importe manual", "Importe ticket", "Absentismo", "Total anual"], ticketRows)}`);
  } catch (error) { alert(error.message); }
}

function rrllBudgetComparisonPercent(value) { return value == null ? "—" : rrllBudgetPercent(value); }
function rrllBudgetComparisonYear() { const input = document.getElementById("budgetComparisonYear"); const year = Number(input && String(input.value).trim()); rrllBudgetAssert(Number.isInteger(year) && year >= 1900 && year <= 9999, "Indica un año de comparación válido."); return year; }
function invalidateBudgetComparison() { rrllBudgetComparisonData = null; document.getElementById("budgetComparisonResult")?.classList.add("budget-form-hidden"); }
function renderBudgetComparisonSelectors() {
  const selectA = document.getElementById("budgetComparisonScenarioA"); const selectB = document.getElementById("budgetComparisonScenarioB"); const year = document.getElementById("budgetComparisonYear");
  if (!selectA || !selectB || !year) return;
  const selectedA = selectA.value; const selectedB = selectB.value;
  const options = rrllBudgetScenarios.map(scenario => `<option value="${rrllBudgetEscape(scenario.id)}">${rrllBudgetEscape(scenario.name)}</option>`).join("");
  selectA.innerHTML = options; selectB.innerHTML = options;
  selectA.value = rrllBudgetScenarios.some(scenario => scenario.id === selectedA) ? selectedA : (rrllBudgetScenarios[0]?.id || "");
  selectB.value = rrllBudgetScenarios.some(scenario => scenario.id === selectedB) ? selectedB : (rrllBudgetScenarios[1]?.id || rrllBudgetScenarios[0]?.id || "");
  if (!year.value) year.value = rrllBudgetSimulationYear();
  invalidateBudgetComparison();
}
async function rrllBudgetCalculatedComparisonData() {
  const scenarioA = rrllBudgetScenarios.find(scenario => scenario.id === document.getElementById("budgetComparisonScenarioA")?.value);
  const scenarioB = rrllBudgetScenarios.find(scenario => scenario.id === document.getElementById("budgetComparisonScenarioB")?.value);
  const simulationYear = rrllBudgetComparisonYear();
  rrllBudgetAssert(scenarioA && scenarioB, "Selecciona los dos escenarios que deseas comparar.");
  const [[manualItemsA, ticketGroupsA], [manualItemsB, ticketGroupsB]] = await Promise.all([scenarioA, scenarioB].map(async scenario => Promise.all([rrllBudgetBridge().loadBudgetManualItems(scenario.id), rrllBudgetBridge().loadBudgetTicketGroups(scenario.id)])));
  const needsTicketCalendars = [...ticketGroupsA, ...ticketGroupsB].some(group => group.calculation_type === "calendar_people");
  const context = needsTicketCalendars ? await rrllBudgetCalendarContext() : {};
  const dataA = BudgetDomain.buildBudgetScenarioExportData({ manualItems: manualItemsA, ticketGroups: ticketGroupsA, scenario: scenarioA, context, simulationYear });
  const dataB = BudgetDomain.buildBudgetScenarioExportData({ manualItems: manualItemsB, ticketGroups: ticketGroupsB, scenario: scenarioB, context, simulationYear });
  return BudgetDomain.buildBudgetComparisonData({ scenarioA: dataA, scenarioB: dataB });
}
function rrllBudgetComparisonRows(rows, includeCalendar = false) { return rows.map(row => `<tr><td>${rrllBudgetEscape(row.name)}</td>${includeCalendar ? `<td>${rrllBudgetEscape(row.calendar || "—")}</td>` : ""}<td>${rrllBudgetMoney(row.scenarioA)}</td><td>${rrllBudgetMoney(row.scenarioB)}</td><td>${rrllBudgetMoney(row.difference)}</td><td>${rrllBudgetComparisonPercent(row.differencePercent)}</td></tr>`).join(""); }
function renderBudgetComparison(data) {
  document.getElementById("budgetComparisonTitle").textContent = `${data.scenarioA} vs ${data.scenarioB} · Año ${data.simulationYear}`;
  document.getElementById("budgetComparisonTotalA").textContent = rrllBudgetMoney(data.summary.scenarioA); document.getElementById("budgetComparisonTotalB").textContent = rrllBudgetMoney(data.summary.scenarioB); document.getElementById("budgetComparisonDifference").textContent = rrllBudgetMoney(data.summary.difference); document.getElementById("budgetComparisonPercent").textContent = rrllBudgetComparisonPercent(data.summary.differencePercent);
  document.getElementById("budgetComparisonBlockRows").innerHTML = rrllBudgetComparisonRows(data.blocks);
  document.getElementById("budgetComparisonManualRows").innerHTML = rrllBudgetComparisonRows(data.manualItems) || '<tr><td colspan="5" class="muted">No hay partidas manuales.</td></tr>';
  document.getElementById("budgetComparisonTicketRows").innerHTML = rrllBudgetComparisonRows(data.ticketGroups, true) || '<tr><td colspan="6" class="muted">No hay grupos Ticket.</td></tr>';
  document.getElementById("budgetComparisonResult").classList.remove("budget-form-hidden");
}
async function compareBudgetScenarios() { try { rrllBudgetComparisonData = await rrllBudgetCalculatedComparisonData(); renderBudgetComparison(rrllBudgetComparisonData); } catch (error) { alert(error.message); } }
function rrllBudgetComparisonExcelRows(data) { const rows = [["CABECERA", "Escenario A", data.scenarioA], ["CABECERA", "Escenario B", data.scenarioB], ["CABECERA", "Año simulado", data.simulationYear], ["RESUMEN GLOBAL", "Total general", data.summary.scenarioA, data.summary.scenarioB, data.summary.difference, data.summary.differencePercent ?? ""]]; data.blocks.forEach(row => rows.push(["BLOQUE", row.name, row.scenarioA, row.scenarioB, row.difference, row.differencePercent ?? ""])); data.manualItems.forEach(row => rows.push(["PARTIDA MANUAL", row.name, row.scenarioA, row.scenarioB, row.difference, row.differencePercent ?? ""])); data.ticketGroups.forEach(row => rows.push(["GRUPO TICKET", row.name, row.scenarioA, row.scenarioB, row.difference, row.differencePercent ?? "", row.calendar])); return rows; }
function rrllBudgetRequireComparison() { rrllBudgetAssert(rrllBudgetComparisonData, "Compara dos escenarios antes de continuar."); return rrllBudgetComparisonData; }
function exportBudgetComparisonExcel() { try { rrllBudgetAssert(typeof exportExcelData === "function", "La exportación Excel no está disponible."); const data = rrllBudgetRequireComparison(); exportExcelData({ title: `Comparativa presupuestos - ${data.scenarioA} vs ${data.scenarioB} - ${data.simulationYear}`, filename: `comparativa-presupuestos-${data.scenarioA}-${data.scenarioB}-${data.simulationYear}`.replace(/[^a-zA-Z0-9_-]/g, "-"), headers: ["Sección", "Bloque / concepto / grupo", "Escenario A", "Escenario B", "Diferencia €", "Diferencia %", "Calendario"], rows: rrllBudgetComparisonExcelRows(data) }); } catch (error) { alert(error.message); } }
function printBudgetComparison() { try { rrllBudgetAssert(typeof openPrintPreviewWithHtml === "function", "La impresión no está disponible."); const data = rrllBudgetRequireComparison(); const format = rows => rows.map(row => [row.name, rrllBudgetMoney(row.scenarioA), rrllBudgetMoney(row.scenarioB), rrllBudgetMoney(row.difference), rrllBudgetComparisonPercent(row.differencePercent)]); const tickets = data.ticketGroups.map(row => [row.name, row.calendar || "—", rrllBudgetMoney(row.scenarioA), rrllBudgetMoney(row.scenarioB), rrllBudgetMoney(row.difference), rrllBudgetComparisonPercent(row.differencePercent)]); openPrintPreviewWithHtml(`<h1>Comparativa presupuestos · ${rrllBudgetEscape(data.scenarioA)} vs ${rrllBudgetEscape(data.scenarioB)} · ${data.simulationYear}</h1><h2>Resumen global</h2>${rrllBudgetPrintTable(["Escenario A", "Escenario B", "Diferencia €", "Diferencia %"], [[rrllBudgetMoney(data.summary.scenarioA), rrllBudgetMoney(data.summary.scenarioB), rrllBudgetMoney(data.summary.difference), rrllBudgetComparisonPercent(data.summary.differencePercent)]])}<h2>Comparación por bloques</h2>${rrllBudgetPrintTable(["Bloque", "Escenario A", "Escenario B", "Diferencia €", "Diferencia %"], format(data.blocks))}<h2>Detalle partidas manuales</h2>${rrllBudgetPrintTable(["Concepto", "Escenario A", "Escenario B", "Diferencia €", "Diferencia %"], format(data.manualItems))}<h2>Detalle grupos Ticket</h2>${rrllBudgetPrintTable(["Grupo", "Calendario", "Escenario A", "Escenario B", "Diferencia €", "Diferencia %"], tickets)}`); } catch (error) { alert(error.message); } }

function rrllBudgetActualListYear() { const input = document.getElementById("budgetActualListYear"); const year = Number(input && input.value); return Number.isInteger(year) ? year : new Date().getFullYear(); }
function rrllBudgetActualPercent(value) { return value === null ? "N/A" : rrllBudgetPercent(value); }
function invalidateBudgetActualComparison() { rrllBudgetActualComparisonData = null; document.getElementById("budgetActualComparisonResult")?.classList.add("budget-form-hidden"); invalidateBudgetActualDashboard(); }
function renderBudgetActualComparisonSelectors() {
  const scenario = document.getElementById("budgetActualComparisonScenario"); const year = document.getElementById("budgetActualComparisonYear"); const cutoff = document.getElementById("budgetActualComparisonCutoff"); const listYear = document.getElementById("budgetActualListYear"); const dashboardScenario = document.getElementById("budgetActualDashboardScenario"); const dashboardYear = document.getElementById("budgetActualDashboardYear"); const dashboardCutoff = document.getElementById("budgetActualDashboardCutoff");
  if (!scenario || !year || !cutoff || !listYear) return;
  const options = rrllBudgetScenarios.map(item => `<option value="${rrllBudgetEscape(item.id)}">${rrllBudgetEscape(item.name)}</option>`).join("");
  [scenario, dashboardScenario].filter(Boolean).forEach(select => { const selected = select.value; select.innerHTML = options; if (rrllBudgetScenarios.some(item => item.id === selected)) select.value = selected; });
  if (!year.value) year.value = new Date().getFullYear(); if (!cutoff.value) cutoff.value = new Date().getMonth() + 1; if (!listYear.value) listYear.value = year.value;
  if (dashboardYear && !dashboardYear.value) dashboardYear.value = year.value; if (dashboardCutoff && !dashboardCutoff.value) dashboardCutoff.value = cutoff.value;
}
async function renderBudgetActuals() {
  const body = document.getElementById("budgetActualRows"); if (!body || typeof rrllBudgetBridge().loadBudgetActuals !== "function") return;
  rrllBudgetActuals = await rrllBudgetBridge().loadBudgetActuals(rrllBudgetActualListYear());
  body.innerHTML = rrllBudgetActuals.length ? rrllBudgetActuals.map(actual => `<tr><td>${actual.year}</td><td>${rrllBudgetEscape(RRLL_BUDGET_MONTH_NAMES[actual.month - 1])}</td><td>${rrllBudgetEscape(actual.block)}</td><td>${rrllBudgetEscape(actual.concept)}</td><td>${rrllBudgetMoney(actual.amount)}</td><td>${rrllBudgetEscape(actual.notes)}</td><td><div class="budget-actions-inline"><button class="secondary" type="button" onclick="editBudgetActual('${actual.id}')">Editar</button><button class="danger" type="button" onclick="deleteBudgetActual('${actual.id}')">Eliminar</button></div></td></tr>`).join("") : '<tr><td colspan="7" class="muted">No hay importes reales registrados para este año.</td></tr>';
}
function openBudgetActualForm(actual = {}) { document.getElementById("budgetActualForm").classList.remove("budget-form-hidden"); document.getElementById("budgetActualId").value = actual.id || ""; document.getElementById("budgetActualYear").value = actual.year || rrllBudgetActualListYear(); document.getElementById("budgetActualMonth").value = actual.month || new Date().getMonth() + 1; document.getElementById("budgetActualBlock").value = actual.block || "Otros"; document.getElementById("budgetActualConcept").value = actual.concept || ""; document.getElementById("budgetActualAmount").value = actual.amount ?? ""; document.getElementById("budgetActualNotes").value = actual.notes || ""; }
function closeBudgetActualForm() { document.getElementById("budgetActualForm").classList.add("budget-form-hidden"); }
function editBudgetActual(id) { openBudgetActualForm(rrllBudgetActuals.find(item => item.id === id) || {}); }
async function saveBudgetActualFromForm(event) { event.preventDefault(); try { const year = Number(document.getElementById("budgetActualYear").value); const month = Number(document.getElementById("budgetActualMonth").value); const amount = rrllBudgetInputNumber("budgetActualAmount", NaN); rrllBudgetAssert(Number.isInteger(year), "Indica un año válido."); rrllBudgetAssert(Number.isInteger(month) && month >= 1 && month <= 12, "Selecciona un mes válido."); rrllBudgetAssert(document.getElementById("budgetActualConcept").value.trim(), "El concepto es obligatorio."); rrllBudgetAssert(Number.isFinite(amount) && amount >= 0, "El importe real no puede ser negativo."); rrllBudgetResult(await rrllBudgetBridge().saveBudgetActual({ id: document.getElementById("budgetActualId").value || undefined, year, month, block: document.getElementById("budgetActualBlock").value, concept: document.getElementById("budgetActualConcept").value, amount, notes: document.getElementById("budgetActualNotes").value })); document.getElementById("budgetActualListYear").value = year; closeBudgetActualForm(); invalidateBudgetActualComparison(); await renderBudgetActuals(); } catch (error) { alert(error.message); } }
async function deleteBudgetActual(id) { if (!confirm("¿Eliminar este importe real ejecutado?")) return; rrllBudgetResult(await rrllBudgetBridge().deleteBudgetActual(id)); invalidateBudgetActualComparison(); await renderBudgetActuals(); }
async function rrllBudgetCalculatedActualComparisonData(filters = {}) { const scenarioId = filters.scenarioId || document.getElementById("budgetActualComparisonScenario").value; const scenario = rrllBudgetScenarios.find(item => item.id === scenarioId); const simulationYear = Number(filters.simulationYear || document.getElementById("budgetActualComparisonYear").value); const cutoffMonth = Number(filters.cutoffMonth || document.getElementById("budgetActualComparisonCutoff").value); rrllBudgetAssert(scenario, "Selecciona un escenario presupuestario."); rrllBudgetAssert(Number.isInteger(simulationYear), "Indica un año de simulación válido."); const [manualItems, ticketGroups, actuals] = await Promise.all([rrllBudgetBridge().loadBudgetManualItems(scenario.id), rrllBudgetBridge().loadBudgetTicketGroups(scenario.id), rrllBudgetBridge().loadBudgetActuals(simulationYear)]); const needsTicketCalendars = ticketGroups.some(group => group.calculation_type === "calendar_people"); const context = needsTicketCalendars ? await rrllBudgetCalendarContext() : {}; const budgetResult = BudgetDomain.calculateBudgetScenarioYear({ manualItems, ticketGroups, scenario, context, simulationYear }); return { scenario: scenario.name, ...BudgetDomain.buildBudgetActualComparisonData({ budgetResult, actuals, cutoffMonth }) }; }
function rrllBudgetActualComparisonRows(rows, concepts = false) { return rows.map(row => `<tr><td>${rrllBudgetEscape(row.block)}</td>${concepts ? `<td>${rrllBudgetEscape(row.concept)}</td>` : ""}<td>${rrllBudgetMoney(row.budgetAccumulated)}</td><td>${rrllBudgetMoney(row.actualAccumulated)}</td><td>${rrllBudgetMoney(row.difference)}</td><td>${rrllBudgetActualPercent(row.differencePercent)}</td></tr>`).join(""); }
function renderBudgetActualComparison(data) { document.getElementById("budgetActualComparisonTitle").textContent = `${data.scenario} · ${data.simulationYear} · corte ${RRLL_BUDGET_MONTH_NAMES[data.cutoffMonth - 1]}`; document.getElementById("budgetActualAnnualBudget").textContent = rrllBudgetMoney(data.summary.annualBudget); document.getElementById("budgetActualAccumulatedBudget").textContent = rrllBudgetMoney(data.summary.budgetAccumulated); document.getElementById("budgetActualAccumulatedReal").textContent = rrllBudgetMoney(data.summary.actualAccumulated); document.getElementById("budgetActualDifference").textContent = rrllBudgetMoney(data.summary.difference); document.getElementById("budgetActualPercent").textContent = rrllBudgetActualPercent(data.summary.differencePercent); document.getElementById("budgetActualBlockRows").innerHTML = rrllBudgetActualComparisonRows(data.blocks) || '<tr><td colspan="5" class="muted">No hay bloques presupuestados ni reales.</td></tr>'; document.getElementById("budgetActualConceptRows").innerHTML = rrllBudgetActualComparisonRows(data.concepts, true) || '<tr><td colspan="6" class="muted">No hay conceptos presupuestados ni reales.</td></tr>'; document.getElementById("budgetActualComparisonResult").classList.remove("budget-form-hidden"); }
async function compareBudgetActuals() { try { rrllBudgetActualComparisonData = await rrllBudgetCalculatedActualComparisonData(); renderBudgetActualComparison(rrllBudgetActualComparisonData); } catch (error) { alert(error.message); } }
function rrllBudgetRequireActualComparison() { rrllBudgetAssert(rrllBudgetActualComparisonData, "Genera el informe Presupuesto vs Real antes de continuar."); return rrllBudgetActualComparisonData; }
function rrllBudgetActualExcelRows(data) { const rows = [["CABECERA", "Escenario", data.scenario], ["CABECERA", "Año simulado", data.simulationYear], ["CABECERA", "Mes de corte", RRLL_BUDGET_MONTH_NAMES[data.cutoffMonth - 1]], ["RESUMEN GLOBAL", "Presupuesto anual", data.summary.annualBudget], ["RESUMEN GLOBAL", "Presupuesto acumulado", data.summary.budgetAccumulated], ["RESUMEN GLOBAL", "Real acumulado", data.summary.actualAccumulated], ["RESUMEN GLOBAL", "Desviación €", data.summary.difference], ["RESUMEN GLOBAL", "Desviación %", data.summary.differencePercent ?? "N/A"]]; data.blocks.forEach(row => rows.push(["BLOQUE", row.block, row.budgetAccumulated, row.actualAccumulated, row.difference, row.differencePercent ?? "N/A"])); data.concepts.forEach(row => rows.push(["CONCEPTO", row.block, row.concept, row.budgetAccumulated, row.actualAccumulated, row.difference, row.differencePercent ?? "N/A"])); data.actuals.forEach(row => rows.push(["REAL UTILIZADO", row.block, row.concept, row.amount, row.year, RRLL_BUDGET_MONTH_NAMES[row.month - 1], row.notes])); return rows; }
function exportBudgetActualComparisonExcel() { try { rrllBudgetAssert(typeof exportExcelData === "function", "La exportación Excel no está disponible."); const data = rrllBudgetRequireActualComparison(); exportExcelData({ title: `Presupuesto vs Real - ${data.scenario} - ${data.simulationYear} - ${RRLL_BUDGET_MONTH_NAMES[data.cutoffMonth - 1]}`, filename: `presupuesto-vs-real-${data.scenario}-${data.simulationYear}-${data.cutoffMonth}`.replace(/[^a-zA-Z0-9_-]/g, "-"), headers: ["Sección", "Bloque / campo", "Concepto / valor", "Presupuesto / importe", "Real / año", "Desviación / mes", "Desviación % / observaciones"], rows: rrllBudgetActualExcelRows(data) }); } catch (error) { alert(error.message); } }
function printBudgetActualComparison() { try { rrllBudgetAssert(typeof openPrintPreviewWithHtml === "function", "La impresión no está disponible."); const data = rrllBudgetRequireActualComparison(); const blocks = data.blocks.map(row => [row.block, rrllBudgetMoney(row.budgetAccumulated), rrllBudgetMoney(row.actualAccumulated), rrllBudgetMoney(row.difference), rrllBudgetActualPercent(row.differencePercent)]); const concepts = data.concepts.map(row => [row.block, row.concept, rrllBudgetMoney(row.budgetAccumulated), rrllBudgetMoney(row.actualAccumulated), rrllBudgetMoney(row.difference), rrllBudgetActualPercent(row.differencePercent)]); openPrintPreviewWithHtml(`<h1>Presupuesto vs Real ejecutado · ${rrllBudgetEscape(data.scenario)}</h1><p>Año ${data.simulationYear} · Mes de corte: ${rrllBudgetEscape(RRLL_BUDGET_MONTH_NAMES[data.cutoffMonth - 1])}</p><h2>Resumen global</h2>${rrllBudgetPrintTable(["Presupuesto anual", "Presupuesto acumulado", "Real acumulado", "Desviación €", "Desviación %"], [[rrllBudgetMoney(data.summary.annualBudget), rrllBudgetMoney(data.summary.budgetAccumulated), rrllBudgetMoney(data.summary.actualAccumulated), rrllBudgetMoney(data.summary.difference), rrllBudgetActualPercent(data.summary.differencePercent)]])}<h2>Detalle por bloque</h2>${rrllBudgetPrintTable(["Bloque", "Presupuesto acumulado", "Real acumulado", "Desviación €", "Desviación %"], blocks)}<h2>Detalle por concepto</h2>${rrllBudgetPrintTable(["Bloque", "Concepto", "Presupuesto acumulado", "Real acumulado", "Desviación €", "Desviación %"], concepts)}`); } catch (error) { alert(error.message); } }


function invalidateBudgetActualDashboard() { rrllBudgetActualDashboardData = null; document.getElementById("budgetActualDashboardResult")?.classList.add("budget-form-hidden"); }
function rrllBudgetDashboardSvgText(value, x, y, options = "") { return `<text x="${x}" y="${y}" ${options}>${rrllBudgetEscape(value)}</text>`; }
function rrllBudgetMonthlyDashboardSvg(rows) {
  const width = 960; const height = 330; const left = 92; const top = 30; const chartHeight = 230; const chartWidth = 836; const max = Math.max(1, ...rows.flatMap(row => [row.budget, row.actual, Math.abs(row.difference)])); const scale = chartHeight / max; const groupWidth = chartWidth / Math.max(rows.length, 1); const barWidth = Math.min(18, groupWidth / 4);
  const grid = [0, .25, .5, .75, 1].map(step => { const y = top + chartHeight - chartHeight * step; return `<line x1="${left}" y1="${y}" x2="${left + chartWidth}" y2="${y}" class="budget-chart-grid" stroke="currentColor" opacity=".18"/>${rrllBudgetDashboardSvgText(rrllBudgetMoney(max * step), left - 8, y + 4, 'text-anchor="end" class="budget-chart-label"')}`; }).join("");
  const bars = rows.map((row, index) => { const x = left + index * groupWidth + groupWidth / 2; const budgetHeight = row.budget * scale; const actualHeight = row.actual * scale; const differenceHeight = Math.abs(row.difference) * scale; const zero = top + chartHeight; const month = RRLL_BUDGET_MONTH_NAMES[row.month - 1]; const tooltip = rrllBudgetEscape(`${month} · Presupuesto: ${rrllBudgetMoney(row.budget)} · Real: ${rrllBudgetMoney(row.actual)} · Desviación: ${rrllBudgetMoney(row.difference)}`); return `<g><title>${tooltip}</title><rect x="${x - barWidth * 1.6}" y="${zero - budgetHeight}" width="${barWidth}" height="${budgetHeight}" fill="#2563eb"/><rect x="${x - barWidth / 2}" y="${zero - actualHeight}" width="${barWidth}" height="${actualHeight}" fill="#0f766e"/><rect x="${x + barWidth * .6}" y="${zero - differenceHeight}" width="${barWidth}" height="${differenceHeight}" fill="${row.difference < 0 ? "#dc2626" : "#d97706"}"/>${rrllBudgetDashboardSvgText(month.slice(0, 3), x, height - 28, 'text-anchor="middle" class="budget-chart-label"')}</g>`; }).join("");
  return `<svg class="budget-chart-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="width:100%;height:auto" role="img" aria-label="Evolución mensual de presupuesto, real y desviación">${grid}<line x1="${left}" y1="${top}" x2="${left}" y2="${top + chartHeight}" class="budget-chart-axis" stroke="currentColor"/><line x1="${left}" y1="${top + chartHeight}" x2="${left + chartWidth}" y2="${top + chartHeight}" class="budget-chart-axis" stroke="currentColor"/>${bars}<g class="budget-chart-legend"><rect x="${left}" y="8" width="12" height="12" fill="#2563eb"/>${rrllBudgetDashboardSvgText("Presupuesto", left + 18, 19)}<rect x="${left + 130}" y="8" width="12" height="12" fill="#0f766e"/>${rrllBudgetDashboardSvgText("Real", left + 148, 19)}<rect x="${left + 220}" y="8" width="12" height="12" fill="#d97706"/>${rrllBudgetDashboardSvgText("Desviación positiva", left + 238, 19)}<rect x="${left + 400}" y="8" width="12" height="12" fill="#dc2626"/>${rrllBudgetDashboardSvgText("Desviación negativa", left + 418, 19)}</g></svg>`;
}
function rrllBudgetBlockDashboardSvg(rows) {
  const width = 960; const left = 245; const center = 590; const maxWidth = 320; const rowHeight = 38; const height = rows.length * rowHeight + 38; const max = Math.max(1, ...rows.map(row => Math.abs(row.difference))); const bars = rows.map((row, index) => { const y = 25 + index * rowHeight; const length = Math.abs(row.difference) / max * maxWidth; const x = row.difference < 0 ? center - length : center; return `${rrllBudgetDashboardSvgText(row.block, left - 12, y + 14, 'text-anchor="end" class="budget-chart-label"')}<rect x="${x}" y="${y}" width="${length}" height="18" fill="${row.difference < 0 ? "#dc2626" : "#d97706"}"/>${rrllBudgetDashboardSvgText(rrllBudgetMoney(row.difference), row.difference < 0 ? x - 8 : x + length + 8, y + 14, `${row.difference < 0 ? 'text-anchor="end"' : ''} class="budget-chart-label"`)}`; }).join(""); return `<svg class="budget-chart-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="width:100%;height:auto" role="img" aria-label="Desviación acumulada por bloque"><line x1="${center}" y1="12" x2="${center}" y2="${height - 12}" stroke="currentColor"/>${bars}</svg>`;
}
function rrllBudgetDashboardCards(data) { return `<section class="budget-summary budget-dashboard-summary"><div><span>Presupuesto acumulado</span><strong>${rrllBudgetMoney(data.summary.budgetAccumulated)}</strong></div><div><span>Real acumulado</span><strong>${rrllBudgetMoney(data.summary.actualAccumulated)}</strong></div><div><span>Desviación €</span><strong>${rrllBudgetMoney(data.summary.difference)}</strong></div><div><span>Desviación %</span><strong>${rrllBudgetActualPercent(data.summary.differencePercent)}</strong></div><div><span>Presupuesto anual total</span><strong>${rrllBudgetMoney(data.summary.annualBudget)}</strong></div><div><span>Real acumulado / presupuesto anual</span><strong>${rrllBudgetActualPercent(data.summary.actualAnnualBudgetPercent)}</strong></div></section>`; }
function rrllBudgetDashboardConceptTable(data) { const rows = data.concepts.map(row => [row.block, row.concept, rrllBudgetMoney(row.budgetAccumulated), rrllBudgetMoney(row.actualAccumulated), rrllBudgetMoney(row.difference), rrllBudgetActualPercent(row.differencePercent)]); return rrllBudgetPrintTable(["Bloque", "Concepto", "Presupuesto acumulado", "Real acumulado", "Desviación €", "Desviación %"], rows); }
function rrllBudgetDashboardHtml(data, printable = false) { return `${printable ? "<h1>Dashboard Presupuesto vs Real</h1>" : ""}<p><strong>Filtros aplicados:</strong> escenario ${rrllBudgetEscape(data.scenario)} · año ${data.simulationYear} · mes de corte ${rrllBudgetEscape(RRLL_BUDGET_MONTH_NAMES[data.cutoffMonth - 1])}</p>${rrllBudgetDashboardCards(data)}<h4>Gráfico mensual</h4>${rrllBudgetMonthlyDashboardSvg(data.monthly)}<h4>Desviación por bloque</h4>${rrllBudgetBlockDashboardSvg(data.blocks)}<h4>Mayores desviaciones por concepto</h4>${rrllBudgetDashboardConceptTable(data)}`; }
function renderBudgetActualDashboard(data) { const result = document.getElementById("budgetActualDashboardResult"); result.innerHTML = `<div class="budget-section-heading"><h3>Dashboard Presupuesto vs Real</h3><button class="secondary" type="button" onclick="printBudgetActualDashboard()">Imprimir dashboard</button></div>${rrllBudgetDashboardHtml(data)}`; result.classList.remove("budget-form-hidden"); }
async function openBudgetActualDashboard() { try { const filters = { scenarioId: document.getElementById("budgetActualDashboardScenario").value, simulationYear: Number(document.getElementById("budgetActualDashboardYear").value), cutoffMonth: Number(document.getElementById("budgetActualDashboardCutoff").value) }; const comparison = await rrllBudgetCalculatedActualComparisonData(filters); rrllBudgetActualDashboardData = BudgetDomain.buildBudgetActualDashboardData(comparison); renderBudgetActualDashboard(rrllBudgetActualDashboardData); } catch (error) { alert(error.message); } }
function printBudgetActualDashboard() { try { rrllBudgetAssert(typeof openPrintPreviewWithHtml === "function", "La impresión no está disponible."); rrllBudgetAssert(rrllBudgetActualDashboardData, "Genera el dashboard antes de continuar."); openPrintPreviewWithHtml(rrllBudgetDashboardHtml(rrllBudgetActualDashboardData, true)); } catch (error) { alert(error.message); } }

function openBudgetScenarioForm(scenario = {}) { document.getElementById("budgetScenarioForm").classList.remove("budget-form-hidden"); document.getElementById("budgetScenarioId").value = scenario.id || ""; document.getElementById("budgetScenarioName").value = scenario.name || ""; document.getElementById("budgetScenarioYear").value = scenario.year || new Date().getFullYear(); document.getElementById("budgetScenarioTicketAmount").value = scenario.ticket_amount ?? "0"; document.getElementById("budgetScenarioNotes").value = scenario.notes || ""; }
function closeBudgetScenarioForm() { document.getElementById("budgetScenarioForm").classList.add("budget-form-hidden"); }
function editBudgetScenario(id) { openBudgetScenarioForm(rrllBudgetScenarios.find(item => item.id === id)); }
function duplicateBudgetScenario(id) { const scenario = rrllBudgetScenarios.find(item => item.id === id); if (!scenario) return; document.getElementById("budgetDuplicateScenarioForm").classList.remove("budget-form-hidden"); document.getElementById("budgetDuplicateScenarioId").value = id; document.getElementById("budgetDuplicateScenarioName").value = `${scenario.name} (copia)`; document.getElementById("budgetDuplicateScenarioName").focus(); }
function closeBudgetDuplicateScenarioForm() { document.getElementById("budgetDuplicateScenarioForm").classList.add("budget-form-hidden"); }
async function saveBudgetDuplicateScenarioFromForm(event) { event.preventDefault(); try { const id = document.getElementById("budgetDuplicateScenarioId").value; const name = document.getElementById("budgetDuplicateScenarioName").value; rrllBudgetAssert(name.trim(), "El nombre del nuevo escenario es obligatorio."); const result = rrllBudgetResult(await rrllBudgetBridge().duplicateBudgetScenario(id, name)); rrllBudgetSelectedScenarioId = result.id; closeBudgetDuplicateScenarioForm(); await refreshBudgetModule(); } catch (error) { alert(error.message); } }
async function saveBudgetScenarioFromForm(event) { event.preventDefault(); try { const year = Number(document.getElementById("budgetScenarioYear").value); const ticket = rrllBudgetInputNumber("budgetScenarioTicketAmount", 0); rrllBudgetAssert(document.getElementById("budgetScenarioName").value.trim(), "El nombre del escenario es obligatorio."); rrllBudgetAssert(Number.isInteger(year), "El año debe ser numérico."); rrllBudgetAssert(Number.isFinite(ticket) && ticket >= 0, "El importe ticket no puede ser negativo."); const result = rrllBudgetResult(await rrllBudgetBridge().saveBudgetScenario({ id: document.getElementById("budgetScenarioId").value || undefined, name: document.getElementById("budgetScenarioName").value, year, ticket_amount: ticket, notes: document.getElementById("budgetScenarioNotes").value })); rrllBudgetSelectedScenarioId = result.id; closeBudgetScenarioForm(); await refreshBudgetModule(); } catch (error) { alert(error.message); } }

function openBudgetManualItemForm(item = {}) { document.getElementById("budgetManualItemForm").classList.remove("budget-form-hidden"); document.getElementById("budgetManualItemId").value = item.id || ""; document.getElementById("budgetManualItemConcept").value = item.concept || ""; document.getElementById("budgetManualItemCategory").value = item.category || ""; document.getElementById("budgetManualItemMonthly").value = item.monthly_amount ?? ""; document.getElementById("budgetManualItemAnnual").value = item.annual_amount ?? ""; document.getElementById("budgetManualItemNotes").value = item.notes || ""; }
function closeBudgetManualItemForm() { document.getElementById("budgetManualItemForm").classList.add("budget-form-hidden"); }
function editBudgetManualItem(id) { openBudgetManualItemForm(rrllBudgetManualItems.find(item => item.id === id)); }
async function saveBudgetManualItemFromForm(event) { event.preventDefault(); try { const monthly = rrllBudgetInputNumber("budgetManualItemMonthly"); const annual = rrllBudgetInputNumber("budgetManualItemAnnual"); rrllBudgetAssert(document.getElementById("budgetManualItemConcept").value.trim(), "El concepto es obligatorio."); rrllBudgetAssert(monthly !== null || annual !== null, "Indica un importe mensual o anual."); rrllBudgetAssert((monthly === null || monthly >= 0) && (annual === null || annual >= 0), "Los importes no pueden ser negativos."); rrllBudgetResult(await rrllBudgetBridge().saveBudgetManualItem({ id: document.getElementById("budgetManualItemId").value || undefined, scenario_id: rrllBudgetSelectedScenarioId, concept: document.getElementById("budgetManualItemConcept").value, category: document.getElementById("budgetManualItemCategory").value, monthly_amount: monthly, annual_amount: annual, notes: document.getElementById("budgetManualItemNotes").value })); closeBudgetManualItemForm(); await refreshBudgetModule(); } catch (error) { alert(error.message); } }
async function deleteBudgetManualItem(id) { if (!confirm("¿Eliminar esta partida manual?")) return; rrllBudgetResult(await rrllBudgetBridge().deleteBudgetManualItem(id)); await refreshBudgetModule(); }

async function populateBudgetTicketCalendars(selected = "") { const context = await rrllBudgetCalendarContext(); const select = document.getElementById("budgetTicketGroupCalendar"); rrllBudgetCalendarFallback = !context.calendars.length; const calendars = context.calendars.length ? context.calendars : [selected].filter(Boolean); select.innerHTML = '<option value="">Selecciona calendario</option>' + calendars.map(calendar => `<option value="${rrllBudgetEscape(calendar)}">${rrllBudgetEscape(calendar)}</option>`).join(""); select.value = selected || ""; }
function resetBudgetTicketGroupForm() { document.getElementById("budgetTicketGroupId").value = ""; document.getElementById("budgetTicketGroupName").value = ""; document.getElementById("budgetTicketGroupType").value = "calendar_people"; document.getElementById("budgetTicketGroupPeople").value = 0; document.getElementById("budgetTicketGroupCalendar").value = ""; document.getElementById("budgetTicketGroupAbsence").value = 0; document.getElementById("budgetTicketGroupAmount").value = ""; document.getElementById("budgetTicketGroupManualTickets").value = ""; document.getElementById("budgetTicketGroupAnnualTickets").value = ""; document.getElementById("budgetTicketGroupManualAmount").value = ""; document.getElementById("budgetTicketGroupNotes").value = ""; document.querySelectorAll("#budgetTicketGroupForm input, #budgetTicketGroupForm select, #budgetTicketGroupForm textarea").forEach(node => { node.disabled = false; }); renderBudgetTicketGroupFieldVisibility(); }
async function openBudgetTicketGroupForm(group) { if (!group) resetBudgetTicketGroupForm(); document.getElementById("budgetTicketGroupForm").classList.remove("budget-form-hidden"); if (!group) { await populateBudgetTicketCalendars(); return; } document.getElementById("budgetTicketGroupId").value = group.id || ""; document.getElementById("budgetTicketGroupName").value = group.name || ""; document.getElementById("budgetTicketGroupType").value = group.calculation_type || "calendar_people"; document.getElementById("budgetTicketGroupPeople").value = group.people_count ?? 0; await populateBudgetTicketCalendars(group.ticket_calendar || ""); document.getElementById("budgetTicketGroupAbsence").value = group.absence_rate == null ? "0" : group.absence_rate * 100; document.getElementById("budgetTicketGroupAmount").value = group.ticket_amount ?? ""; document.getElementById("budgetTicketGroupManualTickets").value = group.manual_tickets ?? ""; document.getElementById("budgetTicketGroupAnnualTickets").value = group.annual_tickets ?? ""; document.getElementById("budgetTicketGroupManualAmount").value = group.manual_monthly_amount ?? ""; document.getElementById("budgetTicketGroupNotes").value = group.notes || ""; renderBudgetTicketGroupFieldVisibility(); }
function closeBudgetTicketGroupForm() { resetBudgetTicketGroupForm(); document.getElementById("budgetTicketGroupForm").classList.add("budget-form-hidden"); }
function editBudgetTicketGroup(id) { openBudgetTicketGroupForm(rrllBudgetTicketGroups.find(item => item.id === id)); }
function renderBudgetTicketGroupFieldVisibility() { const type = document.getElementById("budgetTicketGroupType").value; const shown = type === "calendar_people" ? ["people", "calendar", "absence", "ticket-amount"] : type === "manual_tickets" ? ["manual-tickets", "ticket-amount"] : type === "annual_tickets" ? ["annual-tickets", "ticket-amount"] : ["manual-amount"]; document.querySelectorAll("[data-budget-ticket-field]").forEach(node => node.classList.toggle("budget-form-hidden", !shown.includes(node.dataset.budgetTicketField))); }
async function saveBudgetTicketGroupFromForm(event) { event.preventDefault(); try { const type = document.getElementById("budgetTicketGroupType").value; const people = rrllBudgetInputNumber("budgetTicketGroupPeople", 0); const absence = rrllBudgetRate("budgetTicketGroupAbsence", 0); const ticketAmount = rrllBudgetInputNumber("budgetTicketGroupAmount"); const manualTickets = rrllBudgetInputNumber("budgetTicketGroupManualTickets"); const annualTickets = rrllBudgetInputNumber("budgetTicketGroupAnnualTickets"); const manualAmount = rrllBudgetInputNumber("budgetTicketGroupManualAmount"); const calendar = document.getElementById("budgetTicketGroupCalendar").value; const context = type === "calendar_people" ? await rrllBudgetCalendarContext() : null; rrllBudgetAssert(document.getElementById("budgetTicketGroupName").value.trim(), "El nombre del grupo es obligatorio."); rrllBudgetAssert(["calendar_people", "manual_tickets", "manual_amount", "annual_tickets"].includes(type), "Selecciona un tipo de cálculo válido."); rrllBudgetAssert(Number.isFinite(people) && people >= 0, "El número de personas no puede ser negativo."); rrllBudgetAssert(absence === null || (Number.isFinite(absence) && absence >= 0 && absence <= 1), "El absentismo propio debe estar entre 0 % y 100 %."); rrllBudgetAssert(ticketAmount === null || (Number.isFinite(ticketAmount) && ticketAmount >= 0), "El importe ticket propio no puede ser negativo."); if (type === "calendar_people") { rrllBudgetAssert(calendar, "Selecciona un calendario Ticket."); rrllBudgetAssert(context.isKnownTicketCalendar(calendar) || rrllBudgetCalendarFallback, "El calendario Ticket seleccionado no está disponible."); } if (type === "manual_tickets") rrllBudgetAssert(Number.isFinite(manualTickets) && manualTickets >= 0, "Indica tickets manuales válidos."); if (type === "annual_tickets") rrllBudgetAssert(Number.isFinite(annualTickets) && annualTickets >= 0, "Indica tickets anuales válidos."); if (type === "manual_amount") rrllBudgetAssert(Number.isFinite(manualAmount) && manualAmount >= 0, "Indica un importe mensual manual válido."); rrllBudgetResult(await rrllBudgetBridge().saveBudgetTicketGroup({ id: document.getElementById("budgetTicketGroupId").value || undefined, scenario_id: rrllBudgetSelectedScenarioId, name: document.getElementById("budgetTicketGroupName").value, people_count: people, ticket_calendar: calendar, absence_rate: absence, ticket_amount: ticketAmount, calculation_type: type, manual_tickets: manualTickets, annual_tickets: annualTickets, manual_monthly_amount: manualAmount, notes: document.getElementById("budgetTicketGroupNotes").value })); closeBudgetTicketGroupForm(); await refreshBudgetModule(); } catch (error) { alert(error.message); } }
async function deleteBudgetTicketGroup(id) { if (!confirm("¿Eliminar este grupo Ticket?")) return; rrllBudgetResult(await rrllBudgetBridge().deleteBudgetTicketGroup(id)); closeBudgetTicketGroupForm(); await refreshBudgetModule(); }

window.initializeBudgetModule = initializeBudgetModule;
