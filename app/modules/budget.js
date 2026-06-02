const RRLL_BUDGET_MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
let rrllBudgetScenarios = [];
let rrllBudgetManualItems = [];
let rrllBudgetTicketGroups = [];
let rrllBudgetSelectedScenarioId = "";
let rrllBudgetCalendarFallback = false;
let rrllBudgetInitialized = false;
let rrllBudgetInitializePromise = null;
const rrllBudgetSimulationYears = new Map();

function rrllBudgetBridge() { return window.rrllDB || null; }
function rrllBudgetScenario() { return rrllBudgetScenarios.find(item => item.id === rrllBudgetSelectedScenarioId) || null; }
function rrllBudgetHasValue(value) { return value !== null && value !== undefined && String(value).trim() !== ""; }
function rrllBudgetEscape(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function rrllBudgetMoney(value) { return `${BudgetDomain.normalizeBudgetNumber(value).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`; }
function rrllBudgetPercent(value) { return `${(BudgetDomain.normalizeBudgetRate(value) * 100).toLocaleString("es-ES", { maximumFractionDigits: 2 })} %`; }
function rrllBudgetInputNumber(id, fallback = null) { const value = document.getElementById(id).value; return rrllBudgetHasValue(value) ? BudgetDomain.normalizeBudgetNumber(value, NaN) : fallback; }
function rrllBudgetRate(id, fallback = null) { const value = document.getElementById(id).value; return rrllBudgetHasValue(value) ? BudgetDomain.normalizeBudgetRate(value, NaN) : fallback; }
function rrllBudgetAssert(condition, message) { if (!condition) throw new Error(message); }
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
  document.getElementById("budgetTicketGroupRows").innerHTML = rrllBudgetTicketGroups.length ? rrllBudgetTicketGroups.map(group => { const annual = BudgetDomain.calculateBudgetTicketGroupYear(group, scenario, context, simulationYear).totalTicket; const absence = rrllBudgetPercent(group.absence_rate); const amount = group.ticket_amount == null ? `Escenario (${rrllBudgetMoney(scenario.ticket_amount)})` : rrllBudgetMoney(group.ticket_amount); return `<tr><td>${rrllBudgetEscape(group.name)}</td><td>${group.people_count}</td><td>${rrllBudgetEscape(group.ticket_calendar || "—")}</td><td>${absence}</td><td>${amount}</td><td>${rrllBudgetEscape(group.calculation_type)}</td><td><strong>${rrllBudgetMoney(annual)}</strong></td><td><div class="budget-actions-inline"><button class="secondary" type="button" onclick="editBudgetTicketGroup('${group.id}')">Editar</button><button class="danger" type="button" onclick="deleteBudgetTicketGroup('${group.id}')">Eliminar</button></div></td></tr>`; }).join("") : '<tr><td colspan="8" class="muted">No hay grupos Ticket.</td></tr>';
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
  data.ticketGroups.forEach(group => add("GRUPO TICKET", group.name, group.calendar, group.type, group.people, group.manualTickets, group.manualAmount, group.ticketAmount, group.absenceRate, group.totalCalculated));
  return rows;
}
async function exportBudgetScenarioExcel() {
  try {
    rrllBudgetAssert(typeof exportExcelData === "function", "La exportación Excel no está disponible.");
    const data = await rrllBudgetCalculatedExportData();
    exportExcelData({ title: `Presupuesto - ${data.scenario.name} - ${data.scenario.simulationYear}`, filename: `presupuesto-${data.scenario.name}-${data.scenario.simulationYear}`.replace(/[^a-zA-Z0-9_-]/g, "-"), headers: ["Sección", "Campo / concepto", "Tipo / valor", "Mensual / Ticket", "Anual / Personas", "Total / Tickets", "Importe manual", "Importe ticket", "Absentismo", "Total grupo"], rows: rrllBudgetExcelRows(data) });
  } catch (error) { alert(error.message); }
}
function rrllBudgetPrintTable(headers, rows) { return `<table><thead><tr>${headers.map(header => `<th>${rrllBudgetEscape(header)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map(row => `<tr>${row.map(cell => `<td>${rrllBudgetEscape(cell)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}">Sin registros.</td></tr>`}</tbody></table>`; }
async function printBudgetScenario() {
  try {
    rrllBudgetAssert(typeof openPrintPreviewWithHtml === "function", "La impresión no está disponible.");
    const data = await rrllBudgetCalculatedExportData();
    const monthlyRows = data.monthly.map(item => [RRLL_BUDGET_MONTH_NAMES[item.month - 1], rrllBudgetMoney(item.totalManual), rrllBudgetMoney(item.totalTicket), rrllBudgetMoney(item.totalScenario)]);
    const manualRows = data.manualItems.map(item => [item.concept, item.type, item.monthlyAmount == null ? "—" : rrllBudgetMoney(item.monthlyAmount), item.annualAmount == null ? "—" : rrllBudgetMoney(item.annualAmount), rrllBudgetMoney(item.totalCalculated)]);
    const ticketRows = data.ticketGroups.map(group => [group.name, group.calendar || "—", group.type, group.people, group.manualTickets, rrllBudgetMoney(group.manualAmount), rrllBudgetMoney(group.ticketAmount), rrllBudgetPercent(group.absenceRate), rrllBudgetMoney(group.totalCalculated)]);
    openPrintPreviewWithHtml(`<h1>Presupuesto · ${rrllBudgetEscape(data.scenario.name)} · ${data.scenario.simulationYear}</h1><h2>Resumen global</h2>${rrllBudgetPrintTable(["Partidas manuales", "Ticket Restaurante", "Total escenario"], [[rrllBudgetMoney(data.summary.totalManual), rrllBudgetMoney(data.summary.totalTicket), rrllBudgetMoney(data.summary.totalScenario)]])}<h2>Resumen mensual</h2>${rrllBudgetPrintTable(["Mes", "Partidas manuales", "Ticket Restaurante", "Total mensual"], monthlyRows)}<h2>Detalle partidas manuales</h2>${rrllBudgetPrintTable(["Concepto", "Tipo", "Importe mensual", "Importe anual", "Total calculado"], manualRows)}<h2>Detalle grupos Ticket</h2>${rrllBudgetPrintTable(["Nombre grupo", "Calendario", "Tipo", "Personas", "Tickets", "Importe manual", "Importe ticket", "Absentismo", "Total anual"], ticketRows)}`);
  } catch (error) { alert(error.message); }
}

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
function resetBudgetTicketGroupForm() { document.getElementById("budgetTicketGroupId").value = ""; document.getElementById("budgetTicketGroupName").value = ""; document.getElementById("budgetTicketGroupType").value = "calendar_people"; document.getElementById("budgetTicketGroupPeople").value = 0; document.getElementById("budgetTicketGroupCalendar").value = ""; document.getElementById("budgetTicketGroupAbsence").value = 0; document.getElementById("budgetTicketGroupAmount").value = ""; document.getElementById("budgetTicketGroupManualTickets").value = ""; document.getElementById("budgetTicketGroupManualAmount").value = ""; document.getElementById("budgetTicketGroupNotes").value = ""; document.querySelectorAll("#budgetTicketGroupForm input, #budgetTicketGroupForm select, #budgetTicketGroupForm textarea").forEach(node => { node.disabled = false; }); renderBudgetTicketGroupFieldVisibility(); }
async function openBudgetTicketGroupForm(group) { if (!group) resetBudgetTicketGroupForm(); document.getElementById("budgetTicketGroupForm").classList.remove("budget-form-hidden"); if (!group) { await populateBudgetTicketCalendars(); return; } document.getElementById("budgetTicketGroupId").value = group.id || ""; document.getElementById("budgetTicketGroupName").value = group.name || ""; document.getElementById("budgetTicketGroupType").value = group.calculation_type || "calendar_people"; document.getElementById("budgetTicketGroupPeople").value = group.people_count ?? 0; await populateBudgetTicketCalendars(group.ticket_calendar || ""); document.getElementById("budgetTicketGroupAbsence").value = group.absence_rate == null ? "0" : group.absence_rate * 100; document.getElementById("budgetTicketGroupAmount").value = group.ticket_amount ?? ""; document.getElementById("budgetTicketGroupManualTickets").value = group.manual_tickets ?? ""; document.getElementById("budgetTicketGroupManualAmount").value = group.manual_monthly_amount ?? ""; document.getElementById("budgetTicketGroupNotes").value = group.notes || ""; renderBudgetTicketGroupFieldVisibility(); }
function closeBudgetTicketGroupForm() { resetBudgetTicketGroupForm(); document.getElementById("budgetTicketGroupForm").classList.add("budget-form-hidden"); }
function editBudgetTicketGroup(id) { openBudgetTicketGroupForm(rrllBudgetTicketGroups.find(item => item.id === id)); }
function renderBudgetTicketGroupFieldVisibility() { const type = document.getElementById("budgetTicketGroupType").value; const shown = type === "calendar_people" ? ["people", "calendar", "absence", "ticket-amount"] : type === "manual_tickets" ? ["manual-tickets", "ticket-amount"] : ["manual-amount"]; document.querySelectorAll("[data-budget-ticket-field]").forEach(node => node.classList.toggle("budget-form-hidden", !shown.includes(node.dataset.budgetTicketField))); }
async function saveBudgetTicketGroupFromForm(event) { event.preventDefault(); try { const type = document.getElementById("budgetTicketGroupType").value; const people = rrllBudgetInputNumber("budgetTicketGroupPeople", 0); const absence = rrllBudgetRate("budgetTicketGroupAbsence", 0); const ticketAmount = rrllBudgetInputNumber("budgetTicketGroupAmount"); const manualTickets = rrllBudgetInputNumber("budgetTicketGroupManualTickets"); const manualAmount = rrllBudgetInputNumber("budgetTicketGroupManualAmount"); const calendar = document.getElementById("budgetTicketGroupCalendar").value; const context = type === "calendar_people" ? await rrllBudgetCalendarContext() : null; rrllBudgetAssert(document.getElementById("budgetTicketGroupName").value.trim(), "El nombre del grupo es obligatorio."); rrllBudgetAssert(["calendar_people", "manual_tickets", "manual_amount"].includes(type), "Selecciona un tipo de cálculo válido."); rrllBudgetAssert(Number.isFinite(people) && people >= 0, "El número de personas no puede ser negativo."); rrllBudgetAssert(absence === null || (Number.isFinite(absence) && absence >= 0 && absence <= 1), "El absentismo propio debe estar entre 0 % y 100 %."); rrllBudgetAssert(ticketAmount === null || (Number.isFinite(ticketAmount) && ticketAmount >= 0), "El importe ticket propio no puede ser negativo."); if (type === "calendar_people") { rrllBudgetAssert(calendar, "Selecciona un calendario Ticket."); rrllBudgetAssert(context.isKnownTicketCalendar(calendar) || rrllBudgetCalendarFallback, "El calendario Ticket seleccionado no está disponible."); } if (type === "manual_tickets") rrllBudgetAssert(Number.isFinite(manualTickets) && manualTickets >= 0, "Indica tickets manuales válidos."); if (type === "manual_amount") rrllBudgetAssert(Number.isFinite(manualAmount) && manualAmount >= 0, "Indica un importe mensual manual válido."); rrllBudgetResult(await rrllBudgetBridge().saveBudgetTicketGroup({ id: document.getElementById("budgetTicketGroupId").value || undefined, scenario_id: rrllBudgetSelectedScenarioId, name: document.getElementById("budgetTicketGroupName").value, people_count: people, ticket_calendar: calendar, absence_rate: absence, ticket_amount: ticketAmount, calculation_type: type, manual_tickets: manualTickets, manual_monthly_amount: manualAmount, notes: document.getElementById("budgetTicketGroupNotes").value })); closeBudgetTicketGroupForm(); await refreshBudgetModule(); } catch (error) { alert(error.message); } }
async function deleteBudgetTicketGroup(id) { if (!confirm("¿Eliminar este grupo Ticket?")) return; rrllBudgetResult(await rrllBudgetBridge().deleteBudgetTicketGroup(id)); closeBudgetTicketGroupForm(); await refreshBudgetModule(); }

window.initializeBudgetModule = initializeBudgetModule;
