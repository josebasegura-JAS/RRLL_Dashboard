const TICKET_RESTAURANT_CALENDARS = ["Servicios Centrales", "Ingeniería Ariz", "Instalaciones Sopela"];
const TICKET_RESTAURANT_MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const TICKET_RESTAURANT_PERSON_HEADERS = ["Nº empleado", "Nombre", "Apellido1", "Apellido2", "DNI", "Puesto", "Calendario"];
const TICKET_RESTAURANT_ABSENCE_HEADERS = ["Nº empleado", "Desde", "Hasta", "Motivo", "Total días"];
const TICKET_RESTAURANT_EXPORT_HEADERS = ["Nombre", "Apellido1", "Apellido2", "DNI", "Pedido", "Nº Emp", "Numero Tickets", "Importe", "Total", "Fec Inicio", "Fec Cad", "Hoja Gastos", "Ausencias"];
const TICKET_RESTAURANT_DEFAULT_CONFIG = { pedido: "2404407", importe: "14,57" };

const TICKET_RESTAURANT_PEOPLE_FILTERS = [
  ["ticketPeopleFilterEmployee", item => item.employeeNumber],
  ["ticketPeopleFilterName", item => item.name],
  ["ticketPeopleFilterSurname1", item => item.surname1],
  ["ticketPeopleFilterSurname2", item => item.surname2],
  ["ticketPeopleFilterDni", item => item.dni],
  ["ticketPeopleFilterPosition", item => item.position],
  ["ticketPeopleFilterCalendar", item => item.calendar]
];
const TICKET_RESTAURANT_COMPUTE_FILTERS = [
  ["ticketComputeFilterEmployee", row => row.person && row.person.employeeNumber],
  ["ticketComputeFilterName", row => ticketRestaurantFullName(row.person)],
  ["ticketComputeFilterCalendar", row => row.person && row.person.calendar],
  ["ticketComputeFilterTheoretical", row => row.theoretical],
  ["ticketComputeFilterAbsences", row => row.absenceDays],
  ["ticketComputeFilterFinal", row => row.finalTickets]
];
const TICKET_RESTAURANT_MONTHLY_QUOTE_HEADERS = ["Nº empleado", "Nombre y apellidos", "Número de días con ticket", "Importe ticket"];
const TICKET_RESTAURANT_MONTHLY_FILTERS = [
  ["ticketMonthlyQuoteFilterEmployee", row => row.employeeNumber],
  ["ticketMonthlyQuoteFilterName", row => row.fullName],
  ["ticketMonthlyQuoteFilterDays", row => row.ticketDays],
  ["ticketMonthlyQuoteFilterAmount", row => row.ticketAmount]
];
const TICKET_RESTAURANT_COMPUTE_SORT_COLUMNS = {
  employee: { type: "text", getter: row => row.person && row.person.employeeNumber },
  name: { type: "text", getter: row => ticketRestaurantFullName(row.person) },
  calendar: { type: "text", getter: row => row.person && row.person.calendar },
  theoretical: { type: "number", getter: row => row.theoretical },
  absences: { type: "number", getter: row => row.absenceDays },
  final: { type: "number", getter: row => row.finalTickets }
};

function ticketRestaurantFullName(person) {
  return [person && person.name, person && person.surname1, person && person.surname2].filter(Boolean).join(" ");
}

function getTicketRestaurantFilterValue(id) {
  const el = document.getElementById(id);
  return normalizeTicketText(el ? el.value : "");
}

function ticketRestaurantMatchesColumnFilters(item, filters) {
  return filters.every(([id, getter]) => {
    const filter = getTicketRestaurantFilterValue(id);
    if (!filter) return true;
    return normalizeTicketText(getter(item)).includes(filter);
  });
}

function normalizeTicketRestaurantSortValue(value, type) {
  if (type === "number") return parseTicketNumber(value);
  const date = parseTicketDate(value);
  if (type === "date" || (/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}$/.test(String(value || "").trim()) && date)) {
    return date || "";
  }
  return normalizeTicketText(value);
}

function compareTicketRestaurantSortValues(a, b, type) {
  const left = normalizeTicketRestaurantSortValue(a, type);
  const right = normalizeTicketRestaurantSortValue(b, type);
  if (type === "number") return left - right;
  return String(left).localeCompare(String(right), "es", { numeric: true, sensitivity: "base" });
}

function sortTicketRestaurantComputeRows(rows) {
  const sort = ticketRestaurantComputeSort || {};
  const column = TICKET_RESTAURANT_COMPUTE_SORT_COLUMNS[sort.key];
  if (!column || !sort.direction) return rows;
  const direction = sort.direction === "desc" ? -1 : 1;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const result = compareTicketRestaurantSortValues(column.getter(a.row), column.getter(b.row), column.type);
      return result ? result * direction : a.index - b.index;
    })
    .map(item => item.row);
}

function getVisibleTicketRestaurantPeople() {
  return getTicketRestaurantPeople().filter(item => ticketRestaurantMatchesColumnFilters(item, TICKET_RESTAURANT_PEOPLE_FILTERS));
}

function getVisibleTicketRestaurantComputeRows(calc) {
  const source = calc || ticketRestaurantLastVisibleCompute || calculateTicketRestaurantCompute();
  const filteredRows = (source.rows || []).filter(row => ticketRestaurantMatchesColumnFilters(row, TICKET_RESTAURANT_COMPUTE_FILTERS));
  return sortTicketRestaurantComputeRows(filteredRows);
}

function getVisibleTicketRestaurantMonthlyQuoteRows(calc) {
  const source = calc || ticketRestaurantLastVisibleMonthlyQuote || calculateTicketRestaurantMonthlyQuote();
  return (source.rows || []).filter(row => ticketRestaurantMatchesColumnFilters(row, TICKET_RESTAURANT_MONTHLY_FILTERS));
}

function htmlEscapeTicketRestaurantOutput(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function buildTicketRestaurantTablePrintHtml(title, headers, rows) {
  const headerHtml = headers.map(header => `<th>${htmlEscapeTicketRestaurantOutput(header)}</th>`).join("");
  const bodyHtml = rows.length
    ? rows.map(row => `<tr>${row.map(cell => `<td>${htmlEscapeTicketRestaurantOutput(cell)}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${Math.max(headers.length, 1)}">Sin registros.</td></tr>`;
  return `<h1>${htmlEscapeTicketRestaurantOutput(title)}</h1><div class="date">Generado: ${new Date().toLocaleString("es-ES")}</div><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
}

function openTicketRestaurantPrintPreview(title, headers, rows) {
  const html = buildTicketRestaurantTablePrintHtml(title, headers, rows);
  if (typeof openPrintPreviewWithHtml === "function") openPrintPreviewWithHtml(html);
  else {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${htmlEscapeTicketRestaurantOutput(title)}</title></head><body>${html}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  }
}


let ticketRestaurantActiveArea = "compute";
let ticketRestaurantSelectedCalendar = "Servicios Centrales";
let ticketRestaurantCalendarYear = new Date().getFullYear();
let ticketRestaurantEditingEmployee = null;
let ticketRestaurantLastPlantillaLookup = "";
let ticketRestaurantPlantillaLookupTimer = null;
let ticketRestaurantLastVisibleCompute = null;
let ticketRestaurantLastVisibleMonthlyQuote = null;
let ticketRestaurantComputeSort = { key: null, direction: null };

function trTodayNextMonth() {
  const now = new Date();
  return { month: now.getMonth() === 11 ? 1 : now.getMonth() + 2, year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear() };
}

function getTicketRestaurantCalendarMarks() {
  return load("rrll_ticket_restaurant_calendar_marks", []);
}

function saveTicketRestaurantCalendarMarks(items) {
  const normalized = [];
  const seen = new Set();
  (Array.isArray(items) ? items : []).forEach(item => {
    const calendar = normalizeTicketCalendar(item && item.calendar);
    const date = parseTicketDate(item && item.date);
    if (!calendar || !date || !item.noTicket) return;
    const key = ticketRestaurantMarkKey(calendar, date);
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push({ calendar, date, noTicket: true });
  });
  save("rrll_ticket_restaurant_calendar_marks", normalized);
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
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeTicketEmployeeLookup(value) {
  const raw = normalizeTicketEmployee(value).toLowerCase();
  const compact = raw.replace(/\s+/g, "");
  const digits = compact.replace(/[^0-9]/g, "");
  if (digits && /^0*\d+$/.test(compact)) return String(Number(digits));
  return compact.replace(/^0+(?=\d)/, "");
}

function normalizeTicketText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/º/g, "o")
    .replace(/ª/g, "a")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeTicketCompactText(value) {
  return normalizeTicketText(value).replace(/[^a-z0-9]/g, "");
}

function normalizeTicketCalendar(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const key = normalizeTicketCompactText(text);
  const calendarAliases = new Map([
    ["sscc", "Servicios Centrales"],
    ["servicioscentrales", "Servicios Centrales"],
    ["serviciocentrales", "Servicios Centrales"],
    ["sopela", "Instalaciones Sopela"],
    ["instalacionessopela", "Instalaciones Sopela"],
    ["instalacionsopela", "Instalaciones Sopela"],
    ["ariz", "Ingeniería Ariz"],
    ["ingenieriaariz", "Ingeniería Ariz"]
  ]);
  return calendarAliases.get(key) || TICKET_RESTAURANT_CALENDARS.find(item => normalizeTicketCompactText(item) === key) || text;
}

function isKnownTicketCalendar(value) {
  return TICKET_RESTAURANT_CALENDARS.includes(normalizeTicketCalendar(value));
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

function getTicketRestaurantHeaderAliases(header) {
  const aliases = {
    "Nº empleado": ["Nº empleado", "N° empleado", "No empleado", "Num empleado", "Nº Emp", "N° Emp", "No Emp", "Numero empleado", "Número empleado", "N empleado", "Empleado", "Num Emp"],
    Nombre: ["Nombre"],
    Apellido1: ["Apellido1", "Apellido 1", "Primer apellido"],
    Apellido2: ["Apellido2", "Apellido 2", "Segundo apellido"],
    DNI: ["DNI", "NIF", "Documento"],
    Puesto: ["Puesto", "Cargo", "Posición", "Posicion"],
    Calendario: ["Calendario", "Calendar"]
  };
  return aliases[header] || [header];
}

function ticketRestaurantBuildHeaderIndex(row, headers) {
  const normalizedCells = (Array.isArray(row) ? row : []).map(cell => normalizeTicketCompactText(cell));
  const index = {};
  headers.forEach(header => {
    const aliases = getTicketRestaurantHeaderAliases(header).map(alias => normalizeTicketCompactText(alias));
    const found = normalizedCells.findIndex(cell => aliases.includes(cell));
    if (found >= 0) index[header] = found;
  });
  return index;
}

function ticketRestaurantRowsToObjects(rows, headers) {
  const safeRows = Array.isArray(rows) ? rows.filter(row => !ticketRestaurantRowIsEmpty(row)) : [];
  if (!safeRows.length) return [];
  const headerIndex = ticketRestaurantBuildHeaderIndex(safeRows[0], headers);
  const hasHeader = Object.keys(headerIndex).length > 0;
  const start = hasHeader ? 1 : 0;
  return safeRows.slice(start).map(row => {
    const obj = {};
    headers.forEach((header, fallbackIndex) => {
      const index = hasHeader && headerIndex[header] != null ? headerIndex[header] : fallbackIndex;
      obj[header] = row[index] == null ? "" : String(row[index]).replace(/^\ufeff/, "").replace(/\s+/g, " ").trim();
    });
    return obj;
  });
}

function splitTicketRestaurantFullName(value) {
  const parts = String(value || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!parts.length) return { name: "", surname1: "", surname2: "" };
  if (parts.length === 1) return { name: parts[0], surname1: "", surname2: "" };
  if (parts.length === 2) return { name: parts[0], surname1: parts[1], surname2: "" };
  return { name: parts.slice(0, -2).join(" "), surname1: parts[parts.length - 2], surname2: parts[parts.length - 1] };
}

function getTicketRestaurantPlantillaItems() {
  if (typeof window.getPlantilla === "function") {
    const items = window.getPlantilla();
    return Array.isArray(items) ? items : [];
  }
  const items = load("rrll_plantilla", []);
  return Array.isArray(items) ? items : [];
}

function getTicketRestaurantPlantillaValue(person, keys) {
  for (const key of keys) {
    const value = person && person[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function findTicketRestaurantPlantillaPerson(employeeNumber) {
  const target = normalizeTicketEmployeeLookup(employeeNumber);
  if (!target) return null;
  return getTicketRestaurantPlantillaItems().find(person => normalizeTicketEmployeeLookup(person && person.employeeNumber) === target) || null;
}

function buildTicketRestaurantPlantillaAutofill(person) {
  if (!person) return null;
  const fullName = getTicketRestaurantPlantillaValue(person, ["fullName", "displayName", "name"]);
  const splitName = splitTicketRestaurantFullName(fullName);
  return {
    name: getTicketRestaurantPlantillaValue(person, ["firstName", "nombre"]) || splitName.name,
    surname1: getTicketRestaurantPlantillaValue(person, ["surname1", "apellido1", "firstSurname"]) || splitName.surname1,
    surname2: getTicketRestaurantPlantillaValue(person, ["surname2", "apellido2", "secondSurname"]) || splitName.surname2,
    dni: getTicketRestaurantPlantillaValue(person, ["dni", "DNI", "nif", "documentNumber"]),
    position: getTicketRestaurantPlantillaValue(person, ["position", "puesto", "job", "jobTitle"])
  };
}

function setTicketRestaurantPersonNotice(message, type = "info") {
  let notice = document.getElementById("ticketPersonPlantillaNotice");
  const grid = document.querySelector("#ticketPersonModal .form-grid");
  if (!notice && grid) {
    notice = document.createElement("div");
    notice.id = "ticketPersonPlantillaNotice";
    notice.className = "ticket-person-autofill-notice full";
    notice.setAttribute("aria-live", "polite");
    grid.appendChild(notice);
  }
  if (!notice) return;
  notice.textContent = message || "";
  notice.dataset.type = type;
  notice.hidden = !message;
}

function ensureTicketRestaurantPersonAutofill() {
  const employee = document.getElementById("ticketPersonEmployee");
  if (!employee || employee.dataset.ticketAutofillReady === "1") return;
  const schedule = () => {
    window.clearTimeout(ticketRestaurantPlantillaLookupTimer);
    ticketRestaurantPlantillaLookupTimer = window.setTimeout(() => autocompleteTicketRestaurantPersonFromPlantilla(), 450);
  };
  employee.addEventListener("input", schedule);
  employee.addEventListener("change", () => autocompleteTicketRestaurantPersonFromPlantilla(true));
  employee.addEventListener("blur", () => autocompleteTicketRestaurantPersonFromPlantilla(true));
  employee.dataset.ticketAutofillReady = "1";
}

function autocompleteTicketRestaurantPersonFromPlantilla(force = false) {
  const employee = document.getElementById("ticketPersonEmployee");
  if (!employee) return;
  const lookupKey = normalizeTicketEmployeeLookup(employee.value);
  if (!lookupKey) {
    ticketRestaurantLastPlantillaLookup = "";
    setTicketRestaurantPersonNotice("");
    return;
  }
  if (!force && lookupKey === ticketRestaurantLastPlantillaLookup) return;
  ticketRestaurantLastPlantillaLookup = lookupKey;
  const person = findTicketRestaurantPlantillaPerson(employee.value);
  if (!person) {
    setTicketRestaurantPersonNotice("No se encontró el empleado en Plantilla.", "warning");
    return;
  }

  const fields = [
    ["ticketPersonName", "name", "Nombre"],
    ["ticketPersonSurname1", "surname1", "Apellido1"],
    ["ticketPersonSurname2", "surname2", "Apellido2"],
    ["ticketPersonDni", "dni", "DNI"],
    ["ticketPersonPosition", "position", "Puesto"]
  ];
  const source = buildTicketRestaurantPlantillaAutofill(person);
  const conflicts = fields.filter(([id, key]) => {
    const el = document.getElementById(id);
    const sourceValue = source && source[key];
    return el && sourceValue && String(el.value || "").trim() && String(el.value || "").trim() !== sourceValue;
  });
  const overwrite = conflicts.length ? confirm(`Plantilla contiene datos distintos para ${conflicts.map(([, , label]) => label).join(", ")}. ¿Quieres sustituir esos campos por los de Plantilla?`) : false;
  let filled = 0;
  let preserved = 0;
  fields.forEach(([id, key]) => {
    const el = document.getElementById(id);
    const value = source && source[key];
    if (!el || !value) return;
    if (!String(el.value || "").trim() || overwrite) {
      el.value = value;
      filled += 1;
    } else {
      preserved += 1;
    }
  });
  const suffix = preserved ? " Se han mantenido los campos ya rellenados." : "";
  setTicketRestaurantPersonNotice(filled ? `Datos cargados desde Plantilla.${suffix}` : `Empleado encontrado en Plantilla.${suffix}`, "success");
}

function showTicketRestaurantArea(area) {
  ticketRestaurantActiveArea = area || "compute";
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
  if (ticketRestaurantActiveArea === "monthly") renderTicketRestaurantMonthlyQuotePreview();
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
  renderTicketRestaurantCalendarSelector();
  renderTicketRestaurantCalendar();
  if (ticketRestaurantActiveArea === "compute") renderTicketRestaurantComputePreview();
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
  if (root.dataset.ticketCalendarReady !== "1") {
    root.addEventListener("click", event => {
      const day = event.target.closest(".ticket-day[data-ticket-date]");
      if (!day || !root.contains(day)) return;
      toggleTicketRestaurantNoTicket(day.dataset.ticketDate);
    });
    root.dataset.ticketCalendarReady = "1";
  }
  const marks = new Set(getTicketRestaurantCalendarMarks()
    .filter(item => item && normalizeTicketCalendar(item.calendar) === ticketRestaurantSelectedCalendar && item.noTicket)
    .map(item => parseTicketDate(item.date))
    .filter(Boolean));
  const today = new Date();
  const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
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
      const isToday = date === todayDate;
      const dayClasses = [
        "ticket-day",
        weekend ? "ticket-day--weekend" : "",
        isToday ? "ticket-day--today" : "",
        noTicket ? "ticket-day--no-ticket" : ""
      ].filter(Boolean).join(" ");
      cells.push(`<button type="button" class="${dayClasses}" data-ticket-date="${date}" aria-pressed="${noTicket ? "true" : "false"}" title="${formatTicketDate(date)}${noTicket ? " · Sin ticket" : ""}">${day}</button>`);
    }
    return `<section class="ticket-month-card"><h4>${TICKET_RESTAURANT_MONTHS[monthIndex]}</h4><div class="ticket-weekdays"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="ticket-days-grid">${cells.join("")}</div></section>`;
  }).join("");
}

function openTicketRestaurantPersonForm(employeeNumber) {
  ticketRestaurantEditingEmployee = employeeNumber ? normalizeTicketEmployee(employeeNumber) : null;
  ticketRestaurantLastPlantillaLookup = "";
  const people = getTicketRestaurantPeople();
  const editingKey = normalizeTicketEmployeeLookup(ticketRestaurantEditingEmployee);
  const person = people.find(item => normalizeTicketEmployeeLookup(item && item.employeeNumber) === editingKey) || {};
  document.getElementById("ticketPersonModalTitle").textContent = ticketRestaurantEditingEmployee ? "Editar persona" : "Nueva persona";
  document.getElementById("ticketPersonEmployee").value = person.employeeNumber || "";
  document.getElementById("ticketPersonName").value = person.name || "";
  document.getElementById("ticketPersonSurname1").value = person.surname1 || "";
  document.getElementById("ticketPersonSurname2").value = person.surname2 || "";
  document.getElementById("ticketPersonDni").value = person.dni || "";
  document.getElementById("ticketPersonPosition").value = person.position || "";
  document.getElementById("ticketPersonCalendar").innerHTML = TICKET_RESTAURANT_CALENDARS.map(item => `<option value="${escapeHtml(item)}" ${item === (person.calendar || ticketRestaurantSelectedCalendar) ? "selected" : ""}>${escapeHtml(item)}</option>`).join("");
  ensureTicketRestaurantPersonAutofill();
  setTicketRestaurantPersonNotice("");
  const modal = document.getElementById("ticketPersonModal");
  if (modal) modal.classList.add("open");
}

function closeTicketRestaurantPersonForm() {
  const modal = document.getElementById("ticketPersonModal");
  if (modal) modal.classList.remove("open");
  ticketRestaurantEditingEmployee = null;
  ticketRestaurantLastPlantillaLookup = "";
  setTicketRestaurantPersonNotice("");
}

function saveTicketRestaurantPersonForm() {
  const employeeNumber = normalizeTicketEmployee(document.getElementById("ticketPersonEmployee").value);
  const name = String(document.getElementById("ticketPersonName").value || "").replace(/\s+/g, " ").trim();
  const calendar = normalizeTicketCalendar(document.getElementById("ticketPersonCalendar").value);
  if (!employeeNumber || !name || !calendar) {
    alert("Nº empleado, Nombre y Calendario son obligatorios.");
    return;
  }
  if (!isKnownTicketCalendar(calendar)) {
    alert("Selecciona un Calendario válido.");
    return;
  }
  const peopleBefore = getTicketRestaurantPeople();
  const employeeKey = normalizeTicketEmployeeLookup(employeeNumber);
  const editingKey = normalizeTicketEmployeeLookup(ticketRestaurantEditingEmployee);
  const existing = peopleBefore.find(item => normalizeTicketEmployeeLookup(item && item.employeeNumber) === employeeKey);
  if (existing && !ticketRestaurantEditingEmployee && !confirm(`Ya existe una persona con Nº empleado ${employeeNumber}. ¿Quieres actualizarla?`)) return;
  const person = {
    ...(existing || {}),
    employeeNumber,
    name,
    surname1: String(document.getElementById("ticketPersonSurname1").value || "").replace(/\s+/g, " ").trim(),
    surname2: String(document.getElementById("ticketPersonSurname2").value || "").replace(/\s+/g, " ").trim(),
    dni: String(document.getElementById("ticketPersonDni").value || "").replace(/\s+/g, " ").trim(),
    position: String(document.getElementById("ticketPersonPosition").value || "").replace(/\s+/g, " ").trim(),
    calendar,
    createdAt: (existing || {}).createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  let people = peopleBefore.filter(item => {
    const key = normalizeTicketEmployeeLookup(item && item.employeeNumber);
    return key !== employeeKey && key !== editingKey;
  });
  people.push(person);
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
  const total = getTicketRestaurantPeople().length;
  const people = getVisibleTicketRestaurantPeople();
  if (count) count.textContent = people.length === total ? `${total} personas` : `${people.length} de ${total} personas`;
  body.innerHTML = people.length ? people.map(item => `<tr>
    <td>${escapeHtml(item.employeeNumber)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.surname1)}</td><td>${escapeHtml(item.surname2)}</td><td>${escapeHtml(item.dni)}</td><td>${escapeHtml(item.position)}</td><td>${escapeHtml(item.calendar)}</td>
    <td class="table-actions"><button class="secondary small" type="button" onclick="openTicketRestaurantPersonForm('${escapeHtml(item.employeeNumber)}')">Editar</button><button class="danger small" type="button" onclick="deleteTicketRestaurantPerson('${escapeHtml(item.employeeNumber)}')">Eliminar</button></td>
  </tr>`).join("") : `<tr><td colspan="8" class="muted">Sin personas que coincidan con los filtros.</td></tr>`;
}

async function exportTicketRestaurantPeopleVisible() {
  const rows = [TICKET_RESTAURANT_PERSON_HEADERS, ...getVisibleTicketRestaurantPeople().map(item => [item.employeeNumber || "", item.name || "", item.surname1 || "", item.surname2 || "", item.dni || "", item.position || "", item.calendar || ""] )];
  const result = await exportTicketWorkbook({ title: "Personas con derecho Ticket Restaurante", fileName: "Personas_con_derecho_ticket_restaurante.xlsx", sheetName: "Personas", rows, widths: [16, 20, 18, 18, 16, 26, 24] });
  if (result && !result.canceled) alert(`Excel generado correctamente:\n${result.filePath}`);
}

function printTicketRestaurantPeopleVisible() {
  const rows = getVisibleTicketRestaurantPeople().map(item => [item.employeeNumber || "", item.name || "", item.surname1 || "", item.surname2 || "", item.dni || "", item.position || "", item.calendar || ""]);
  openTicketRestaurantPrintPreview("Personas con derecho a Ticket Restaurante", TICKET_RESTAURANT_PERSON_HEADERS, rows);
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

function buildTicketRestaurantPersonRecord(row, existing = {}) {
  const employeeNumber = normalizeTicketEmployee(row && row["Nº empleado"]);
  const name = String((row && row.Nombre) || "").replace(/\s+/g, " ").trim();
  const calendar = normalizeTicketCalendar(row && row.Calendario);
  if (!employeeNumber || !name || !isKnownTicketCalendar(calendar)) return null;
  const now = new Date().toISOString();
  return {
    ...existing,
    employeeNumber,
    name,
    surname1: String((row && row.Apellido1) || "").replace(/\s+/g, " ").trim(),
    surname2: String((row && row.Apellido2) || "").replace(/\s+/g, " ").trim(),
    dni: String((row && row.DNI) || "").replace(/\s+/g, " ").trim(),
    position: String((row && row.Puesto) || "").replace(/\s+/g, " ").trim(),
    calendar,
    createdAt: existing.createdAt || now,
    updatedAt: now
  };
}

async function importTicketRestaurantPeople() {
  if (!window.rrllTicketRestaurant || typeof window.rrllTicketRestaurant.importSpreadsheet !== "function") return alert("Importación disponible solo en escritorio.");
  let result = null;
  try {
    result = await window.rrllTicketRestaurant.importSpreadsheet();
  } catch (error) {
    console.error(error);
    alert(`No se pudo importar el fichero: ${error.message || error}`);
    return;
  }
  if (!result) return;
  const rows = ticketRestaurantRowsToObjects(result.rows, TICKET_RESTAURANT_PERSON_HEADERS);
  const people = getTicketRestaurantPeople();
  const map = new Map();
  people.forEach(item => {
    const key = normalizeTicketEmployeeLookup(item && item.employeeNumber);
    if (key) map.set(key, item);
  });
  let imported = 0, updated = 0, omitted = 0;
  rows.forEach(row => {
    const key = normalizeTicketEmployeeLookup(row && row["Nº empleado"]);
    const existing = key ? map.get(key) : null;
    const record = buildTicketRestaurantPersonRecord(row, existing || {});
    if (!key || !record) { omitted += 1; return; }
    map.set(key, record);
    if (existing) updated += 1; else imported += 1;
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
  if (!month || !year) return;
  const def = trTodayNextMonth();
  if (month.dataset.ready !== "1") {
    month.innerHTML = TICKET_RESTAURANT_MONTHS.map((name, index) => `<option value="${index + 1}" ${index + 1 === def.month ? "selected" : ""}>${name}</option>`).join("");
    month.dataset.ready = "1";
  }
  if (!year.value) year.value = def.year;
  renderTicketRestaurantComputePreview();
}

function getTicketRestaurantComputeSelection() {
  const def = trTodayNextMonth();
  const selectedMonth = Number((document.getElementById("ticketRestaurantComputeMonth") || {}).value);
  const selectedYear = Number((document.getElementById("ticketRestaurantComputeYear") || {}).value);
  const month = Number.isInteger(selectedMonth) && selectedMonth >= 1 && selectedMonth <= 12 ? selectedMonth : def.month;
  const year = Number.isInteger(selectedYear) && selectedYear >= 2000 && selectedYear <= 2100 ? selectedYear : def.year;
  return { month, year };
}

function ticketRestaurantWorkingDays(month, year, calendar) {
  const normalizedCalendar = normalizeTicketCalendar(calendar);
  if (!isKnownTicketCalendar(normalizedCalendar)) return 0;
  const marks = new Set(getTicketRestaurantCalendarMarks()
    .filter(item => normalizeTicketCalendar(item && item.calendar) === normalizedCalendar && item && item.noTicket)
    .map(item => parseTicketDate(item.date))
    .filter(Boolean));
  const totalDays = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= totalDays; day += 1) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const weekday = new Date(year, month - 1, day).getDay();
    const weekend = weekday === 0 || weekday === 6;
    const noTicket = marks.has(date);
    if (weekend) continue;
    if (noTicket) continue;
    count += 1;
  }
  return count;
}

function ticketRestaurantNoTicketWeekdays(month, year, calendar) {
  const normalizedCalendar = normalizeTicketCalendar(calendar);
  if (!isKnownTicketCalendar(normalizedCalendar)) return 0;
  const marks = new Set(getTicketRestaurantCalendarMarks()
    .filter(item => normalizeTicketCalendar(item && item.calendar) === normalizedCalendar && item && item.noTicket)
    .map(item => parseTicketDate(item.date))
    .filter(Boolean));
  let count = 0;
  marks.forEach(date => {
    const markYear = Number(date.slice(0, 4));
    const markMonth = Number(date.slice(5, 7));
    if (markYear !== year || markMonth !== month) return;
    const weekday = new Date(markYear, markMonth - 1, Number(date.slice(8, 10))).getDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
  });
  return count;
}

function calculateTicketRestaurantCompute() {
  const { month, year } = getTicketRestaurantComputeSelection();
  const calendarTheoretical = new Map(TICKET_RESTAURANT_CALENDARS.map(calendar => [calendar, ticketRestaurantWorkingDays(month, year, calendar)]));
  const calendarNoTicketWeekdays = new Map(TICKET_RESTAURANT_CALENDARS.map(calendar => [calendar, ticketRestaurantNoTicketWeekdays(month, year, calendar)]));
  const absences = getTicketRestaurantAbsences().filter(item => Number(item.month) === month && Number(item.year) === year);
  const byEmployee = new Map();
  absences.forEach(item => {
    const key = normalizeTicketEmployeeLookup(item.employeeNumber);
    if (!key) return;
    if (!byEmployee.has(key)) byEmployee.set(key, { days: 0, details: [] });
    const current = byEmployee.get(key);
    const days = parseTicketNumber(item.totalDays);
    current.days += days;
    current.details.push(`${item.reason} ${formatTicketDate(item.from)}-${formatTicketDate(item.to)} (${days} días)`);
  });
  const warnings = [];
  const rows = getTicketRestaurantPeople().map(person => {
    const normalizedCalendar = normalizeTicketCalendar(person.calendar);
    const hasCalendar = isKnownTicketCalendar(normalizedCalendar);
    if (!hasCalendar) warnings.push(`La persona ${person.employeeNumber || "sin nº"} no tiene un calendario válido asignado.`);
    const theoretical = hasCalendar ? (calendarTheoretical.get(normalizedCalendar) || 0) : 0;
    const absence = byEmployee.get(normalizeTicketEmployeeLookup(person.employeeNumber)) || { days: 0, details: [] };
    const absenceDays = parseTicketNumber(absence.days);
    const finalTickets = Math.max(0, theoretical - absenceDays);
    return { person: { ...person, calendar: hasCalendar ? normalizedCalendar : (person.calendar || "Sin calendario") }, theoretical, absenceDays, absenceDetails: absence.details.join("; "), finalTickets, calendarWarning: !hasCalendar };
  });
  const summary = TICKET_RESTAURANT_CALENDARS.map(calendar => {
    const calendarRows = rows.filter(row => row.person.calendar === calendar);
    const theoretical = calendarTheoretical.get(calendar) || 0;
    return {
      calendar,
      theoretical,
      noTicketWeekdays: calendarNoTicketWeekdays.get(calendar) || 0,
      people: calendarRows.length,
      absenceDays: calendarRows.reduce((sum, row) => sum + row.absenceDays, 0),
      final: calendarRows.reduce((sum, row) => sum + row.finalTickets, 0)
    };
  });
  return { month, year, rows, summary, warnings };
}

function setTicketRestaurantComputeSort(key) {
  if (!TICKET_RESTAURANT_COMPUTE_SORT_COLUMNS[key]) return;
  if (ticketRestaurantComputeSort.key !== key) ticketRestaurantComputeSort = { key, direction: "asc" };
  else if (ticketRestaurantComputeSort.direction === "asc") ticketRestaurantComputeSort = { key, direction: "desc" };
  else ticketRestaurantComputeSort = { key: null, direction: null };
  renderTicketRestaurantComputePreview();
}

function updateTicketRestaurantComputeSortHeaders() {
  document.querySelectorAll("[data-ticket-compute-sort]").forEach(button => {
    const active = button.dataset.ticketComputeSort === ticketRestaurantComputeSort.key && ticketRestaurantComputeSort.direction;
    const indicator = button.querySelector(".ticket-sort-indicator");
    const th = button.closest("th");
    if (indicator) indicator.textContent = active ? (ticketRestaurantComputeSort.direction === "asc" ? "↑" : "↓") : "";
    button.setAttribute("aria-label", active ? `${button.textContent.replace(/[↑↓]/g, "").trim()}: orden ${ticketRestaurantComputeSort.direction === "asc" ? "ascendente" : "descendente"}` : `${button.textContent.trim()}: ordenar`);
    if (th) th.setAttribute("aria-sort", active ? (ticketRestaurantComputeSort.direction === "asc" ? "ascending" : "descending") : "none");
  });
}

function renderTicketRestaurantComputePreview() {
  const periodEl = document.getElementById("ticketRestaurantComputePeriod");
  const summaryEl = document.getElementById("ticketRestaurantComputeSummary");
  const noticeEl = document.getElementById("ticketRestaurantComputeNotice");
  const body = document.getElementById("ticketRestaurantComputeBody");
  if (!summaryEl || !body) return;
  const calc = calculateTicketRestaurantCompute();
  ticketRestaurantLastVisibleCompute = calc;
  if (periodEl) periodEl.textContent = `Cómputo automático para ${TICKET_RESTAURANT_MONTHS[calc.month - 1]} de ${calc.year}`;
  summaryEl.innerHTML = calc.summary.map(item => `<div class="ticket-summary-pill"><span>${escapeHtml(item.calendar)}</span><strong>${item.theoretical}</strong><small>tickets teóricos · ${item.noTicketWeekdays} días sin ticket · ${item.people} personas · ${item.absenceDays} ausencias · ${item.final} tickets finales</small></div>`).join("");
  if (noticeEl) {
    const uniqueWarnings = [...new Set(calc.warnings || [])];
    noticeEl.innerHTML = uniqueWarnings.map(item => `<div>${escapeHtml(item)} Tickets = 0 para esa persona.</div>`).join("");
    noticeEl.hidden = uniqueWarnings.length === 0;
  }
  const visibleRows = getVisibleTicketRestaurantComputeRows(calc);
  updateTicketRestaurantComputeSortHeaders();
  body.innerHTML = visibleRows.length ? visibleRows.map(row => `<tr class="${row.calendarWarning ? "ticket-row-warning" : ""}">
    <td>${escapeHtml(row.person.employeeNumber)}</td><td>${escapeHtml(ticketRestaurantFullName(row.person))}</td><td>${escapeHtml(row.person.calendar)}${row.calendarWarning ? " · revisar" : ""}</td><td>${row.theoretical}</td><td>${row.absenceDays}</td><td><strong>${row.finalTickets}</strong></td>
  </tr>`).join("") : `<tr><td colspan="6" class="muted">No hay personas con derecho que coincidan con los filtros.</td></tr>`;
  if (ticketRestaurantActiveArea === "monthly") renderTicketRestaurantMonthlyQuotePreview();
}

function saveTicketRestaurantConfigFromInputs() {
  const pedido = String((document.getElementById("ticketRestaurantConfigPedido") || {}).value || "").trim() || TICKET_RESTAURANT_DEFAULT_CONFIG.pedido;
  const importe = String((document.getElementById("ticketRestaurantConfigImporte") || {}).value || "").trim() || TICKET_RESTAURANT_DEFAULT_CONFIG.importe;
  saveTicketRestaurantConfig({ pedido, importe });
  renderTicketRestaurantConfig();
  renderTicketRestaurantComputePreview();
  if (ticketRestaurantLastVisibleMonthlyQuote || ticketRestaurantActiveArea === "monthly") renderTicketRestaurantMonthlyQuotePreview();
}

function renderTicketRestaurantConfig() {
  const cfg = getTicketRestaurantConfig();
  const pedido = document.getElementById("ticketRestaurantConfigPedido");
  const importe = document.getElementById("ticketRestaurantConfigImporte");
  if (pedido && document.activeElement !== pedido) pedido.value = cfg.pedido;
  if (importe && document.activeElement !== importe) importe.value = cfg.importe;
}

function buildTicketRestaurantComputeExportRows(calc) {
  const source = calc || ticketRestaurantLastVisibleCompute || calculateTicketRestaurantCompute();
  const cfg = getTicketRestaurantConfig();
  const amount = parseTicketNumber(cfg.importe);
  const startDate = `01/${String(source.month).padStart(2, "0")}/${source.year}`;
  return getVisibleTicketRestaurantComputeRows(source).map(row => {
    const total = row.finalTickets * amount;
    return [row.person.name || "", row.person.surname1 || "", row.person.surname2 || "", row.person.dni || "", cfg.pedido, row.person.employeeNumber || "", row.finalTickets, cfg.importe, total.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), startDate, "01/01/2010", "", row.absenceDetails || ""];
  });
}

async function exportTicketRestaurantCompute() {
  renderTicketRestaurantComputePreview();
  const calc = ticketRestaurantLastVisibleCompute || calculateTicketRestaurantCompute();
  const rows = [TICKET_RESTAURANT_EXPORT_HEADERS, ...buildTicketRestaurantComputeExportRows(calc)];
  const fileName = `Computo_${TICKET_RESTAURANT_MONTHS[calc.month - 1]}_${calc.year}.xlsx`;
  const result = await exportTicketWorkbook({ title: "Generar cómputo Ticket Restaurante", fileName, sheetName: "Computo", rows, widths: [20, 18, 18, 14, 12, 12, 16, 12, 12, 14, 14, 14, 45] });
  if (result && !result.canceled) alert(`Excel generado correctamente:\n${result.filePath}`);
}

function printTicketRestaurantComputeVisible() {
  renderTicketRestaurantComputePreview();
  const calc = ticketRestaurantLastVisibleCompute || calculateTicketRestaurantCompute();
  const rows = getVisibleTicketRestaurantComputeRows(calc).map(row => [row.person.employeeNumber || "", ticketRestaurantFullName(row.person), row.person.calendar || "", row.theoretical, row.absenceDays, row.finalTickets]);
  openTicketRestaurantPrintPreview(`Cómputo Ticket Restaurante - ${TICKET_RESTAURANT_MONTHS[calc.month - 1]} ${calc.year}`, ["Nº empleado", "Nombre completo", "Calendario", "Tickets teóricos", "Ausencias aplicadas", "Tickets finales"], rows);
}

function calculateTicketRestaurantMonthlyQuote() {
  const calc = calculateTicketRestaurantCompute();
  const cfg = getTicketRestaurantConfig();
  const rows = calc.rows.map(row => ({
    employeeNumber: row.person.employeeNumber || "",
    fullName: ticketRestaurantFullName(row.person),
    ticketDays: row.finalTickets,
    ticketAmount: cfg.importe
  }));
  return { month: calc.month, year: calc.year, rows };
}

function renderTicketRestaurantMonthlyQuotePreview() {
  const panel = document.getElementById("ticketRestaurantMonthlyQuotePanel");
  const periodEl = document.getElementById("ticketRestaurantMonthlyQuotePeriod");
  const body = document.getElementById("ticketRestaurantMonthlyQuoteBody");
  if (!panel || !body) return;
  const calc = calculateTicketRestaurantMonthlyQuote();
  ticketRestaurantLastVisibleMonthlyQuote = calc;
  panel.hidden = false;
  if (periodEl) periodEl.textContent = `Cómputo Cotización Mensual para ${TICKET_RESTAURANT_MONTHS[calc.month - 1]} de ${calc.year}`;
  const visibleRows = getVisibleTicketRestaurantMonthlyQuoteRows(calc);
  body.innerHTML = visibleRows.length ? visibleRows.map(row => `<tr><td>${escapeHtml(row.employeeNumber)}</td><td>${escapeHtml(row.fullName)}</td><td>${escapeHtml(row.ticketDays)}</td><td>${escapeHtml(row.ticketAmount)}</td></tr>`).join("") : `<tr><td colspan="4" class="muted">Sin resultados que coincidan con los filtros.</td></tr>`;
}

async function exportTicketRestaurantMonthlyQuote() {
  renderTicketRestaurantMonthlyQuotePreview();
  const calc = ticketRestaurantLastVisibleMonthlyQuote || calculateTicketRestaurantMonthlyQuote();
  const rows = [TICKET_RESTAURANT_MONTHLY_QUOTE_HEADERS, ...getVisibleTicketRestaurantMonthlyQuoteRows(calc).map(row => [row.employeeNumber, row.fullName, row.ticketDays, row.ticketAmount])];
  const fileName = `Computo_Cotizacion_Mensual_${TICKET_RESTAURANT_MONTHS[calc.month - 1]}_${calc.year}.xlsx`;
  const result = await exportTicketWorkbook({ title: "Cómputo Cotización Mensual Ticket Restaurante", fileName, sheetName: "Cotizacion mensual", rows, widths: [16, 34, 24, 16] });
  if (result && !result.canceled) alert(`Excel generado correctamente:\n${result.filePath}`);
}

function printTicketRestaurantMonthlyQuote() {
  renderTicketRestaurantMonthlyQuotePreview();
  const calc = ticketRestaurantLastVisibleMonthlyQuote || calculateTicketRestaurantMonthlyQuote();
  const rows = getVisibleTicketRestaurantMonthlyQuoteRows(calc).map(row => [row.employeeNumber, row.fullName, row.ticketDays, row.ticketAmount]);
  openTicketRestaurantPrintPreview(`Cómputo Cotización Mensual - ${TICKET_RESTAURANT_MONTHS[calc.month - 1]} ${calc.year}`, TICKET_RESTAURANT_MONTHLY_QUOTE_HEADERS, rows);
}

window.showTicketRestaurantArea = showTicketRestaurantArea;
window.setTicketRestaurantCalendar = setTicketRestaurantCalendar;
window.moveTicketRestaurantCalendarYear = moveTicketRestaurantCalendarYear;
window.toggleTicketRestaurantNoTicket = toggleTicketRestaurantNoTicket;
window.autocompleteTicketRestaurantPersonFromPlantilla = autocompleteTicketRestaurantPersonFromPlantilla;
window.openTicketRestaurantPersonForm = openTicketRestaurantPersonForm;
window.closeTicketRestaurantPersonForm = closeTicketRestaurantPersonForm;
window.saveTicketRestaurantPersonForm = saveTicketRestaurantPersonForm;
window.deleteTicketRestaurantPerson = deleteTicketRestaurantPerson;
window.importTicketRestaurantPeople = importTicketRestaurantPeople;
window.downloadTicketRestaurantPeopleTemplate = downloadTicketRestaurantPeopleTemplate;
window.importTicketRestaurantAbsences = importTicketRestaurantAbsences;
window.downloadTicketRestaurantAbsenceTemplate = downloadTicketRestaurantAbsenceTemplate;
window.deleteTicketRestaurantAbsence = deleteTicketRestaurantAbsence;
window.renderTicketRestaurantPeople = renderTicketRestaurantPeople;
window.exportTicketRestaurantPeopleVisible = exportTicketRestaurantPeopleVisible;
window.printTicketRestaurantPeopleVisible = printTicketRestaurantPeopleVisible;
window.renderTicketRestaurantComputePreview = renderTicketRestaurantComputePreview;
window.setTicketRestaurantComputeSort = setTicketRestaurantComputeSort;
window.exportTicketRestaurantCompute = exportTicketRestaurantCompute;
window.printTicketRestaurantComputeVisible = printTicketRestaurantComputeVisible;
window.renderTicketRestaurantMonthlyQuotePreview = renderTicketRestaurantMonthlyQuotePreview;
window.exportTicketRestaurantMonthlyQuote = exportTicketRestaurantMonthlyQuote;
window.printTicketRestaurantMonthlyQuote = printTicketRestaurantMonthlyQuote;
window.saveTicketRestaurantConfigFromInputs = saveTicketRestaurantConfigFromInputs;
window.renderTicketRestaurant = renderTicketRestaurant;
window.getTicketRestaurantConfig = getTicketRestaurantConfig;
window.calculateTicketRestaurantCompute = calculateTicketRestaurantCompute;
