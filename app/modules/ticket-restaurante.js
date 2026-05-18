const TICKET_RESTAURANT_CALENDARS = ["Servicios Centrales", "Ingeniería Ariz", "Instalaciones Sopela"];
const TICKET_RESTAURANT_MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const TICKET_RESTAURANT_PERSON_HEADERS = ["Nº empleado", "Nombre", "Apellido1", "Apellido2", "DNI", "Puesto", "Calendario"];
const TICKET_RESTAURANT_ABSENCE_HEADERS = ["Nº empleado", "Desde", "Hasta", "Motivo", "Total días"];
const TICKET_RESTAURANT_EXPORT_HEADERS = ["Nombre", "Apellido1", "Apellido2", "DNI", "Pedido", "Nº Emp", "Numero Tickets", "Importe", "Total", "Fec Inicio", "Fec Cad", "Hoja Gastos", "Ausencias"];
const TICKET_RESTAURANT_DEFAULT_CONFIG = { pedido: "2404407", importe: "14,57" };

let ticketRestaurantActiveArea = "calendar";
let ticketRestaurantSelectedCalendar = "Servicios Centrales";
let ticketRestaurantCalendarYear = new Date().getFullYear();
let ticketRestaurantEditingEmployee = null;

function trTodayNextMonth() {
  const now = new Date();
  return { month: now.getMonth() === 11 ? 1 : now.getMonth() + 2, year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear() };
}

function getTicketRestaurantCalendarMarks() {
  return load("rrll_ticket_restaurant_calendar_marks", []);
}

function saveTicketRestaurantCalendarMarks(items) {
  save("rrll_ticket_restaurant_calendar_marks", Array.isArray(items) ? items : []);
}

function getTicketRestaurantPeople() {
  return load("rrll_ticket_restaurant_people", []);
}

function saveTicketRestaurantPeople(items) {
  save("rrll_ticket_restaurant_people", Array.isArray(items) ? items : []);
}

function getTicketRestaurantAbsences() {
  return load("rrll_ticket_restaurant_absences", []);
}

function saveTicketRestaurantAbsences(items) {
  save("rrll_ticket_restaurant_absences", Array.isArray(items) ? items : []);
}

function getTicketRestaurantConfig() {
  const cfg = load("rrll_ticket_restaurant_config", TICKET_RESTAURANT_DEFAULT_CONFIG) || {};
  return { ...TICKET_RESTAURANT_DEFAULT_CONFIG, ...cfg };
}

function saveTicketRestaurantConfig(cfg) {
  save("rrll_ticket_restaurant_config", { ...TICKET_RESTAURANT_DEFAULT_CONFIG, ...(cfg || {}) });
}

function normalizeTicketEmployee(value) {
  return String(value || "").trim();
}

function normalizeTicketCalendar(value) {
  const text = String(value || "").trim();
  return TICKET_RESTAURANT_CALENDARS.find(item => item.toLowerCase() === text.toLowerCase()) || text;
}

function parseTicketNumber(value) {
  const n = Number(String(value || "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function parseTicketDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  let match = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (match) {
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    return `${year}-${String(match[2]).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}`;
  }
  if (/^\d+(\.\d+)?$/.test(text)) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(epoch.getTime() + Number(text) * 86400000);
    return date.toISOString().slice(0, 10);
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function formatTicketDate(value) {
  const iso = parseTicketDate(value);
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function ticketRestaurantMonthYearFromDate(value) {
  const iso = parseTicketDate(value);
  if (!iso) return { month: null, year: null };
  return { month: Number(iso.slice(5, 7)), year: Number(iso.slice(0, 4)) };
}

function ticketRestaurantRowIsEmpty(row) {
  return !row || !row.some(cell => String(cell || "").trim());
}

function ticketRestaurantRowsToObjects(rows, headers) {
  const safeRows = Array.isArray(rows) ? rows.filter(row => !ticketRestaurantRowIsEmpty(row)) : [];
  if (!safeRows.length) return [];
  let start = 0;
  const first = safeRows[0].map(cell => String(cell || "").trim().toLowerCase());
  if (headers.some(header => first.includes(header.toLowerCase()))) start = 1;
  return safeRows.slice(start).map(row => {
    const obj = {};
    headers.forEach((header, index) => { obj[header] = row[index] == null ? "" : String(row[index]).trim(); });
    return obj;
  });
}

function showTicketRestaurantArea(area) {
  ticketRestaurantActiveArea = area || "calendar";
  document.querySelectorAll(".ticket-restaurant-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.ticketArea === ticketRestaurantActiveArea));
  document.querySelectorAll(".ticket-restaurant-area").forEach(panel => panel.hidden = panel.dataset.ticketArea !== ticketRestaurantActiveArea);
  renderTicketRestaurant();
}

function renderTicketRestaurant() {
  renderTicketRestaurantCalendarSelector();
  renderTicketRestaurantCalendar();
  renderTicketRestaurantPeople();
  renderTicketRestaurantAbsences();
  renderTicketRestaurantComputeControls();
  renderTicketRestaurantConfig();
}

function renderTicketRestaurantCalendarSelector() {
  const select = document.getElementById("ticketRestaurantCalendarSelect");
  if (!select) return;
  select.innerHTML = TICKET_RESTAURANT_CALENDARS.map(item => `<option value="${escapeHtml(item)}" ${item === ticketRestaurantSelectedCalendar ? "selected" : ""}>${escapeHtml(item)}</option>`).join("");
  const year = document.getElementById("ticketRestaurantCalendarYear");
  if (year) year.textContent = ticketRestaurantCalendarYear;
}

function setTicketRestaurantCalendar(value) {
  ticketRestaurantSelectedCalendar = normalizeTicketCalendar(value) || TICKET_RESTAURANT_CALENDARS[0];
  renderTicketRestaurantCalendar();
}

function moveTicketRestaurantCalendarYear(delta) {
  ticketRestaurantCalendarYear += Number(delta) || 0;
  renderTicketRestaurantCalendarSelector();
  renderTicketRestaurantCalendar();
}

function ticketRestaurantMarkKey(calendar, date) {
  return `${calendar}__${date}`;
}

function toggleTicketRestaurantNoTicket(date) {
  if (!date) return;
  const marks = getTicketRestaurantCalendarMarks();
  const key = ticketRestaurantMarkKey(ticketRestaurantSelectedCalendar, date);
  const exists = marks.some(item => ticketRestaurantMarkKey(item.calendar, item.date) === key);
  const next = exists ? marks.filter(item => ticketRestaurantMarkKey(item.calendar, item.date) !== key) : [...marks, { calendar: ticketRestaurantSelectedCalendar, date, noTicket: true }];
  saveTicketRestaurantCalendarMarks(next);
  renderTicketRestaurantCalendar();
  if (ticketRestaurantActiveArea === "compute") renderTicketRestaurantComputePreview();
}

function renderTicketRestaurantCalendar() {
  const root = document.getElementById("ticketRestaurantCalendarGrid");
  if (!root) return;
  const marks = new Set(getTicketRestaurantCalendarMarks()
    .filter(item => item && item.calendar === ticketRestaurantSelectedCalendar && item.noTicket)
    .map(item => item.date));
  root.innerHTML = Array.from({ length: 12 }, (_, monthIndex) => {
    const daysInMonth = new Date(ticketRestaurantCalendarYear, monthIndex + 1, 0).getDate();
    const blanks = (new Date(ticketRestaurantCalendarYear, monthIndex, 1).getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < blanks; i += 1) cells.push(`<span class="ticket-day ticket-day-empty"></span>`);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${ticketRestaurantCalendarYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const weekday = new Date(ticketRestaurantCalendarYear, monthIndex, day).getDay();
      const weekend = weekday === 0 || weekday === 6;
      const noTicket = marks.has(date);
      cells.push(`<button type="button" class="ticket-day ${weekend ? "weekend" : ""} ${noTicket ? "no-ticket" : ""}" onclick="toggleTicketRestaurantNoTicket('${date}')" title="${formatTicketDate(date)}${noTicket ? " · Sin ticket" : ""}">${day}</button>`);
    }
    return `<section class="ticket-month-card"><h4>${TICKET_RESTAURANT_MONTHS[monthIndex]}</h4><div class="ticket-weekdays"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="ticket-days-grid">${cells.join("")}</div></section>`;
  }).join("");
}

function openTicketRestaurantPersonForm(employeeNumber) {
  ticketRestaurantEditingEmployee = employeeNumber ? normalizeTicketEmployee(employeeNumber) : null;
  const people = getTicketRestaurantPeople();
  const person = people.find(item => item.employeeNumber === ticketRestaurantEditingEmployee) || {};
  document.getElementById("ticketPersonModalTitle").textContent = ticketRestaurantEditingEmployee ? "Editar persona" : "Nueva persona";
  document.getElementById("ticketPersonEmployee").value = person.employeeNumber || "";
  document.getElementById("ticketPersonName").value = person.name || "";
  document.getElementById("ticketPersonSurname1").value = person.surname1 || "";
  document.getElementById("ticketPersonSurname2").value = person.surname2 || "";
  document.getElementById("ticketPersonDni").value = person.dni || "";
  document.getElementById("ticketPersonPosition").value = person.position || "";
  document.getElementById("ticketPersonCalendar").innerHTML = TICKET_RESTAURANT_CALENDARS.map(item => `<option value="${escapeHtml(item)}" ${item === (person.calendar || ticketRestaurantSelectedCalendar) ? "selected" : ""}>${escapeHtml(item)}</option>`).join("");
  const modal = document.getElementById("ticketPersonModal");
  if (modal) modal.classList.add("open");
}

function closeTicketRestaurantPersonForm() {
  const modal = document.getElementById("ticketPersonModal");
  if (modal) modal.classList.remove("open");
  ticketRestaurantEditingEmployee = null;
}

function saveTicketRestaurantPersonForm() {
  const employeeNumber = normalizeTicketEmployee(document.getElementById("ticketPersonEmployee").value);
  const name = String(document.getElementById("ticketPersonName").value || "").trim();
  const calendar = normalizeTicketCalendar(document.getElementById("ticketPersonCalendar").value);
  if (!employeeNumber || !name || !calendar) {
    alert("Nº empleado, Nombre y Calendario son obligatorios.");
    return;
  }
  const person = {
    employeeNumber,
    name,
    surname1: String(document.getElementById("ticketPersonSurname1").value || "").trim(),
    surname2: String(document.getElementById("ticketPersonSurname2").value || "").trim(),
    dni: String(document.getElementById("ticketPersonDni").value || "").trim(),
    position: String(document.getElementById("ticketPersonPosition").value || "").trim(),
    calendar,
    updatedAt: new Date().toISOString()
  };
  let people = getTicketRestaurantPeople().filter(item => item.employeeNumber !== employeeNumber && item.employeeNumber !== ticketRestaurantEditingEmployee);
  people.push({ ...person, createdAt: (getTicketRestaurantPeople().find(item => item.employeeNumber === employeeNumber) || {}).createdAt || new Date().toISOString() });
  people.sort((a, b) => String(a.employeeNumber).localeCompare(String(b.employeeNumber), "es", { numeric: true }));
  saveTicketRestaurantPeople(people);
  closeTicketRestaurantPersonForm();
  renderTicketRestaurantPeople();
  renderTicketRestaurantComputePreview();
}

function deleteTicketRestaurantPerson(employeeNumber) {
  const safe = normalizeTicketEmployee(employeeNumber);
  if (!safe || !confirm(`¿Eliminar la persona con Nº empleado ${safe}?`)) return;
  saveTicketRestaurantPeople(getTicketRestaurantPeople().filter(item => item.employeeNumber !== safe));
  renderTicketRestaurantPeople();
  renderTicketRestaurantComputePreview();
}

function renderTicketRestaurantPeople() {
  const body = document.getElementById("ticketRestaurantPeopleBody");
  const count = document.getElementById("ticketRestaurantPeopleCount");
  if (!body) return;
  const people = getTicketRestaurantPeople();
  if (count) count.textContent = `${people.length} personas`;
  body.innerHTML = people.length ? people.map(item => `<tr>
    <td>${escapeHtml(item.employeeNumber)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.surname1)}</td><td>${escapeHtml(item.surname2)}</td><td>${escapeHtml(item.dni)}</td><td>${escapeHtml(item.position)}</td><td>${escapeHtml(item.calendar)}</td>
    <td class="table-actions"><button class="secondary small" type="button" onclick="openTicketRestaurantPersonForm('${escapeHtml(item.employeeNumber)}')">Editar</button><button class="danger small" type="button" onclick="deleteTicketRestaurantPerson('${escapeHtml(item.employeeNumber)}')">Eliminar</button></td>
  </tr>`).join("") : `<tr><td colspan="8" class="muted">Sin personas cargadas.</td></tr>`;
}

async function downloadTicketRestaurantPeopleTemplate() {
  await exportTicketWorkbook({ title: "Descargar modelo personas", fileName: "Modelo_personas_ticket_restaurante.xlsx", sheetName: "Personas", rows: [TICKET_RESTAURANT_PERSON_HEADERS], widths: [16, 20, 18, 18, 16, 26, 24] });
}

async function downloadTicketRestaurantAbsenceTemplate() {
  await exportTicketWorkbook({ title: "Descargar modelo ausencias", fileName: "Modelo_ausencias_ticket_restaurante.xlsx", sheetName: "Ausencias", rows: [TICKET_RESTAURANT_ABSENCE_HEADERS], widths: [16, 14, 14, 28, 12] });
}

async function exportTicketWorkbook(payload) {
  if (!window.rrllTicketRestaurant || typeof window.rrllTicketRestaurant.exportWorkbook !== "function") {
    alert("La exportación Excel solo está disponible en la aplicación de escritorio.");
    return null;
  }
  try { return await window.rrllTicketRestaurant.exportWorkbook(payload); }
  catch (error) { console.error(error); alert(`No se pudo generar el Excel: ${error.message || error}`); return null; }
}

async function importTicketRestaurantPeople() {
  if (!window.rrllTicketRestaurant || typeof window.rrllTicketRestaurant.importSpreadsheet !== "function") return alert("Importación disponible solo en escritorio.");
  const result = await window.rrllTicketRestaurant.importSpreadsheet();
  if (!result) return;
  const rows = ticketRestaurantRowsToObjects(result.rows, TICKET_RESTAURANT_PERSON_HEADERS);
  const people = getTicketRestaurantPeople();
  const map = new Map(people.map(item => [item.employeeNumber, item]));
  let imported = 0, updated = 0, omitted = 0;
  rows.forEach(row => {
    const employeeNumber = normalizeTicketEmployee(row["Nº empleado"]);
    const name = String(row.Nombre || "").trim();
    const calendar = normalizeTicketCalendar(row.Calendario);
    if (!employeeNumber || !name || !TICKET_RESTAURANT_CALENDARS.includes(calendar)) { omitted += 1; return; }
    const exists = map.has(employeeNumber);
    map.set(employeeNumber, {
      ...(map.get(employeeNumber) || {}), employeeNumber, name,
      surname1: String(row.Apellido1 || "").trim(), surname2: String(row.Apellido2 || "").trim(), dni: String(row.DNI || "").trim(), position: String(row.Puesto || "").trim(), calendar,
      createdAt: (map.get(employeeNumber) || {}).createdAt || new Date().toISOString(), updatedAt: new Date().toISOString()
    });
    if (exists) updated += 1; else imported += 1;
  });
  saveTicketRestaurantPeople([...map.values()].sort((a, b) => String(a.employeeNumber).localeCompare(String(b.employeeNumber), "es", { numeric: true })));
  renderTicketRestaurantPeople();
  renderTicketRestaurantComputePreview();
  showTicketRestaurantImportSummary("ticketRestaurantPeopleImportSummary", imported, updated, omitted, result.fileName);
}

function showTicketRestaurantImportSummary(id, imported, updated, omitted, fileName) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<strong>${escapeHtml(fileName || "Fichero")}</strong> · Importados: <b>${imported}</b> · Actualizados: <b>${updated}</b> · Omitidos: <b>${omitted}</b>`;
}

async function importTicketRestaurantAbsences() {
  if (!window.rrllTicketRestaurant || typeof window.rrllTicketRestaurant.importSpreadsheet !== "function") return alert("Importación disponible solo en escritorio.");
  const result = await window.rrllTicketRestaurant.importSpreadsheet();
  if (!result) return;
  const rows = ticketRestaurantRowsToObjects(result.rows, TICKET_RESTAURANT_ABSENCE_HEADERS);
  const absences = getTicketRestaurantAbsences();
  let imported = 0, omitted = 0;
  rows.forEach(row => {
    const employeeNumber = normalizeTicketEmployee(row["Nº empleado"]);
    const from = parseTicketDate(row.Desde);
    const to = parseTicketDate(row.Hasta) || from;
    const reason = String(row.Motivo || "").trim();
    const totalDays = parseTicketNumber(row["Total días"]);
    if (!employeeNumber || !from || !reason || !totalDays) { omitted += 1; return; }
    const period = ticketRestaurantMonthYearFromDate(from);
    absences.push({ id: `tr-absence-${Date.now()}-${Math.random().toString(36).slice(2)}`, employeeNumber, from, to, reason, totalDays, month: period.month, year: period.year, createdAt: new Date().toISOString() });
    imported += 1;
  });
  saveTicketRestaurantAbsences(absences);
  renderTicketRestaurantAbsences();
  renderTicketRestaurantComputePreview();
  showTicketRestaurantImportSummary("ticketRestaurantAbsenceImportSummary", imported, 0, omitted, result.fileName);
}

function deleteTicketRestaurantAbsence(id) {
  if (!id || !confirm("¿Eliminar esta ausencia importada?")) return;
  saveTicketRestaurantAbsences(getTicketRestaurantAbsences().filter(item => item.id !== id));
  renderTicketRestaurantAbsences();
  renderTicketRestaurantComputePreview();
}

function renderTicketRestaurantAbsences() {
  const body = document.getElementById("ticketRestaurantAbsencesBody");
  const count = document.getElementById("ticketRestaurantAbsencesCount");
  if (!body) return;
  const absences = getTicketRestaurantAbsences().sort((a, b) => String(b.from).localeCompare(String(a.from)));
  if (count) count.textContent = `${absences.length} ausencias`;
  body.innerHTML = absences.length ? absences.map(item => `<tr>
    <td>${escapeHtml(item.employeeNumber)}</td><td>${formatTicketDate(item.from)}</td><td>${formatTicketDate(item.to)}</td><td>${escapeHtml(item.reason)}</td><td>${escapeHtml(item.totalDays)}</td><td>${String(item.month).padStart(2, "0")}/${item.year}</td>
    <td class="table-actions"><button class="danger small" type="button" onclick="deleteTicketRestaurantAbsence('${escapeHtml(item.id)}')">Eliminar</button></td>
  </tr>`).join("") : `<tr><td colspan="7" class="muted">Sin ausencias importadas.</td></tr>`;
}

function renderTicketRestaurantComputeControls() {
  const month = document.getElementById("ticketRestaurantComputeMonth");
  const year = document.getElementById("ticketRestaurantComputeYear");
  if (!month || month.dataset.ready === "1") return;
  const def = trTodayNextMonth();
  month.innerHTML = TICKET_RESTAURANT_MONTHS.map((name, index) => `<option value="${index + 1}" ${index + 1 === def.month ? "selected" : ""}>${name}</option>`).join("");
  year.value = def.year;
  month.dataset.ready = "1";
  renderTicketRestaurantComputePreview();
}

function getTicketRestaurantComputeSelection() {
  const def = trTodayNextMonth();
  const month = Number((document.getElementById("ticketRestaurantComputeMonth") || {}).value) || def.month;
  const year = Number((document.getElementById("ticketRestaurantComputeYear") || {}).value) || def.year;
  return { month, year };
}

function ticketRestaurantWorkingDays(month, year, calendar) {
  const marks = new Set(getTicketRestaurantCalendarMarks().filter(item => item.calendar === calendar && item.noTicket).map(item => item.date));
  const totalDays = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= totalDays; day += 1) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const weekday = new Date(year, month - 1, day).getDay();
    if (weekday === 0 || weekday === 6 || marks.has(date)) continue;
    count += 1;
  }
  return count;
}

function calculateTicketRestaurantCompute() {
  const { month, year } = getTicketRestaurantComputeSelection();
  const absences = getTicketRestaurantAbsences().filter(item => Number(item.month) === month && Number(item.year) === year);
  const byEmployee = new Map();
  absences.forEach(item => {
    const key = normalizeTicketEmployee(item.employeeNumber);
    if (!byEmployee.has(key)) byEmployee.set(key, { days: 0, details: [] });
    const current = byEmployee.get(key);
    current.days += parseTicketNumber(item.totalDays);
    current.details.push(`${item.reason} ${formatTicketDate(item.from)}-${formatTicketDate(item.to)} (${parseTicketNumber(item.totalDays)} días)`);
  });
  const rows = getTicketRestaurantPeople().map(person => {
    const theoretical = ticketRestaurantWorkingDays(month, year, person.calendar);
    const absence = byEmployee.get(person.employeeNumber) || { days: 0, details: [] };
    const finalTickets = Math.max(0, theoretical - absence.days);
    return { person, theoretical, absenceDays: absence.days, absenceDetails: absence.details.join("; "), finalTickets };
  });
  const summary = TICKET_RESTAURANT_CALENDARS.map(calendar => {
    const calendarRows = rows.filter(row => row.person.calendar === calendar);
    return { calendar, theoretical: calendarRows.reduce((sum, row) => sum + row.theoretical, 0), final: calendarRows.reduce((sum, row) => sum + row.finalTickets, 0) };
  });
  return { month, year, rows, summary };
}

function renderTicketRestaurantComputePreview() {
  const summaryEl = document.getElementById("ticketRestaurantComputeSummary");
  const body = document.getElementById("ticketRestaurantComputeBody");
  if (!summaryEl || !body) return;
  const calc = calculateTicketRestaurantCompute();
  summaryEl.innerHTML = calc.summary.map(item => `<div class="ticket-summary-pill"><span>${escapeHtml(item.calendar)}</span><strong>${item.theoretical}</strong><small>tickets teóricos · ${item.final} finales</small></div>`).join("");
  body.innerHTML = calc.rows.length ? calc.rows.map(row => `<tr>
    <td>${escapeHtml(row.person.employeeNumber)}</td><td>${escapeHtml([row.person.name, row.person.surname1, row.person.surname2].filter(Boolean).join(" "))}</td><td>${escapeHtml(row.person.calendar)}</td><td>${row.theoretical}</td><td>${row.absenceDays}</td><td><strong>${row.finalTickets}</strong></td>
  </tr>`).join("") : `<tr><td colspan="6" class="muted">No hay personas con derecho cargadas.</td></tr>`;
}

function saveTicketRestaurantConfigFromInputs() {
  const pedido = String((document.getElementById("ticketRestaurantConfigPedido") || {}).value || "").trim() || TICKET_RESTAURANT_DEFAULT_CONFIG.pedido;
  const importe = String((document.getElementById("ticketRestaurantConfigImporte") || {}).value || "").trim() || TICKET_RESTAURANT_DEFAULT_CONFIG.importe;
  saveTicketRestaurantConfig({ pedido, importe });
  renderTicketRestaurantConfig();
  renderTicketRestaurantComputePreview();
}

function renderTicketRestaurantConfig() {
  const cfg = getTicketRestaurantConfig();
  const pedido = document.getElementById("ticketRestaurantConfigPedido");
  const importe = document.getElementById("ticketRestaurantConfigImporte");
  if (pedido && document.activeElement !== pedido) pedido.value = cfg.pedido;
  if (importe && document.activeElement !== importe) importe.value = cfg.importe;
}

async function exportTicketRestaurantCompute() {
  const calc = calculateTicketRestaurantCompute();
  const cfg = getTicketRestaurantConfig();
  const amount = parseTicketNumber(cfg.importe);
  const startDate = `01/${String(calc.month).padStart(2, "0")}/${calc.year}`;
  const rows = [TICKET_RESTAURANT_EXPORT_HEADERS, ...calc.rows.map(row => {
    const total = row.finalTickets * amount;
    return [row.person.name || "", row.person.surname1 || "", row.person.surname2 || "", row.person.dni || "", cfg.pedido, row.person.employeeNumber || "", row.finalTickets, cfg.importe, total.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), startDate, "01/01/2010", "", row.absenceDetails || ""];
  })];
  const fileName = `Computo_${TICKET_RESTAURANT_MONTHS[calc.month - 1]}_${calc.year}.xlsx`;
  const result = await exportTicketWorkbook({ title: "Generar cómputo Ticket Restaurante", fileName, sheetName: "Computo", rows, widths: [20, 18, 18, 14, 12, 12, 16, 12, 12, 14, 14, 14, 45] });
  if (result && !result.canceled) alert(`Excel generado correctamente:\n${result.filePath}`);
}

window.showTicketRestaurantArea = showTicketRestaurantArea;
window.setTicketRestaurantCalendar = setTicketRestaurantCalendar;
window.moveTicketRestaurantCalendarYear = moveTicketRestaurantCalendarYear;
window.toggleTicketRestaurantNoTicket = toggleTicketRestaurantNoTicket;
window.openTicketRestaurantPersonForm = openTicketRestaurantPersonForm;
window.closeTicketRestaurantPersonForm = closeTicketRestaurantPersonForm;
window.saveTicketRestaurantPersonForm = saveTicketRestaurantPersonForm;
window.deleteTicketRestaurantPerson = deleteTicketRestaurantPerson;
window.importTicketRestaurantPeople = importTicketRestaurantPeople;
window.downloadTicketRestaurantPeopleTemplate = downloadTicketRestaurantPeopleTemplate;
window.importTicketRestaurantAbsences = importTicketRestaurantAbsences;
window.downloadTicketRestaurantAbsenceTemplate = downloadTicketRestaurantAbsenceTemplate;
window.deleteTicketRestaurantAbsence = deleteTicketRestaurantAbsence;
window.renderTicketRestaurantComputePreview = renderTicketRestaurantComputePreview;
window.exportTicketRestaurantCompute = exportTicketRestaurantCompute;
window.saveTicketRestaurantConfigFromInputs = saveTicketRestaurantConfigFromInputs;
window.renderTicketRestaurant = renderTicketRestaurant;
window.getTicketRestaurantConfig = getTicketRestaurantConfig;
window.calculateTicketRestaurantCompute = calculateTicketRestaurantCompute;
