const TICKET_RESTAURANT_CALENDARS = ["Servicios Centrales", "Ingeniería Ariz", "Instalaciones Sopela", "Liberados"];
const TICKET_RESTAURANT_MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const TICKET_RESTAURANT_PERSON_HEADERS = ["Nº empleado", "Nombre", "Apellido1", "Apellido2", "DNI", "Puesto", "Calendario"];
const TICKET_RESTAURANT_ABSENCE_HEADERS = ["Nº empleado", "Nombre y apellidos", "Desde", "Hasta", "Motivo", "Total días"];
const TICKET_RESTAURANT_EXPORT_HEADERS = ["Nombre", "Apellido1", "Apellido2", "DNI", "Pedido", "Nº Emp", "Numero Tickets", "Importe", "Total", "Fec Inicio", "Fec Cad", "Hoja Gastos", "Ausencias"];
const TICKET_RESTAURANT_DEFAULT_CONFIG = { pedido: "2404407", importe: "14,57" };

const TICKET_RESTAURANT_DEBT_START_YEAR = 2026;
const TICKET_RESTAURANT_MIN_ABSENCE_DATE = "2026-03-01";

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

function applyTicketEmployeeNameColumnLayout(tableSelector) {
  const el = document.querySelector(tableSelector);
  const table = el && (el.tagName === "TABLE" ? el : el.closest("table"));
  if (!table) return;
  const headerRow = table.querySelector("thead tr");
  const first = headerRow && headerRow.children[0];
  const second = headerRow && headerRow.children[1];
  if (first) first.style.width = "7rem";
  if (second) second.style.minWidth = "16rem";
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
let ticketRestaurantComputeSort = { key: "calendar", direction: "desc" };
let ticketRestaurantVisibleAbsenceMonth = null;
let ticketRestaurantVisibleComputeMonth = null;
let ticketRestaurantVisibleContributionMonth = null;
let ticketRestaurantAbsencePreviewRows = [];
let ticketRestaurantVisiblePreviewMonth = null;
let ticketRestaurantAbsenceSort = { key: null, direction: null };

function normalizeTicketMonth(month) {
  const base = month || getPreviousSystemMonth();
  const date = new Date(Number(base.year), Number(base.month) - 1, 1);
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

function getPreviousSystemMonth() {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { month: previous.getMonth() + 1, year: previous.getFullYear() };
}

function addTicketMonths(month, delta) {
  const current = normalizeTicketMonth(month);
  const next = new Date(current.year, current.month - 1 + (Number(delta) || 0), 1);
  return { month: next.getMonth() + 1, year: next.getFullYear() };
}

function ticketMonthKey(month) {
  const normalized = normalizeTicketMonth(month);
  return `${normalized.year}-${String(normalized.month).padStart(2, "0")}`;
}


function isTicketMonthBefore(left, right) {
  const a = normalizeTicketMonth(left);
  const b = normalizeTicketMonth(right);
  if (a.year !== b.year) return a.year < b.year;
  return a.month < b.month;
}

function formatTicketMonthLabel(month) {
  const normalized = normalizeTicketMonth(month);
  const monthName = TICKET_RESTAURANT_MONTHS[normalized.month - 1] || "";
  return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${normalized.year}`;
}

function renderTicketMonthNavigator({ visibleMonth, onPrev, onNext, label = "" } = {}) {
  const monthLabel = formatTicketMonthLabel(visibleMonth || getPreviousSystemMonth());
  const safeLabel = label ? `<span class="muted">${escapeHtml(label)}</span>` : "";
  return `<div class="rrll-pro-list-toolbar ticket-month-navigator" style="justify-content:center;gap:12px;margin:8px 0;">
    ${safeLabel}
    <button type="button" class="secondary small" aria-label="Mes anterior" onclick="${escapeHtml(onPrev || "")}">←</button>
    <strong>${escapeHtml(monthLabel)}</strong>
    <button type="button" class="secondary small" aria-label="Mes siguiente" onclick="${escapeHtml(onNext || "")}">→</button>
  </div>`;
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

function normalizeTicketAbsenceReason(value) {
  return normalizeTicketText(value).replace(/\s+/g, " ").trim();
}

function normalizeTicketAbsenceIdentity(row) {
  const employeeNumberKey = normalizeTicketEmployeeLookup(row && row.employeeNumber);
  if (employeeNumberKey) return `emp:${employeeNumberKey}`;
  const nameKey = normalizeTicketText(row && row.employeeName).replace(/\s+/g, " ").trim();
  return nameKey ? `name:${nameKey}` : "";
}

function ticketRestaurantAbsenceUniqueKey(row, date) {
  const identity = normalizeTicketAbsenceIdentity(row);
  const reason = normalizeTicketAbsenceReason(row && row.reason);
  const normalizedDate = parseTicketDate(date);
  if (!identity || !reason || !normalizedDate) return "";
  return `${identity}|${normalizedDate}|${reason}`;
}

function buildTicketRestaurantAbsenceDailyKeys(row) {
  const from = parseTicketDate(row && row.from);
  const to = parseTicketDate((row && row.to) || from);
  const dates = expandDateRange(from, to);
  if (!dates.length) return [];
  return dates.map(date => ticketRestaurantAbsenceUniqueKey(row, date)).filter(Boolean);
}

function isTicketRestaurantAbsenceDateComputable(date) {
  const iso = parseTicketDate(date);
  return Boolean(iso && iso >= TICKET_RESTAURANT_MIN_ABSENCE_DATE);
}

function isTicketRestaurantAbsenceComputable(absence) {
  if (!absence || absence.computable === false) return false;
  const from = parseTicketDate(absence.from);
  const to = parseTicketDate(absence.to || absence.from);
  if (!from && !to) return false;
  return isTicketRestaurantAbsenceDateComputable(from || to) && isTicketRestaurantAbsenceDateComputable(to || from);
}

function normalizeTicketRestaurantAbsence(row = {}) {
  const from = parseTicketDate(row.from);
  const to = parseTicketDate(row.to || row.from) || from;
  const computedDefault = isTicketRestaurantAbsenceDateComputable(from);
  const computable = row.computable === false ? false : (row.computable === true ? true : computedDefault);
  return { ...row, from, to, computable };
}

function getTicketRestaurantAbsenceStats() {
  const stored = load("rrll_ticket_restaurant_absences", []);
  const rawRows = Array.isArray(stored) ? stored : [];
  const unique = [];
  const seen = new Set();
  let hiddenDuplicates = 0;
  rawRows.forEach(row => {
    const keys = buildTicketRestaurantAbsenceDailyKeys(row);
    if (!keys.length) {
      unique.push(row);
      return;
    }
    const duplicated = keys.some(key => seen.has(key));
    keys.forEach(key => seen.add(key));
    if (duplicated) hiddenDuplicates += 1;
    else unique.push(row);
  });
  return { rows: unique, hiddenDuplicates, existingKeys: seen };
}

function getTicketRestaurantAbsences() {
  return getTicketRestaurantAbsenceStats().rows;
}

function saveTicketRestaurantAbsences(items) {
  save("rrll_ticket_restaurant_absences", (Array.isArray(items) ? items : []).map(item => normalizeTicketRestaurantAbsence(item)));
}

function getTicketRestaurantPendingDiscountLedger() {
  const stored = load("rrll_ticket_restaurant_pending_discounts", {});
  return stored && typeof stored === "object" ? stored : {};
}

function saveTicketRestaurantPendingDiscountLedger(ledger) {
  save("rrll_ticket_restaurant_pending_discounts", ledger && typeof ledger === "object" ? ledger : {});
}

function buildTicketRestaurantPendingDiscountIdentity(row) {
  const employeeKey = normalizeTicketEmployeeLookup(row && row.employeeNumber);
  if (employeeKey) return `emp:${employeeKey}`;
  const nameKey = normalizeTicketText(row && row.employeeName).replace(/\s+/g, " ").trim();
  return nameKey ? `name:${nameKey}` : "";
}


function normalizeTicketRestaurantPendingItem(key, item) {
  const base = item && typeof item === "object" ? item : {};
  const [, keyDate = "", keyReason = ""] = String(key || "").split("|");
  const date = parseTicketDate(base.date) || parseTicketDate(keyDate) || "";
  const reason = normalizeTicketAbsenceReason(base.reason || keyReason) || (base.reason || keyReason || "");
  const consumedByMonth = base.consumedByMonth && typeof base.consumedByMonth === "object" ? { ...base.consumedByMonth } : {};
  const consumedTotal = Object.values(consumedByMonth).reduce((sum, value) => sum + parseTicketNumber(value), 0);
  const remainingRaw = parseTicketNumber(base.remainingDebt);
  const remainingDebt = Math.max(0, Number.isFinite(remainingRaw) ? remainingRaw : (date ? Math.max(0, 1 - consumedTotal) : 0));
  return {
    key: key || base.key || "",
    date,
    reason,
    remainingDebt,
    consumedByMonth
  };
}


function ticketRestaurantAbsenceGeneratesDiscount(absence, employee = null, date = "") {
  const isoDate = parseTicketDate(date || (absence && absence.from));
  if (!isoDate) return false;
  if (!isTicketRestaurantAbsenceComputable(absence) || !isTicketRestaurantAbsenceDateComputable(isoDate)) return false;
  const [yearStr = ""] = isoDate.split("-");
  const year = Number(yearStr);
  if (!Number.isFinite(year) || year < TICKET_RESTAURANT_DEBT_START_YEAR) return false;

  const person = employee || findTicketRestaurantPersonByEmployee(absence && absence.employeeNumber);
  if (!person || !normalizeTicketEmployeeLookup(person.employeeNumber)) return false;

  const normalizedCalendar = normalizeTicketCalendar(person.calendar);
  if (!isKnownTicketCalendar(normalizedCalendar)) return false;
  if (!employeeHasTicketRightOnDate(person.employeeNumber, isoDate, normalizedCalendar)) return false;

  const monthInfo = ticketRestaurantMonthYearFromDate(isoDate);
  if (!monthInfo || !monthInfo.month || !monthInfo.year) return false;
  const monthTheoretical = ticketRestaurantWorkingDays(monthInfo.month, monthInfo.year, normalizedCalendar);
  if (monthTheoretical <= 0) return false;

  return true;
}

function ticketRestaurantDateGeneratesDiscountForPerson(employee, date = "") {
  const isoDate = parseTicketDate(date);
  if (!isoDate || !isTicketRestaurantAbsenceDateComputable(isoDate)) return false;
  const person = employee || null;
  if (!person || !normalizeTicketEmployeeLookup(person.employeeNumber)) return false;

  const normalizedCalendar = normalizeTicketCalendar(person.calendar);
  if (!isKnownTicketCalendar(normalizedCalendar)) return false;
  if (!employeeHasTicketRightOnDate(person.employeeNumber, isoDate, normalizedCalendar)) return false;

  const monthInfo = ticketRestaurantMonthYearFromDate(isoDate);
  if (!monthInfo || !monthInfo.month || !monthInfo.year) return false;
  const monthTheoretical = ticketRestaurantWorkingDays(monthInfo.month, monthInfo.year, normalizedCalendar);
  if (monthTheoretical <= 0) return false;

  return true;
}

function ensureTicketRestaurantPendingDiscountLedgerFromAbsences() {
  const absences = getTicketRestaurantAbsences();
  const people = getTicketRestaurantPeople();
  const peopleByEmployee = new Map();
  const peopleByName = new Map();
  people.forEach(person => {
    const employeeKey = normalizeTicketEmployeeLookup(person && person.employeeNumber);
    if (employeeKey && !peopleByEmployee.has(employeeKey)) peopleByEmployee.set(employeeKey, person);
    const nameKey = normalizeTicketText(ticketRestaurantFullName(person)).replace(/\s+/g, " ").trim();
    if (nameKey && !peopleByName.has(nameKey)) peopleByName.set(nameKey, person);
  });

  const previousLedger = getTicketRestaurantPendingDiscountLedger();
  const ledger = {};

  absences.forEach(absence => {
    if (!isTicketRestaurantAbsenceComputable(absence)) return;
    let identity = buildTicketRestaurantPendingDiscountIdentity(absence);
    if (!identity) {
      const employeeKey = normalizeTicketEmployeeLookup(absence && absence.employeeNumber);
      const personByEmployee = employeeKey ? peopleByEmployee.get(employeeKey) : null;
      const absenceNameKey = normalizeTicketText(absence && absence.employeeName).replace(/\s+/g, " ").trim();
      const personByName = absenceNameKey ? peopleByName.get(absenceNameKey) : null;
      identity = buildTicketRestaurantPendingDiscountIdentity(personByEmployee || personByName || absence);
    }
    if (!identity) return;
    const dailyKeys = buildTicketRestaurantAbsenceDailyKeys(absence);
    if (!dailyKeys.length) return;
    if (!ledger[identity] || typeof ledger[identity] !== "object") ledger[identity] = { pendingDebt: 0, importedDailyKeys: {}, pendingItems: {} };
    const entry = ledger[identity];
    const previousEntry = previousLedger[identity] && typeof previousLedger[identity] === "object" ? previousLedger[identity] : {};
    const previousItems = previousEntry.pendingItems && typeof previousEntry.pendingItems === "object" ? previousEntry.pendingItems : {};

    dailyKeys.forEach(key => {
      const [, dayIso = "", reason = ""] = key.split("|");
      if (!dayIso) return;
      if (!ticketRestaurantAbsenceGeneratesDiscount(absence, peopleByEmployee.get(normalizeTicketEmployeeLookup(absence && absence.employeeNumber)), dayIso)) return;
      entry.importedDailyKeys[key] = 1;
      if (!entry.pendingItems[key]) {
        const previousItem = previousItems[key];
        const consumedByMonth = previousItem && previousItem.consumedByMonth && typeof previousItem.consumedByMonth === "object" ? previousItem.consumedByMonth : {};
        const consumedTotal = Object.values(consumedByMonth).reduce((sum, value) => sum + parseTicketNumber(value), 0);
        entry.pendingItems[key] = normalizeTicketRestaurantPendingItem(key, { key, date: dayIso, reason, remainingDebt: Math.max(0, 1 - consumedTotal), consumedByMonth });
      }
    });
    const computedDebt = Object.values(entry.pendingItems).reduce((sum, item) => sum + parseTicketNumber(item && item.remainingDebt), 0);
    entry.pendingDebt = computedDebt;
  });

  saveTicketRestaurantPendingDiscountLedger(ledger);
  return ledger;
}

function registerTicketRestaurantPendingDiscounts(absenceRows) {
  const ledger = getTicketRestaurantPendingDiscountLedger();
  (Array.isArray(absenceRows) ? absenceRows : []).forEach(absence => {
    if (!isTicketRestaurantAbsenceComputable(absence)) return;
    const identity = buildTicketRestaurantPendingDiscountIdentity(absence);
    if (!identity) return;
    const dailyKeys = buildTicketRestaurantAbsenceDailyKeys(absence);
    if (!dailyKeys.length) return;
    const entry = ledger[identity] && typeof ledger[identity] === "object"
      ? ledger[identity]
      : { pendingDebt: 0, importedDailyKeys: {}, pendingItems: {} };
    if (!entry.importedDailyKeys || typeof entry.importedDailyKeys !== "object") entry.importedDailyKeys = {};
    if (!entry.pendingItems || typeof entry.pendingItems !== "object") entry.pendingItems = {};
    const person = findTicketRestaurantPersonByEmployee(absence && absence.employeeNumber);
    dailyKeys.forEach(key => {
      const [, dayIso = "", reason = ""] = key.split("|");
      if (!dayIso) return;
      if (!ticketRestaurantAbsenceGeneratesDiscount(absence, person, dayIso)) return;
      if (entry.importedDailyKeys[key]) return;
      entry.importedDailyKeys[key] = 1;
      entry.pendingItems[key] = {
        key,
        date: dayIso,
        reason,
        remainingDebt: 1,
        consumedByMonth: {}
      };
    });
    entry.pendingDebt = Object.values(entry.pendingItems).reduce((sum, item) => sum + parseTicketNumber(item && item.remainingDebt), 0);
    ledger[identity] = entry;
  });
  saveTicketRestaurantPendingDiscountLedger(ledger);
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
    ["ingenieriaariz", "Ingeniería Ariz"],
    ["liberados", "Liberados"]
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
    "Nº empleado": ["Nº empleado", "N° empleado", "No empleado", "Num empleado", "Nº Emp", "N° Emp", "No Emp", "Numero empleado", "Número empleado", "N empleado", "Empleado", "EmployeeNumber", "Employee Number", "Num Emp"],
    Nombre: ["Nombre"],
    Apellido1: ["Apellido1", "Apellido 1", "Primer apellido"],
    Apellido2: ["Apellido2", "Apellido 2", "Segundo apellido"],
    DNI: ["DNI", "NIF", "Documento"],
    Puesto: ["Puesto", "Cargo", "Posición", "Posicion"],
    Calendario: ["Calendario", "Calendar"],
    Desde: ["Desde", "FromDate", "From Date", "Fecha desde", "Fec desde", "Inicio"],
    Hasta: ["Hasta", "ToDate", "To Date", "Fecha hasta", "Fec hasta", "Fin"],
    "Nombre y apellidos": ["Nombre y apellidos", "Nombre completo", "Nombre", "Apellidos", "Empleado nombre", "EmployeeName", "Employee Name"],
    Motivo: ["Motivo", "Reason", "Aus.", "Aus", "Ausencia", "Código", "Codigo"],
    "Total días": ["Total días", "Total dias", "TotalDays", "Total Days", "Días", "Dias", "Nº días", "No dias"]
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

async function openTicketRestaurantPersonForm(employeeNumber) {
  const lock = await window.acquireEditingLock?.("ticket-restaurante", employeeNumber);
  if (lock && lock.allowed === false) return;
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
  await exportTicketWorkbook({ title: "Descargar modelo ausencias", fileName: "Modelo_ausencias_ticket_restaurante.xlsx", sheetName: "Ausencias", rows: [TICKET_RESTAURANT_ABSENCE_HEADERS], widths: [14, 34, 14, 14, 28, 12] });
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

function ticketRestaurantNormalizePreviewDate(value) {
  return formatTicketDate(value) || String(value || "").trim();
}

function ticketRestaurantIsLikelyExcelSerial(value) {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 20000 && n < 80000;
}

function ticketRestaurantLooksLikeDateCell(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return true;
  const text = String(value ?? "").trim();
  if (!text) return false;
  return /^\d{4}-\d{1,2}-\d{1,2}$/.test(text) || /^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}$/.test(text) || ticketRestaurantIsLikelyExcelSerial(text);
}

function ticketRestaurantFindAbsenceHeaderIndex(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  for (let i = 0; i < Math.min(safeRows.length, 25); i += 1) {
    const index = ticketRestaurantBuildHeaderIndex(safeRows[i], TICKET_RESTAURANT_ABSENCE_HEADERS);
    const hits = TICKET_RESTAURANT_ABSENCE_HEADERS.filter(header => index[header] != null).length;
    if (hits >= 3 && index["Nº empleado"] != null && (index.Desde != null || index.Hasta != null) && index.Motivo != null) return i;
  }
  return -1;
}

function ticketRestaurantRowContainsAny(row, labels) {
  const text = normalizeTicketText((Array.isArray(row) ? row : []).join(" "));
  return labels.some(label => text.includes(normalizeTicketText(label)));
}

function detectTicketRestaurantAbsenceFormat(rows) {
  const safeRows = Array.isArray(rows) ? rows.filter(row => !ticketRestaurantRowIsEmpty(row)) : [];
  if (!safeRows.length) return "unknown";
  const zerkosLabels = ["EMPLEADO", "PUESTO ORGANIZATIVO", "RESIDENCIA", "NIVEL", "AUS.", "AÑO", "DESDE", "HASTA", "DIAS", "DÍAS"];
  const zerkosHits = new Set();
  safeRows.slice(0, 40).forEach(row => {
    zerkosLabels.forEach(label => {
      if (ticketRestaurantRowContainsAny(row, [label])) zerkosHits.add(normalizeTicketCompactText(label));
    });
  });
  const hasZerkosSpecificHeader = ["puestoorganizativo", "residencia", "nivel", "aus", "ano"].some(key => zerkosHits.has(key));
  if (hasZerkosSpecificHeader && zerkosHits.size >= 4) return "zerkos";
  if (ticketRestaurantFindAbsenceHeaderIndex(safeRows) >= 0) return "clean";
  if (safeRows.some(row => /^\s*empleado\s+\d+/i.test(String((row || []).join(" ")))) && safeRows.some(row => ticketRestaurantExtractZerkosAbsence(row, "__employee__"))) return "zerkos";
  return "unknown";
}

function normalizeTicketRestaurantAbsenceRow(row) {
  const employeeNumber = normalizeTicketEmployee(row && (row.employeeNumber ?? row["Nº empleado"] ?? row.empleado));
  const employeeName = String(row && (row.employeeName ?? row["Nombre y apellidos"] ?? row.nombreApellidos ?? row.nombreCompleto) || "").replace(/\s+/g, " ").trim();
  const fromDate = ticketRestaurantNormalizePreviewDate(row && (row.fromDate ?? row.Desde ?? row.desde));
  const toDate = ticketRestaurantNormalizePreviewDate(row && (row.toDate ?? row.Hasta ?? row.hasta)) || fromDate;
  const reason = String(row && (row.reason ?? row.Motivo ?? row.motivo) || "").replace(/\s+/g, " ").trim();
  let totalDays = row && (row.totalDays ?? row["Total días"] ?? row.totalDias);
  if (String(totalDays ?? "").trim() === "") totalDays = ticketRestaurantInclusiveDateDays(fromDate, toDate) || "";
  return { employeeNumber, employeeName, fromDate, toDate, reason, totalDays: String(totalDays ?? "").replace(",", ".").trim() };
}

function parseTicketRestaurantCleanAbsenceRows(rows) {
  const safeRows = Array.isArray(rows) ? rows.filter(row => !ticketRestaurantRowIsEmpty(row)) : [];
  const headerRowIndex = ticketRestaurantFindAbsenceHeaderIndex(safeRows);
  if (headerRowIndex < 0) return { rows: [], meta: { format: "clean", ignoredRows: safeRows.length, warnings: ["No se encontraron cabeceras reconocibles de ausencias."] } };
  const headerIndex = ticketRestaurantBuildHeaderIndex(safeRows[headerRowIndex], TICKET_RESTAURANT_ABSENCE_HEADERS);
  const parsedRows = [];
  let ignoredRows = 0;
  safeRows.slice(headerRowIndex + 1).forEach(row => {
    const raw = {};
    TICKET_RESTAURANT_ABSENCE_HEADERS.forEach((header, fallbackIndex) => {
      const index = headerIndex[header] != null ? headerIndex[header] : fallbackIndex;
      raw[header] = headerIndex[header] != null || header !== "Nombre y apellidos" ? (row[index] == null ? "" : row[index]) : "";
    });
    const normalized = normalizeTicketRestaurantAbsenceRow(raw);
    if (!normalized.employeeNumber && !normalized.fromDate && !normalized.reason) { ignoredRows += 1; return; }
    parsedRows.push(normalized);
  });
  return { rows: parsedRows, meta: { format: "clean", ignoredRows, warnings: [] } };
}

function ticketRestaurantInclusiveDateDays(fromDate, toDate) {
  const from = parseTicketDate(fromDate);
  const to = parseTicketDate(toDate) || from;
  if (!from || !to) return 0;
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (end < start) return 0;
  return Math.round((end - start) / 86400000) + 1;
}

function ticketRestaurantDetectZerkosEmployeeInfo(row) {
  const cells = (Array.isArray(row) ? row : []).map(cell => String(cell ?? "").replace(/\s+/g, " ").trim()).filter(Boolean);
  if (!cells.length) return null;
  const joined = cells.join(" ");
  if (/total\s+d[ií]as/i.test(joined)) return null;
  if (ticketRestaurantExtractZerkosAbsence(row, "__employee_probe__")) return null;
  let match = joined.match(/^empleado\s+(\d{1,10})\b\s*(.*)$/i);
  if (!match) match = cells[0].match(/^(\d{1,10})(?:\s+|$)(.*)$/);
  if (!match || ticketRestaurantLooksLikeDateCell(cells[0])) return null;
  const employeeNumber = normalizeTicketEmployee(match[1]);
  const rawName = (match[2] || cells.slice(1).join(" ")).replace(/^[\s:-]+/, "").replace(/\s+/g, " ").trim();
  const employeeName = /[a-záéíóúñ]/i.test(rawName) ? rawName : "";
  if (!employeeNumber || (!employeeName && !cells.some(cell => /[a-záéíóúñ]/i.test(cell)))) return null;
  return { employeeNumber, employeeName };
}

function ticketRestaurantDetectZerkosEmployee(row) {
  const employee = ticketRestaurantDetectZerkosEmployeeInfo(row);
  return employee ? employee.employeeNumber : "";
}

function ticketRestaurantExtractZerkosAbsence(row, employeeNumber) {
  const cells = (Array.isArray(row) ? row : []).map(cell => cell == null ? "" : cell).filter(cell => String(cell).trim() !== "");
  const joined = cells.map(cell => String(cell)).join(" ");
  if (!cells.length || /total\s+d[ií]as/i.test(joined)) return null;
  const reasonIndex = cells.findIndex(cell => /^[A-ZÑ]{2,6}\.?$/i.test(String(cell).trim()) && !/^(AUS|AÑO|ANO|DESDE|HASTA|DIAS|DÍAS)$/i.test(String(cell).trim()));
  if (reasonIndex < 0) return null;
  const reason = String(cells[reasonIndex]).replace(".", "").trim().toUpperCase();
  const dateCells = cells.slice(reasonIndex + 1).filter(ticketRestaurantLooksLikeDateCell);
  if (dateCells.length < 1) return null;
  const fromDate = ticketRestaurantNormalizePreviewDate(dateCells[0]);
  const toDate = ticketRestaurantNormalizePreviewDate(dateCells[1] || dateCells[0]);
  if (!parseTicketDate(fromDate) || !parseTicketDate(toDate)) return null;
  const dayCandidates = cells.slice(reasonIndex + 1).map(cell => String(cell).trim()).filter(text => {
    const n = Number(text.replace(",", "."));
    return Number.isFinite(n) && n > 0 && n < 367 && !/^20\d{2}$/.test(text) && !ticketRestaurantLooksLikeDateCell(text);
  });
  const totalDays = dayCandidates.length ? dayCandidates[dayCandidates.length - 1].replace(",", ".") : String(ticketRestaurantInclusiveDateDays(fromDate, toDate));
  return normalizeTicketRestaurantAbsenceRow({ employeeNumber, fromDate, toDate, reason, totalDays });
}

function parseTicketRestaurantZerkosAbsenceRows(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const parsedRows = [];
  const warnings = [];
  let ignoredRows = 0;
  let activeEmployee = null;
  safeRows.forEach(row => {
    if (ticketRestaurantRowIsEmpty(row)) { ignoredRows += 1; return; }
    const text = String((row || []).join(" "));
    if (/total\s+d[ií]as/i.test(text)) return;
    const employee = ticketRestaurantDetectZerkosEmployeeInfo(row);
    if (employee) { activeEmployee = employee; return; }
    if (ticketRestaurantRowContainsAny(row, ["PUESTO ORGANIZATIVO", "RESIDENCIA", "NIVEL", "AUS.", "AÑO", "DESDE", "HASTA", "DIAS", "DÍAS", "EMPLEADO"])) return;
    const absence = activeEmployee ? ticketRestaurantExtractZerkosAbsence(row, activeEmployee.employeeNumber) : null;
    if (absence && activeEmployee.employeeName) absence.employeeName = activeEmployee.employeeName;
    if (absence) parsedRows.push(absence);
    else ignoredRows += 1;
  });
  if (!parsedRows.length) warnings.push("No se han encontrado ausencias ZERKOS interpretables en el fichero.");
  return { rows: parsedRows, meta: { format: "zerkos", ignoredRows, warnings } };
}

function validateTicketRestaurantAbsencePreviewRows(rows) {
  const errors = [];
  const normalized = (Array.isArray(rows) ? rows : []).map((row, index) => {
    const item = normalizeTicketRestaurantAbsenceRow(row);
    const from = parseTicketDate(item.fromDate);
    const to = parseTicketDate(item.toDate) || from;
    if (!item.employeeNumber || !/^\d+$/.test(item.employeeNumber)) errors.push({ index, message: "Nº empleado obligatorio y numérico." });
    if (!from) errors.push({ index, message: "Desde obligatorio y fecha válida." });
    if (!to) errors.push({ index, message: "Hasta obligatorio y fecha válida." });
    if (from && to && new Date(`${to}T00:00:00Z`) < new Date(`${from}T00:00:00Z`)) errors.push({ index, message: "Hasta no puede ser anterior a Desde." });
    if (!item.reason) errors.push({ index, message: "Motivo obligatorio." });
    if (!String(item.totalDays || "").trim()) item.totalDays = String(ticketRestaurantInclusiveDateDays(from, to));
    if (!Number.isFinite(Number(String(item.totalDays).replace(",", "."))) || Number(String(item.totalDays).replace(",", ".")) <= 0) errors.push({ index, message: "Total días obligatorio y numérico." });
    return { ...item, fromDate: from ? formatTicketDate(from) : item.fromDate, toDate: to ? formatTicketDate(to) : item.toDate };
  });
  return { valid: errors.length === 0, errors, rows: normalized };
}

function closeTicketRestaurantAbsencePreviewModal() {
  const modal = document.getElementById("ticketRestaurantAbsencePreviewModal");
  if (modal) modal.classList.remove("open");
}

function ensureTicketRestaurantAbsencePreviewModal() {
  let modal = document.getElementById("ticketRestaurantAbsencePreviewModal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "ticketRestaurantAbsencePreviewModal";
  modal.className = "modal-backdrop";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="ticketRestaurantAbsencePreviewTitle" onclick="event.stopPropagation()" style="width:min(1100px,96vw);max-height:92vh;display:flex;flex-direction:column;">
      <h3 id="ticketRestaurantAbsencePreviewTitle">Revisar ausencias importadas</h3>
      <p id="ticketRestaurantAbsencePreviewSummary" class="muted"></p>
      <div id="ticketRestaurantAbsencePreviewWarnings" class="muted" style="font-size:.9rem;"></div>
      <div id="ticketRestaurantAbsencePreviewErrors" style="color:#b42318;font-size:.9rem;" aria-live="polite"></div>
      <div id="ticketRestaurantAbsencePreviewMonthSelector"></div>
      <p id="ticketRestaurantAbsencePreviewMonthCount" class="muted" style="margin:.25rem 0 .75rem;"></p>
      <div class="rrll-pro-table-wrap" style="overflow:auto;min-height:180px;max-height:55vh;">
        <table class="rrll-pro-table ticket-table">
          <thead><tr><th style="width:7rem;">Nº empleado</th><th style="min-width:16rem;">Nombre y apellidos</th><th>Desde</th><th>Hasta</th><th>Motivo</th><th>Total días</th><th>Acciones</th></tr></thead>
          <tbody id="ticketRestaurantAbsencePreviewBody"></tbody>
        </table>
      </div>
      <div class="modal-actions" style="position:sticky;bottom:0;background:inherit;padding-top:12px;">
        <button type="button" class="secondary" onclick="addTicketRestaurantAbsencePreviewRow()">Añadir ausencia</button>
        <span style="flex:1"></span>
        <button type="button" class="secondary" onclick="closeTicketRestaurantAbsencePreviewModal()">Cancelar</button>
        <button type="button" onclick="saveTicketRestaurantAbsencePreviewRows()">Guardar ausencias</button>
      </div>
    </div>`;
  modal.addEventListener("click", event => { if (event.target === modal) closeTicketRestaurantAbsencePreviewModal(); });
  document.body.appendChild(modal);
  return modal;
}

function getTicketPreviewVisibleMonth() {
  if (!ticketRestaurantVisiblePreviewMonth) ticketRestaurantVisiblePreviewMonth = getPreviousSystemMonth();
  return ticketRestaurantVisiblePreviewMonth;
}

function getTicketPreviewRowMonth(row) {
  const fromPeriod = ticketRestaurantMonthYearFromDate(row && row.fromDate);
  if (fromPeriod.month && fromPeriod.year) return fromPeriod;
  return row && row._previewMonth ? normalizeTicketMonth(row._previewMonth) : getTicketPreviewVisibleMonth();
}

function ticketRestaurantPreviewRowIntersectsVisibleMonth(row, month) {
  const visible = normalizeTicketMonth(month || getTicketPreviewVisibleMonth());
  const from = row && (row.fromDate || row.from);
  const to = row && (row.toDate || row.to || from);
  const dates = expandDateRange(from, to);
  if (dates.length) return dates.some(date => ticketRestaurantDateIsInVisibleMonth(date, visible));
  const period = getTicketPreviewRowMonth(row);
  return period.month === visible.month && period.year === visible.year;
}

function filterTicketPreviewRowsByMonth(rows, month) {
  return (Array.isArray(rows) ? rows : []).filter(row => ticketRestaurantPreviewRowIntersectsVisibleMonth(row, month));
}

function getTicketPreviewAvailableMonths() {
  const byKey = new Map();
  ticketRestaurantAbsencePreviewRows.forEach(row => {
    const period = getTicketPreviewRowMonth(row);
    if (period.month && period.year) byKey.set(ticketMonthKey(period), period);
  });
  return [...byKey.values()].sort((a, b) => a.year - b.year || a.month - b.month);
}

function ticketRestaurantSyncPreviewRowsFromDom() {
  document.querySelectorAll('#ticketRestaurantAbsencePreviewBody tr[data-preview-index]').forEach(rowEl => {
    const index = Number(rowEl.dataset.previewIndex);
    if (!Number.isInteger(index) || !ticketRestaurantAbsencePreviewRows[index]) return;
    const next = {
      ...ticketRestaurantAbsencePreviewRows[index],
      employeeNumber: rowEl.querySelector('[data-field="employeeNumber"]')?.value || "",
      employeeName: rowEl.querySelector('[data-field="employeeName"]')?.value || "",
      fromDate: rowEl.querySelector('[data-field="fromDate"]')?.value || "",
      toDate: rowEl.querySelector('[data-field="toDate"]')?.value || "",
      reason: rowEl.querySelector('[data-field="reason"]')?.value || "",
      totalDays: rowEl.querySelector('[data-field="totalDays"]')?.value || ""
    };
    const period = ticketRestaurantMonthYearFromDate(next.fromDate);
    next._previewMonth = period.month && period.year ? period : (next._previewMonth || getTicketPreviewVisibleMonth());
    ticketRestaurantAbsencePreviewRows[index] = next;
  });
}

function changeTicketPreviewMonth(delta) {
  ticketRestaurantSyncPreviewRowsFromDom();
  const months = getTicketPreviewAvailableMonths();
  if (!months.length) {
    ticketRestaurantVisiblePreviewMonth = addTicketMonths(getTicketPreviewVisibleMonth(), delta);
    renderTicketRestaurantAbsencePreviewRows();
    return;
  }
  const currentKey = ticketMonthKey(getTicketPreviewVisibleMonth());
  let index = months.findIndex(month => ticketMonthKey(month) === currentKey);
  if (index < 0) {
    const direction = Number(delta) || 0;
    index = direction >= 0 ? months.findIndex(month => ticketMonthKey(month) > currentKey) : -1;
    if (index < 0 && direction >= 0) index = months.length - 1;
    if (index < 0) {
      const monthKeys = months.map(ticketMonthKey);
      for (let i = monthKeys.length - 1; i >= 0; i -= 1) {
        if (monthKeys[i] < currentKey) { index = i; break; }
      }
    }
    if (index < 0) index = 0;
  } else {
    index = Math.max(0, Math.min(months.length - 1, index + (Number(delta) || 0)));
  }
  ticketRestaurantVisiblePreviewMonth = months[index];
  renderTicketRestaurantAbsencePreviewRows();
}

function renderTicketPreviewMonthSelector() {
  const target = document.getElementById("ticketRestaurantAbsencePreviewMonthSelector");
  if (!target) return;
  target.innerHTML = renderTicketMonthNavigator({
    visibleMonth: getTicketPreviewVisibleMonth(),
    onPrev: "changeTicketPreviewMonth(-1)",
    onNext: "changeTicketPreviewMonth(1)"
  });
}

function ticketRestaurantReadPreviewRowsFromDom() {
  ticketRestaurantSyncPreviewRowsFromDom();
  return ticketRestaurantAbsencePreviewRows.map(({ _previewMonth, ...row }) => row);
}

function renderTicketRestaurantAbsencePreviewRows(rows) {
  if (Array.isArray(rows)) {
    ticketRestaurantAbsencePreviewRows = rows.map(row => {
      const normalized = normalizeTicketRestaurantAbsenceRow(row);
      const period = ticketRestaurantMonthYearFromDate(normalized.fromDate);
      return { ...normalized, _previewMonth: period.month && period.year ? period : getTicketPreviewVisibleMonth() };
    });
  }
  const body = document.getElementById("ticketRestaurantAbsencePreviewBody");
  if (!body) return;
  renderTicketPreviewMonthSelector();
  const visibleMonth = getTicketPreviewVisibleMonth();
  const visibleRows = ticketRestaurantAbsencePreviewRows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => filterTicketPreviewRowsByMonth([row], visibleMonth).length);
  const count = document.getElementById("ticketRestaurantAbsencePreviewMonthCount");
  if (count) count.textContent = `Mostrando ${visibleRows.length} ausencias de ${formatTicketMonthLabel(visibleMonth)}`;
  body.innerHTML = visibleRows.map(({ row, index }) => `
    <tr data-index="${index}" data-preview-index="${index}">
      <td><input data-field="employeeNumber" value="${escapeHtml(row.employeeNumber || "")}" /></td>
      <td><input data-field="employeeName" value="${escapeHtml(row.employeeName || "")}" /></td>
      <td><input data-field="fromDate" value="${escapeHtml(row.fromDate || "")}" placeholder="dd/mm/aaaa" /></td>
      <td><input data-field="toDate" value="${escapeHtml(row.toDate || "")}" placeholder="dd/mm/aaaa" /></td>
      <td><input data-field="reason" value="${escapeHtml(row.reason || "")}" /></td>
      <td><input data-field="totalDays" value="${escapeHtml(row.totalDays || "")}" /></td>
      <td class="table-actions"><button class="danger small" type="button" onclick="removeTicketRestaurantAbsencePreviewRow(this)">Eliminar</button></td>
    </tr>`).join("") || `<tr><td colspan="7" class="muted">No hay ausencias para este mes. Puedes añadir una manualmente.</td></tr>`;
}


function openTicketRestaurantAbsencePreviewModal(parsedRows, meta = {}) {
  const modal = ensureTicketRestaurantAbsencePreviewModal();
  modal.dataset.fileName = meta.fileName || "";
  modal.dataset.ignoredRows = String(meta.ignoredRows || 0);
  const rows = (Array.isArray(parsedRows) ? parsedRows : []).map(normalizeTicketRestaurantAbsenceRow);
  ticketRestaurantVisiblePreviewMonth = getPreviousSystemMonth();
  ticketRestaurantAbsencePreviewRows = rows.map(row => {
    const period = ticketRestaurantMonthYearFromDate(row.fromDate);
    return { ...row, _previewMonth: period.month && period.year ? period : ticketRestaurantVisiblePreviewMonth };
  });
  document.getElementById("ticketRestaurantAbsencePreviewSummary").textContent = `Ausencias detectadas: ${rows.length}. Filas ignoradas: ${meta.ignoredRows || 0}.`;
  document.getElementById("ticketRestaurantAbsencePreviewWarnings").textContent = (meta.warnings || []).filter(Boolean).join(" ");
  document.getElementById("ticketRestaurantAbsencePreviewErrors").textContent = "";
  renderTicketRestaurantAbsencePreviewRows();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function addTicketRestaurantAbsencePreviewRow() {
  ticketRestaurantSyncPreviewRowsFromDom();
  ticketRestaurantAbsencePreviewRows.push({ employeeNumber: "", employeeName: "", fromDate: "", toDate: "", reason: "", totalDays: "", _previewMonth: getTicketPreviewVisibleMonth() });
  renderTicketRestaurantAbsencePreviewRows();
}

function removeTicketRestaurantAbsencePreviewRow(button) {
  const row = button && button.closest("tr");
  const index = row ? Number(row.dataset.previewIndex) : -1;
  ticketRestaurantSyncPreviewRowsFromDom();
  if (Number.isInteger(index) && index >= 0) ticketRestaurantAbsencePreviewRows.splice(index, 1);
  renderTicketRestaurantAbsencePreviewRows();
}

function saveTicketRestaurantAbsencePreviewRows() {
  const previewRows = ticketRestaurantReadPreviewRowsFromDom();
  if (!previewRows.length) {
    const errorEl = document.getElementById("ticketRestaurantAbsencePreviewErrors");
    if (errorEl) errorEl.textContent = "Añade al menos una ausencia antes de guardar.";
    return;
  }
  const validation = validateTicketRestaurantAbsencePreviewRows(previewRows);
  document.querySelectorAll("#ticketRestaurantAbsencePreviewBody tr").forEach(row => row.style.outline = "");
  if (!validation.valid) {
    const firstMessages = validation.errors.slice(0, 5).map(error => `Fila ${error.index + 1}: ${error.message}`);
    const more = validation.errors.length > 5 ? ` (${validation.errors.length - 5} errores más)` : "";
    const errorEl = document.getElementById("ticketRestaurantAbsencePreviewErrors");
    if (errorEl) errorEl.textContent = `${firstMessages.join(" ")}${more}`;
    validation.errors.forEach(error => {
      const row = document.querySelector(`#ticketRestaurantAbsencePreviewBody tr[data-index="${error.index}"]`);
      if (row) row.style.outline = "2px solid #d92d20";
    });
    return;
  }
  const now = new Date().toISOString();
  const existingStats = getTicketRestaurantAbsenceStats();
  const existingKeys = new Set(existingStats.existingKeys);
  const importSeenKeys = new Set();
  const records = [];
  let skippedDuplicates = 0;
  validation.rows.forEach(row => {
    const from = parseTicketDate(row.fromDate);
    const to = parseTicketDate(row.toDate) || from;
    const previewRecord = {
      employeeNumber: normalizeTicketEmployee(row.employeeNumber),
      employeeName: String(row.employeeName || "").replace(/\s+/g, " ").trim(),
      from,
      to,
      reason: String(row.reason || "").trim(),
      computable: isTicketRestaurantAbsenceDateComputable(from)
    };
    const dailyKeys = buildTicketRestaurantAbsenceDailyKeys(previewRecord);
    const duplicated = dailyKeys.length && dailyKeys.some(key => existingKeys.has(key) || importSeenKeys.has(key));
    dailyKeys.forEach(key => importSeenKeys.add(key));
    if (duplicated) {
      skippedDuplicates += 1;
      return;
    }
    const period = ticketRestaurantMonthYearFromDate(from);
    records.push({
      id: `tr-absence-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      employeeNumber: previewRecord.employeeNumber,
      employeeName: previewRecord.employeeName,
      from,
      to,
      reason: previewRecord.reason,
      computable: previewRecord.computable,
      totalDays: parseTicketNumber(row.totalDays),
      month: period.month,
      year: period.year,
      createdAt: now
    });
  });
  saveTicketRestaurantAbsences([...getTicketRestaurantAbsences(), ...records]);
  registerTicketRestaurantPendingDiscounts(records);
  closeTicketRestaurantAbsencePreviewModal();
  renderTicketRestaurantAbsences();
  renderTicketRestaurantComputePreview();
  const invalidRows = Number(document.getElementById("ticketRestaurantAbsencePreviewModal")?.dataset.ignoredRows || 0);
  showTicketRestaurantImportSummary("ticketRestaurantAbsenceImportSummary", records.length, skippedDuplicates, invalidRows, document.getElementById("ticketRestaurantAbsencePreviewModal")?.dataset.fileName || "Fichero");
  const hiddenExisting = existingStats.hiddenDuplicates;
  alert(`Importación de ausencias finalizada.\nNuevas importadas: ${records.length}.\nIgnoradas por duplicado: ${skippedDuplicates}.\nDuplicados existentes ocultados: ${hiddenExisting}.\nFilas no válidas/ignoradas: ${invalidRows}.`);
}

async function importTicketRestaurantAbsences() {
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
  const format = detectTicketRestaurantAbsenceFormat(result.rows);
  let parsed = null;
  if (format === "clean") parsed = parseTicketRestaurantCleanAbsenceRows(result.rows);
  else if (format === "zerkos") parsed = parseTicketRestaurantZerkosAbsenceRows(result.rows);
  else {
    alert("No se ha podido detectar el formato de ausencias. Usa el modelo limpio (Nº empleado, Desde, Hasta, Motivo, Total días) o el informe bruto ZERKOS con cabeceras EMPLEADO/AUS./DESDE/HASTA/DIAS.");
    return;
  }
  const meta = { ...(parsed.meta || {}), fileName: result.fileName || "Fichero" };
  if (!parsed.rows.length) {
    alert(`No se encontraron ausencias válidas para previsualizar. Filas ignoradas: ${meta.ignoredRows || 0}.`);
    return;
  }
  openTicketRestaurantAbsencePreviewModal(parsed.rows, meta);
}


function getDefaultTicketAbsenceMonth() {
  return getPreviousSystemMonth();
}

function getTicketAbsenceVisibleMonth() {
  if (!ticketRestaurantVisibleAbsenceMonth) ticketRestaurantVisibleAbsenceMonth = getPreviousSystemMonth();
  return ticketRestaurantVisibleAbsenceMonth;
}

function changeTicketAbsenceMonth(delta) {
  ticketRestaurantVisibleAbsenceMonth = addTicketMonths(getTicketAbsenceVisibleMonth(), delta);
  renderTicketRestaurantAbsences();
}

function renderTicketAbsenceMonthSelector() {
  const body = document.getElementById("ticketRestaurantAbsencesBody");
  if (!body) return;
  const table = body.closest("table");
  if (table) {
    const thead = table.querySelector("thead");
    if (thead) thead.innerHTML = `<tr>
      <th style="width:7rem;"><button type="button" class="ticket-sort-button" data-ticket-absence-sort="employeeNumber" onclick="setTicketRestaurantAbsenceSort('employeeNumber')">Nº empleado<span class="ticket-sort-indicator" aria-hidden="true"></span></button></th>
      <th style="min-width:16rem;"><button type="button" class="ticket-sort-button" data-ticket-absence-sort="employeeName" onclick="setTicketRestaurantAbsenceSort('employeeName')">Nombre y apellidos<span class="ticket-sort-indicator" aria-hidden="true"></span></button></th>
      <th><button type="button" class="ticket-sort-button" data-ticket-absence-sort="from" onclick="setTicketRestaurantAbsenceSort('from')">Desde<span class="ticket-sort-indicator" aria-hidden="true"></span></button></th>
      <th>Hasta</th>
      <th><button type="button" class="ticket-sort-button" data-ticket-absence-sort="reason" onclick="setTicketRestaurantAbsenceSort('reason')">Motivo<span class="ticket-sort-indicator" aria-hidden="true"></span></button></th>
      <th>Total días</th>
      <th>Acciones</th>
    </tr>`;
    const wrap = table.closest(".rrll-pro-table-wrap");
    if (wrap) {
      let selector = document.getElementById("ticketRestaurantAbsenceMonthSelector");
      if (!selector) {
        wrap.insertAdjacentHTML("beforebegin", `<div id="ticketRestaurantAbsenceMonthSelector"></div>`);
        selector = document.getElementById("ticketRestaurantAbsenceMonthSelector");
      }
      if (selector) selector.innerHTML = renderTicketMonthNavigator({ visibleMonth: getTicketAbsenceVisibleMonth(), onPrev: "changeTicketAbsenceMonth(-1)", onNext: "changeTicketAbsenceMonth(1)" });
    }
  }
  updateTicketRestaurantAbsenceSortIndicators();
}


function filterTicketAbsencesByVisibleMonth(absences) {
  const visible = getTicketAbsenceVisibleMonth();
  return (Array.isArray(absences) ? absences : []).filter(item => {
    if (!isTicketRestaurantAbsenceComputable(item)) return false;
    if (ticketRestaurantAbsenceIntersectsVisibleMonth(item, visible)) return true;
    const period = ticketRestaurantMonthYearFromDate(item && item.from);
    const month = period.month || Number(item && item.month);
    const year = period.year || Number(item && item.year);
    return month === visible.month && year === visible.year;
  });
}

function compareTicketRestaurantAbsenceDefault(a, b) {
  const aName = normalizeTicketText(a && a.employeeName);
  const bName = normalizeTicketText(b && b.employeeName);
  if (aName && bName) {
    const byName = aName.localeCompare(bName, "es", { numeric: true, sensitivity: "base" });
    if (byName) return byName;
  }
  if (aName && !bName) return -1;
  if (!aName && bName) return 1;
  const byEmployee = compareTicketRestaurantSortValues(a && a.employeeNumber, b && b.employeeNumber, "text");
  if (byEmployee) return byEmployee;
  return compareTicketRestaurantSortValues(a && a.from, b && b.from, "date");
}

function sortTicketRestaurantAbsences(absences) {
  const sort = ticketRestaurantAbsenceSort || {};
  const columns = {
    employeeNumber: { type: "text", getter: item => item && item.employeeNumber },
    employeeName: { type: "text", getter: item => item && item.employeeName },
    from: { type: "date", getter: item => item && item.from },
    reason: { type: "text", getter: item => item && item.reason }
  };
  const column = columns[sort.key];
  return [...(Array.isArray(absences) ? absences : [])].map((item, index) => ({ item, index })).sort((a, b) => {
    const result = column && sort.direction ? compareTicketRestaurantSortValues(column.getter(a.item), column.getter(b.item), column.type) * (sort.direction === "desc" ? -1 : 1) : compareTicketRestaurantAbsenceDefault(a.item, b.item);
    return result || a.index - b.index;
  }).map(entry => entry.item);
}

function setTicketRestaurantAbsenceSort(key) {
  ticketRestaurantAbsenceSort = ticketRestaurantAbsenceSort.key === key ? { key, direction: ticketRestaurantAbsenceSort.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" };
  renderTicketRestaurantAbsences();
}

function updateTicketRestaurantAbsenceSortIndicators() {
  document.querySelectorAll("[data-ticket-absence-sort]").forEach(button => {
    const active = button.dataset.ticketAbsenceSort === ticketRestaurantAbsenceSort.key;
    const indicator = button.querySelector(".ticket-sort-indicator");
    if (indicator) indicator.textContent = active ? (ticketRestaurantAbsenceSort.direction === "desc" ? " ↓" : " ↑") : "";
    const th = button.closest("th");
    if (th) th.setAttribute("aria-sort", active ? (ticketRestaurantAbsenceSort.direction === "desc" ? "descending" : "ascending") : "none");
  });
}

function deleteTicketRestaurantAbsence(id) {
  if (!id || !confirm("¿Eliminar esta ausencia importada?")) return;
  saveTicketRestaurantAbsences(getTicketRestaurantAbsences().filter(item => item.id !== id));
  ensureTicketRestaurantPendingDiscountLedgerFromAbsences();
  renderTicketRestaurantAbsences();
  renderTicketRestaurantComputePreview();
}

async function openTicketRestaurantAbsenceEditModal(id) {
  const lock = await window.acquireEditingLock?.("ticket-restaurante", id);
  if (lock && lock.allowed === false) return;
  const absences = getTicketRestaurantAbsences();
  const current = absences.find(item => item.id === id);
  if (!current) return;
  let modal = document.getElementById("ticketRestaurantAbsenceEditModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "ticketRestaurantAbsenceEditModal";
    modal.className = "modal-backdrop";
    modal.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true" onclick="event.stopPropagation()" style="width:min(720px,96vw);">
      <h3>Editar ausencia Ticket Restaurant</h3>
      <input type="hidden" id="ticketRestaurantAbsenceEditId">
      <div class="rrll-pro-grid cols-2">
        <label>Nº empleado<input id="ticketRestaurantAbsenceEditEmployee" type="text"></label>
        <label>Persona<input id="ticketRestaurantAbsenceEditName" type="text"></label>
        <label>Fecha ausencia<input id="ticketRestaurantAbsenceEditFrom" type="date"></label>
        <label>Hasta<input id="ticketRestaurantAbsenceEditTo" type="date"></label>
        <label>Motivo<input id="ticketRestaurantAbsenceEditReason" type="text"></label>
        <label>Afecta ticket<select id="ticketRestaurantAbsenceEditAffects"><option value="1">Sí</option><option value="0">No</option></select></label>
        <label>Estado<select id="ticketRestaurantAbsenceEditComputable"><option value="1">Computa</option><option value="0">No computa</option></select></label>
        <label>Observaciones<input id="ticketRestaurantAbsenceEditNotes" type="text"></label>
      </div>
      <div class="modal-actions"><button class="secondary" type="button" onclick="closeTicketRestaurantAbsenceEditModal()">Cancelar</button><button type="button" onclick="saveTicketRestaurantAbsenceEdit()">Guardar</button></div>
    </div>`;
    modal.addEventListener("click", event => { if (event.target === modal) closeTicketRestaurantAbsenceEditModal(); });
    document.body.appendChild(modal);
  }
  document.getElementById("ticketRestaurantAbsenceEditId").value = current.id || "";
  document.getElementById("ticketRestaurantAbsenceEditEmployee").value = current.employeeNumber || "";
  document.getElementById("ticketRestaurantAbsenceEditName").value = current.employeeName || "";
  document.getElementById("ticketRestaurantAbsenceEditFrom").value = parseTicketDate(current.from) || "";
  document.getElementById("ticketRestaurantAbsenceEditTo").value = parseTicketDate(current.to || current.from) || "";
  document.getElementById("ticketRestaurantAbsenceEditReason").value = current.reason || "";
  document.getElementById("ticketRestaurantAbsenceEditAffects").value = current.affectsTicket === false ? "0" : "1";
  document.getElementById("ticketRestaurantAbsenceEditComputable").value = current.computable === false ? "0" : "1";
  document.getElementById("ticketRestaurantAbsenceEditNotes").value = current.notes || "";
  modal.classList.add("open");
}

function closeTicketRestaurantAbsenceEditModal() {
  const modal = document.getElementById("ticketRestaurantAbsenceEditModal");
  if (modal) modal.classList.remove("open");
}

function saveTicketRestaurantAbsenceEdit() {
  const id = document.getElementById("ticketRestaurantAbsenceEditId").value;
  const absences = getTicketRestaurantAbsences();
  const index = absences.findIndex(item => item.id === id);
  if (index < 0) return;
  const from = parseTicketDate(document.getElementById("ticketRestaurantAbsenceEditFrom").value);
  const to = parseTicketDate(document.getElementById("ticketRestaurantAbsenceEditTo").value) || from;
  const desiredComputable = document.getElementById("ticketRestaurantAbsenceEditComputable").value === "1";
  absences[index] = normalizeTicketRestaurantAbsence({
    ...absences[index],
    employeeNumber: normalizeTicketEmployee(document.getElementById("ticketRestaurantAbsenceEditEmployee").value),
    employeeName: String(document.getElementById("ticketRestaurantAbsenceEditName").value || "").trim(),
    from,
    to,
    reason: String(document.getElementById("ticketRestaurantAbsenceEditReason").value || "").trim(),
    affectsTicket: document.getElementById("ticketRestaurantAbsenceEditAffects").value === "1",
    notes: String(document.getElementById("ticketRestaurantAbsenceEditNotes").value || "").trim(),
    computable: desiredComputable && isTicketRestaurantAbsenceDateComputable(from)
  });
  saveTicketRestaurantAbsences(absences);
  ensureTicketRestaurantPendingDiscountLedgerFromAbsences();
  closeTicketRestaurantAbsenceEditModal();
  renderTicketRestaurantAbsences();
  renderTicketRestaurantComputePreview();
}

function renderTicketRestaurantAbsences() {
  const body = document.getElementById("ticketRestaurantAbsencesBody");
  const count = document.getElementById("ticketRestaurantAbsencesCount");
  if (!body) return;
  renderTicketAbsenceMonthSelector();
  const absenceStats = getTicketRestaurantAbsenceStats();
  const allAbsences = absenceStats.rows;
  const absences = sortTicketRestaurantAbsences(filterTicketAbsencesByVisibleMonth(allAbsences));
  const visible = getTicketAbsenceVisibleMonth();
  if (count) {
    const duplicatedHint = absenceStats.hiddenDuplicates ? ` · ${absenceStats.hiddenDuplicates} duplicados ocultos` : "";
    count.textContent = `${absences.length} de ${allAbsences.length} ausencias · ${String(visible.month).padStart(2, "0")}/${visible.year}${duplicatedHint}`;
  }
  body.innerHTML = absences.length ? absences.map(item => `<tr ondblclick="openTicketRestaurantAbsenceEditModal('${escapeHtml(item.id)}')" title="Doble clic para editar ausencia">
    <td>${escapeHtml(item.employeeNumber)}</td><td>${escapeHtml(item.employeeName || "")}</td><td>${formatTicketDate(item.from)}</td><td>${formatTicketDate(item.to)}</td><td>${escapeHtml(item.reason)}</td><td>${escapeHtml(item.totalDays)}</td>
    <td class="table-actions"><button class="danger small" type="button" onclick="deleteTicketRestaurantAbsence('${escapeHtml(item.id)}')">Eliminar</button></td>
  </tr>`).join("") : `<tr><td colspan="7" class="muted">No hay ausencias para este mes</td></tr>`;
  updateTicketRestaurantAbsenceSortIndicators();
}

function getTicketComputeVisibleMonth() {
  if (!ticketRestaurantVisibleComputeMonth) ticketRestaurantVisibleComputeMonth = getPreviousSystemMonth();
  return ticketRestaurantVisibleComputeMonth;
}

function changeTicketComputeMonth(delta) {
  ticketRestaurantVisibleComputeMonth = addTicketMonths(getTicketComputeVisibleMonth(), delta);
  renderTicketRestaurantComputeControls();
}

function renderTicketComputeMonthSelector() {
  const periodEl = document.getElementById("ticketRestaurantComputePeriod");
  if (!periodEl) return;
  let selector = document.getElementById("ticketRestaurantComputeMonthSelector");
  if (!selector) {
    periodEl.insertAdjacentHTML("beforebegin", `<div id="ticketRestaurantComputeMonthSelector"></div>`);
    selector = document.getElementById("ticketRestaurantComputeMonthSelector");
  }
  if (selector) selector.innerHTML = renderTicketMonthNavigator({ visibleMonth: getTicketComputeVisibleMonth(), onPrev: "changeTicketComputeMonth(-1)", onNext: "changeTicketComputeMonth(1)" });
}

function renderTicketRestaurantComputeControls() {
  const month = document.getElementById("ticketRestaurantComputeMonth");
  const year = document.getElementById("ticketRestaurantComputeYear");
  const visible = getTicketComputeVisibleMonth();
  if (month) {
    if (month.dataset.ready !== "1") {
      month.innerHTML = TICKET_RESTAURANT_MONTHS.map((name, index) => `<option value="${index + 1}">${name}</option>`).join("");
      month.dataset.ready = "1";
    }
    month.value = String(visible.month);
    const field = month.closest(".rrll-pro-field");
    if (field) field.style.display = "none";
  }
  if (year) {
    year.value = visible.year;
    const field = year.closest(".rrll-pro-field");
    if (field) field.style.display = "none";
  }
  renderTicketComputeMonthSelector();
  renderTicketRestaurantComputePreview();
}

function getTicketRestaurantComputeSelection() {
  return getTicketComputeVisibleMonth();
}



function ticketRestaurantEscapeJs(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function ticketRestaurantDateToLocalDate(isoDate) {
  const iso = parseTicketDate(isoDate);
  if (!iso) return null;
  return new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
}

function ticketRestaurantLocalDateToIso(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function expandDateRange(fromDate, toDate) {
  const from = ticketRestaurantDateToLocalDate(fromDate);
  const to = ticketRestaurantDateToLocalDate(toDate || fromDate);
  if (!from && !to) return [];
  const start = from || to;
  const end = to || from;
  const first = start <= end ? start : end;
  const last = start <= end ? end : start;
  const dates = [];
  for (let current = new Date(first.getFullYear(), first.getMonth(), first.getDate()); current <= last; current.setDate(current.getDate() + 1)) {
    dates.push(ticketRestaurantLocalDateToIso(current));
  }
  return dates;
}

function ticketRestaurantVisibleMonthRange(visibleMonth) {
  const normalized = normalizeTicketMonth(visibleMonth || getTicketRestaurantComputeSelection());
  const first = `${normalized.year}-${String(normalized.month).padStart(2, "0")}-01`;
  const lastDay = new Date(normalized.year, normalized.month, 0).getDate();
  const last = `${normalized.year}-${String(normalized.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { ...normalized, first, last };
}

function ticketRestaurantDateIsInVisibleMonth(date, visibleMonth) {
  const iso = parseTicketDate(date);
  if (!iso) return false;
  const range = ticketRestaurantVisibleMonthRange(visibleMonth);
  return iso >= range.first && iso <= range.last;
}

function ticketRestaurantAbsenceIntersectsVisibleMonth(absence, visibleMonth) {
  const dates = expandDateRange(absence && absence.from, absence && (absence.to || absence.from));
  return dates.some(date => ticketRestaurantDateIsInVisibleMonth(date, visibleMonth));
}

function expandAbsenceIntoDays(absence) {
  return expandDateRange(absence && absence.from, absence && (absence.to || absence.from));
}

function buildEmployeeAbsenceDayKey(employeeNumber, date) {
  const employeeKey = normalizeTicketEmployeeLookup(employeeNumber);
  const isoDate = parseTicketDate(date);
  if (!employeeKey || !isoDate) return "";
  return `${employeeKey}__${isoDate}`;
}

function getTicketAbsenceRecency(absence) {
  const updatedAt = Date.parse(absence && absence.updatedAt);
  if (Number.isFinite(updatedAt)) return { priority: 4, value: updatedAt };
  const createdAt = Date.parse(absence && absence.createdAt);
  if (Number.isFinite(createdAt)) return { priority: 3, value: createdAt };
  const importDate = Date.parse(absence && absence.importDate);
  if (Number.isFinite(importDate)) return { priority: 2, value: importDate };
  const id = Number(absence && absence.id);
  if (Number.isFinite(id)) return { priority: 1, value: id };
  return { priority: 0, value: 0 };
}

function chooseLatestAbsence(existing, candidate) {
  if (!existing) return candidate;
  if (!candidate) return existing;
  const left = getTicketAbsenceRecency(existing);
  const right = getTicketAbsenceRecency(candidate);
  if (right.priority !== left.priority) return right.priority > left.priority ? candidate : existing;
  if (right.value !== left.value) return right.value > left.value ? candidate : existing;
  return candidate;
}

function resolveEffectiveTicketAbsenceDays(absences) {
  const effectiveByDay = new Map();
  (Array.isArray(absences) ? absences : []).forEach(absence => {
    const employeeNumber = absence && absence.employeeNumber;
    expandAbsenceIntoDays(absence).forEach(date => {
      const key = buildEmployeeAbsenceDayKey(employeeNumber, date);
      if (!key) return;
      const current = effectiveByDay.get(key);
      const winner = chooseLatestAbsence(current && current.absence, absence);
      if (winner === (current && current.absence)) return;
      effectiveByDay.set(key, { key, employeeNumber, date, absence: winner });
    });
  });
  return [...effectiveByDay.values()];
}

function getEffectiveEmployeeAbsencesForMonth(employeeNumber, month, absences = null) {
  const key = normalizeTicketEmployeeLookup(employeeNumber);
  if (!key) return [];
  return resolveEffectiveTicketAbsenceDays(absences || getTicketRestaurantAbsences())
    .filter(item => normalizeTicketEmployeeLookup(item && item.employeeNumber) === key)
    .filter(item => !month || ticketRestaurantDateIsInVisibleMonth(item.date, month));
}

function ticketRestaurantGetCalendarMarkSet(calendar) {
  const normalizedCalendar = normalizeTicketCalendar(calendar);
  return new Set(getTicketRestaurantCalendarMarks()
    .filter(item => normalizeTicketCalendar(item && item.calendar) === normalizedCalendar && item && item.noTicket)
    .map(item => parseTicketDate(item.date))
    .filter(Boolean));
}

function findTicketRestaurantPersonByEmployee(employeeNumber) {
  const key = normalizeTicketEmployeeLookup(employeeNumber);
  if (!key) return null;
  return getTicketRestaurantPeople().find(item => normalizeTicketEmployeeLookup(item && item.employeeNumber) === key) || null;
}

function employeeHasTicketRightOnDate(employeeNumber, date, calendar = null) {
  const normalizedCalendar = normalizeTicketCalendar(calendar || (findTicketRestaurantPersonByEmployee(employeeNumber) || {}).calendar);
  if (!isKnownTicketCalendar(normalizedCalendar)) return false;
  const iso = parseTicketDate(date);
  if (!iso) return false;
  const localDate = ticketRestaurantDateToLocalDate(iso);
  if (!localDate) return false;
  const weekday = localDate.getDay();
  if (weekday === 0 || weekday === 6) return false;
  return !ticketRestaurantGetCalendarMarkSet(normalizedCalendar).has(iso);
}

function getEffectiveAbsenceDaysForEmployee(employeeNumber, absence, calendar, visibleMonth = null) {
  const normalizedCalendar = normalizeTicketCalendar(calendar);
  const hasCalendar = isKnownTicketCalendar(normalizedCalendar);
  const allDates = expandDateRange(absence && absence.from, absence && (absence.to || absence.from));
  const visibleDates = visibleMonth ? allDates.filter(date => ticketRestaurantDateIsInVisibleMonth(date, visibleMonth)) : allDates;
  const affectingDates = hasCalendar
    ? visibleDates.filter(date => employeeHasTicketRightOnDate(employeeNumber, date, normalizedCalendar))
    : [];
  return {
    absence,
    allDates,
    visibleDates,
    affectingDates,
    naturalDays: visibleDates.length,
    ticketDays: affectingDates.length,
    hasCalendar,
    calendar: hasCalendar ? normalizedCalendar : (calendar || "")
  };
}

function filterAbsencesAffectingTicket(employeeNumber, absences, visibleMonth, calendar = null, includeWithoutImpact = true) {
  const effectiveDailyAbsences = getEffectiveEmployeeAbsencesForMonth(employeeNumber, visibleMonth, absences);
  return effectiveDailyAbsences
    .map(item => getEffectiveAbsenceDaysForEmployee(employeeNumber, { ...item.absence, from: item.date, to: item.date }, calendar, visibleMonth))
    .filter(item => includeWithoutImpact || item.ticketDays > 0);
}

function calculateTicketAffectingAbsenceDays(employeeNumber, absences, visibleMonth, calendar = null) {
  return filterAbsencesAffectingTicket(employeeNumber, absences, visibleMonth, calendar, false)
    .reduce((sum, item) => sum + item.ticketDays, 0);
}

function formatTicketRestaurantAbsenceImpactDetail(detail) {
  const reason = (detail.absence && detail.absence.reason) || "Ausencia";
  const from = formatTicketDate(detail.absence && detail.absence.from);
  const to = formatTicketDate(detail.absence && (detail.absence.to || detail.absence.from));
  const impact = detail.hasCalendar ? `${detail.ticketDays} días que afectan a ticket` : "Empleado sin calendario asignado";
  const noImpact = detail.hasCalendar && detail.ticketDays === 0 ? " · Sin impacto en ticket por calendario" : "";
  return `${reason} ${from}-${to} (${detail.naturalDays} días ausencia; ${impact}${noImpact})`;
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

function calculateTicketRestaurantCompute(period = null) {
  const { month, year } = period ? normalizeTicketMonth(period) : getTicketRestaurantComputeSelection();
  const visibleMonth = { month, year };
  const calendarTheoretical = new Map(TICKET_RESTAURANT_CALENDARS.map(calendar => [calendar, ticketRestaurantWorkingDays(month, year, calendar)]));
  const calendarNoTicketWeekdays = new Map(TICKET_RESTAURANT_CALENDARS.map(calendar => [calendar, ticketRestaurantNoTicketWeekdays(month, year, calendar)]));
  const absences = getTicketRestaurantAbsences();
  const warnings = [];
  const pendingLedger = ensureTicketRestaurantPendingDiscountLedgerFromAbsences();
  const targetMonth = { month, year };
  const targetMonthKey = ticketMonthKey(targetMonth);
  const targetMonthStart = `${targetMonthKey}-01`;
  const debugEnabled = Boolean(window && window.localStorage && window.localStorage.getItem("rrll_ticket_restaurant_debug_compute") === "1");
  const debugRows = [];
  if (debugEnabled) {
    const totalLedgerEntries = Object.keys(pendingLedger || {}).length;
    console.group(`[TicketRestaurant][Compute] ${targetMonthKey}`);
    console.log("Mes calculado:", targetMonthKey);
    console.log("Total ausencias guardadas:", absences.length);
    console.log("Total entradas ledger:", totalLedgerEntries);
  }
  const rows = getTicketRestaurantPeople().map(person => {
    const normalizedCalendar = normalizeTicketCalendar(person.calendar);
    const hasCalendar = isKnownTicketCalendar(normalizedCalendar);
    const employeeLabel = person.employeeNumber || "sin nº";
    if (!hasCalendar) warnings.push(`Empleado sin calendario asignado: ${employeeLabel}.`);
    const theoretical = hasCalendar ? (calendarTheoretical.get(normalizedCalendar) || 0) : 0;
    const currentMonthAbsenceDetails = filterAbsencesAffectingTicket(person.employeeNumber, absences, visibleMonth, normalizedCalendar, true);
    const currentMonthAbsenceDays = hasCalendar ? calculateTicketAffectingAbsenceDays(person.employeeNumber, absences, visibleMonth, normalizedCalendar) : 0;
    if (!hasCalendar && currentMonthAbsenceDetails.length) warnings.push(`Empleado sin calendario asignado: ${employeeLabel}. No se descuentan sus ausencias porque no se puede verificar el derecho a ticket.`);
    const monthlyTickets = Math.max(0, theoretical);
    const identity = buildTicketRestaurantPendingDiscountIdentity(person);
    const previousAbsenceCount = absences.reduce((sum, absence) => {
      const owner = normalizeTicketEmployeeLookup(absence && absence.employeeNumber);
      const personEmployee = normalizeTicketEmployeeLookup(person && person.employeeNumber);
      const sameEmployee = owner && personEmployee ? owner === personEmployee : normalizeTicketText(absence && absence.employeeName) === normalizeTicketText(ticketRestaurantFullName(person));
      if (!sameEmployee) return sum;
      return sum + buildTicketRestaurantAbsenceDailyKeys(absence).filter(key => {
        const [, dayIso = ""] = key.split("|");
        return dayIso && dayIso < targetMonthStart && ticketRestaurantAbsenceGeneratesDiscount(absence, person, dayIso);
      }).length;
    }, 0);
    const ledgerEntry = identity ? pendingLedger[identity] : null;
    const pendingItems = ledgerEntry && ledgerEntry.pendingItems && typeof ledgerEntry.pendingItems === "object"
      ? Object.fromEntries(Object.entries(ledgerEntry.pendingItems).map(([key, item]) => [key, {
        ...(item || {}),
        consumedByMonth: item && item.consumedByMonth && typeof item.consumedByMonth === "object" ? { ...item.consumedByMonth } : {}
      }]))
      : {};
    Object.entries((ledgerEntry && ledgerEntry.importedDailyKeys) || {}).forEach(([key]) => {
      if (pendingItems[key]) return;
      const [, dayIso = "", reason = ""] = key.split("|");
      if (!dayIso) return;
      if (!ticketRestaurantDateGeneratesDiscountForPerson(person, dayIso)) return;
      pendingItems[key] = { key, date: dayIso, reason, remainingDebt: 1, consumedByMonth: {} };
    });
    Object.keys(pendingItems).forEach(key => {
      const item = pendingItems[key];
      if (!ticketRestaurantDateGeneratesDiscountForPerson(person, item && item.date)) {
        delete pendingItems[key];
      }
    });
    const alreadyApplied = Object.values(pendingItems).reduce((sum, item) => (
      sum + parseTicketNumber(item && item.consumedByMonth && item.consumedByMonth[targetMonthKey])
    ), 0);
    const canApplyAbsences = monthlyTickets > 0;
    let appliedAbsenceDays = canApplyAbsences ? alreadyApplied : 0;
    let remainingCapacity = canApplyAbsences ? Math.max(0, monthlyTickets - alreadyApplied) : 0;
    if (remainingCapacity > 0) {
      Object.values(pendingItems)
        .filter(item => item && parseTicketDate(item.date) && parseTicketDate(item.date) < targetMonthStart && parseTicketNumber(item.remainingDebt) > 0)
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .forEach(item => {
          if (remainingCapacity <= 0) return;
          const remaining = parseTicketNumber(item.remainingDebt);
          if (remaining <= 0) return;
          const consume = Math.min(remaining, remainingCapacity);
          if (consume <= 0) return;
          item.remainingDebt = remaining - consume;
          item.consumedByMonth = item.consumedByMonth && typeof item.consumedByMonth === "object" ? item.consumedByMonth : {};
          item.consumedByMonth[targetMonthKey] = parseTicketNumber(item.consumedByMonth[targetMonthKey]) + consume;
          appliedAbsenceDays += consume;
          remainingCapacity -= consume;
        });
    }
    const appliedAbsenceItems = Object.values(pendingItems)
      .filter(item => item && parseTicketDate(item.date) && parseTicketDate(item.date) < targetMonthStart && parseTicketNumber(item && item.consumedByMonth && item.consumedByMonth[targetMonthKey]) > 0)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const appliedAbsenceDetails = appliedAbsenceItems.map(item => {
      const consumed = parseTicketNumber(item && item.consumedByMonth && item.consumedByMonth[targetMonthKey]);
      return {
        absence: { from: item.date, to: item.date, reason: item.reason || "ausencia" },
        naturalDays: consumed,
        ticketDays: consumed,
        hasCalendar
      };
    });
    const pendingDebt = Object.values(pendingItems).reduce((sum, item) => sum + parseTicketNumber(item && item.remainingDebt), 0);
    const finalTickets = Math.max(0, monthlyTickets - appliedAbsenceDays);
    const remainingDebt = pendingDebt;
    if (ledgerEntry && typeof ledgerEntry === "object") {
      ledgerEntry.pendingItems = pendingItems;
      ledgerEntry.pendingDebt = pendingDebt;
    }
    if (debugEnabled) debugRows.push({ employeeNumber: person.employeeNumber || "", identity, previousAbsenceCount, pendingItemsFound: Object.keys(pendingItems).length, pendingItemsApplicable: Object.values(pendingItems).filter(item => item && parseTicketDate(item.date) && parseTicketDate(item.date) < targetMonthStart && parseTicketNumber(item.remainingDebt) > 0).length, monthlyTickets, appliedAbsenceDays });
    return {
      person: { ...person, calendar: hasCalendar ? normalizedCalendar : (person.calendar || "Sin calendario") },
      theoretical,
      absenceDays: appliedAbsenceDays,
      appliedAbsenceDays,
      currentMonthAbsenceDays,
      pendingDebt,
      remainingDebt,
      absenceImpactDetails: appliedAbsenceDetails,
      absenceDetails: appliedAbsenceDetails.map(formatTicketRestaurantAbsenceImpactDetail).join("; "),
      currentMonthAbsenceImpactDetails: currentMonthAbsenceDetails,
      finalTickets,
      calendarWarning: !hasCalendar
    };
  });
  saveTicketRestaurantPendingDiscountLedger(pendingLedger);
  if (debugEnabled) {
    debugRows.forEach(item => console.log("Persona:", item));
    console.groupEnd();
  }
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

function ensureTicketRestaurantAbsenceImpactModal() {
  let modal = document.getElementById("ticketRestaurantAbsenceImpactModal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "ticketRestaurantAbsenceImpactModal";
  modal.className = "modal-backdrop";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="ticketRestaurantAbsenceImpactTitle" onclick="event.stopPropagation()" style="width:min(900px,96vw);max-height:90vh;display:flex;flex-direction:column;">
      <h3 id="ticketRestaurantAbsenceImpactTitle">Detalle de ausencias</h3>
      <p id="ticketRestaurantAbsenceImpactSubtitle" class="muted"></p>
      <div style="overflow:auto;">
        <table class="data-table">
          <thead><tr><th>Desde</th><th>Hasta</th><th>Motivo</th><th>Días ausencia</th><th>Días que afectan a ticket</th><th>Observación</th></tr></thead>
          <tbody id="ticketRestaurantAbsenceImpactBody"></tbody>
        </table>
      </div>
      <div class="modal-actions" style="position:sticky;bottom:0;background:inherit;padding-top:12px;">
        <button type="button" class="secondary" onclick="closeTicketRestaurantAbsenceImpactModal()">Cerrar</button>
      </div>
    </div>`;
  modal.addEventListener("click", event => { if (event.target === modal) closeTicketRestaurantAbsenceImpactModal(); });
  document.body.appendChild(modal);
  return modal;
}

function closeTicketRestaurantAbsenceImpactModal() {
  const modal = document.getElementById("ticketRestaurantAbsenceImpactModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function openTicketRestaurantAbsenceImpactDetail(employeeNumber, source = "compute") {
  const visibleMonth = source === "monthly" ? getTicketContributionVisibleMonth() : getTicketComputeVisibleMonth();
  const calc = source === "monthly"
    ? calculateTicketRestaurantMonthlyQuote(visibleMonth)
    : calculateTicketRestaurantCompute(visibleMonth);
  const key = normalizeTicketEmployeeLookup(employeeNumber);
  const row = source === "monthly"
    ? (calc.rows || []).find(item => normalizeTicketEmployeeLookup(item && item.employeeNumber) === key)
    : (calc.rows || []).find(item => normalizeTicketEmployeeLookup(item && item.person && item.person.employeeNumber) === key);
  const modal = ensureTicketRestaurantAbsenceImpactModal();
  const subtitle = modal.querySelector("#ticketRestaurantAbsenceImpactSubtitle");
  const body = modal.querySelector("#ticketRestaurantAbsenceImpactBody");
  const details = (row && row.absenceImpactDetails) || [];
  if (subtitle) {
    const fullName = row
      ? (source === "monthly" ? row.fullName : ticketRestaurantFullName(row.person))
      : employeeNumber;
    subtitle.textContent = `${fullName || employeeNumber} · ${formatTicketMonthLabel(visibleMonth)} · Ausencias aplicadas: ${row ? row.absenceDays : 0}`;
  }
  if (body) {
    body.innerHTML = details.length ? details.map(detail => {
      const observation = !detail.hasCalendar
        ? "Empleado sin calendario asignado"
        : detail.ticketDays === 0 ? "Sin impacto en ticket por calendario" : "Afecta al ticket";
      return `<tr>
        <td>${formatTicketDate(detail.absence && detail.absence.from)}</td>
        <td>${formatTicketDate(detail.absence && (detail.absence.to || detail.absence.from))}</td>
        <td>${escapeHtml((detail.absence && detail.absence.reason) || "")}</td>
        <td>${detail.naturalDays}</td>
        <td>${detail.ticketDays}</td>
        <td>${escapeHtml(observation)}</td>
      </tr>`;
    }).join("") : `<tr><td colspan="6" class="muted">No hay ausencias importadas para esta persona en el mes seleccionado.</td></tr>`;
  }
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function renderTicketRestaurantComputePreview() {
  const periodEl = document.getElementById("ticketRestaurantComputePeriod");
  const summaryEl = document.getElementById("ticketRestaurantComputeSummary");
  const noticeEl = document.getElementById("ticketRestaurantComputeNotice");
  const body = document.getElementById("ticketRestaurantComputeBody");
  if (!summaryEl || !body) return;
  renderTicketComputeMonthSelector();
  const calc = calculateTicketRestaurantCompute();
  ticketRestaurantLastVisibleCompute = calc;
  if (periodEl) periodEl.textContent = `Cómputo automático para ${TICKET_RESTAURANT_MONTHS[calc.month - 1]} de ${calc.year}`;
  summaryEl.innerHTML = calc.summary.map(item => `<div class="ticket-summary-pill"><span>${escapeHtml(item.calendar)}</span><strong>${item.theoretical}</strong><small>tickets teóricos · ${item.noTicketWeekdays} días sin ticket · ${item.people} personas · ${item.absenceDays} ausencias · ${item.final} tickets finales</small></div>`).join("");
  if (noticeEl) {
    const uniqueWarnings = [...new Set(calc.warnings || [])];
    noticeEl.innerHTML = uniqueWarnings.map(item => `<div>${escapeHtml(item)} Tickets = 0 para esa persona.</div>`).join("");
    noticeEl.hidden = uniqueWarnings.length === 0;
  }
  const nameSortButton = document.querySelector('[data-ticket-compute-sort="name"]');
  if (nameSortButton && nameSortButton.firstChild) nameSortButton.firstChild.nodeValue = "Nombre y apellidos";
  applyTicketEmployeeNameColumnLayout("#ticketRestaurantComputeBody");
  const visibleRows = getVisibleTicketRestaurantComputeRows(calc);
  updateTicketRestaurantComputeSortHeaders();
  body.innerHTML = visibleRows.length ? visibleRows.map(row => `<tr class="${row.calendarWarning ? "ticket-row-warning" : ""}" ondblclick="event.preventDefault(); event.stopPropagation(); openTicketRestaurantAbsenceImpactDetail('${ticketRestaurantEscapeJs(row.person.employeeNumber)}', 'compute')" title="Doble clic para ver detalle de ausencias">
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
  openTicketRestaurantPrintPreview(`Cómputo Ticket Restaurante - ${TICKET_RESTAURANT_MONTHS[calc.month - 1]} ${calc.year}`, ["Nº empleado", "Nombre y apellidos", "Calendario", "Tickets teóricos", "Ausencias aplicadas", "Tickets finales"], rows);
}

function getTicketContributionVisibleMonth() {
  if (!ticketRestaurantVisibleContributionMonth) ticketRestaurantVisibleContributionMonth = getPreviousSystemMonth();
  return ticketRestaurantVisibleContributionMonth;
}

function changeTicketContributionMonth(delta) {
  ticketRestaurantVisibleContributionMonth = addTicketMonths(getTicketContributionVisibleMonth(), delta);
  renderTicketRestaurantMonthlyQuotePreview();
}

function renderTicketContributionMonthSelector() {
  const periodEl = document.getElementById("ticketRestaurantMonthlyQuotePeriod");
  if (!periodEl) return;
  let selector = document.getElementById("ticketRestaurantContributionMonthSelector");
  if (!selector) {
    periodEl.insertAdjacentHTML("afterend", `<div id="ticketRestaurantContributionMonthSelector"></div>`);
    selector = document.getElementById("ticketRestaurantContributionMonthSelector");
  }
  if (selector) selector.innerHTML = renderTicketMonthNavigator({ visibleMonth: getTicketContributionVisibleMonth(), onPrev: "changeTicketContributionMonth(-1)", onNext: "changeTicketContributionMonth(1)" });
}

function calculateTicketRestaurantMonthlyQuote(period = null) {
  const { month, year } = period ? normalizeTicketMonth(period) : normalizeTicketMonth(getTicketContributionVisibleMonth());
  const visibleMonth = { month, year };
  const absences = getTicketRestaurantAbsences();
  const cfg = getTicketRestaurantConfig();
  const calendarTheoretical = new Map(TICKET_RESTAURANT_CALENDARS.map(calendar => [calendar, ticketRestaurantWorkingDays(month, year, calendar)]));
  const rows = getTicketRestaurantPeople().map(person => {
    const normalizedCalendar = normalizeTicketCalendar(person.calendar);
    const hasCalendar = isKnownTicketCalendar(normalizedCalendar);
    const theoretical = hasCalendar ? (calendarTheoretical.get(normalizedCalendar) || 0) : 0;
    const monthlyAbsenceDetails = filterAbsencesAffectingTicket(person.employeeNumber, absences, visibleMonth, normalizedCalendar, true);
    const monthlyAbsenceDays = hasCalendar ? calculateTicketAffectingAbsenceDays(person.employeeNumber, absences, visibleMonth, normalizedCalendar) : 0;
    return {
      employeeNumber: person.employeeNumber || "",
      fullName: ticketRestaurantFullName(person),
      ticketDays: Math.max(0, theoretical - monthlyAbsenceDays),
      ticketAmount: cfg.importe,
      absenceDays: monthlyAbsenceDays,
      absenceImpactDetails: monthlyAbsenceDetails,
      calendarWarning: !hasCalendar
    };
  });
  return { month, year, rows };
}

function renderTicketRestaurantMonthlyQuotePreview() {
  const panel = document.getElementById("ticketRestaurantMonthlyQuotePanel");
  const periodEl = document.getElementById("ticketRestaurantMonthlyQuotePeriod");
  const body = document.getElementById("ticketRestaurantMonthlyQuoteBody");
  if (!panel || !body) return;
  renderTicketContributionMonthSelector();
  const calc = calculateTicketRestaurantMonthlyQuote();
  ticketRestaurantLastVisibleMonthlyQuote = calc;
  panel.hidden = false;
  if (periodEl) periodEl.textContent = `Cómputo Cotización Mensual para ${TICKET_RESTAURANT_MONTHS[calc.month - 1]} de ${calc.year}`;
  applyTicketEmployeeNameColumnLayout("#ticketRestaurantMonthlyQuoteBody");
  const visibleRows = getVisibleTicketRestaurantMonthlyQuoteRows(calc);
  body.innerHTML = visibleRows.length ? visibleRows.map(row => `<tr class="${row.calendarWarning ? "ticket-row-warning" : ""}" ondblclick="event.preventDefault(); event.stopPropagation(); openTicketRestaurantAbsenceImpactDetail('${ticketRestaurantEscapeJs(row.employeeNumber)}', 'monthly')" title="Doble clic para ver detalle de ausencias"><td>${escapeHtml(row.employeeNumber)}</td><td>${escapeHtml(row.fullName)}</td><td>${escapeHtml(row.ticketDays)}</td><td>${escapeHtml(row.ticketAmount)}</td></tr>`).join("") : `<tr><td colspan="4" class="muted">Sin resultados que coincidan con los filtros.</td></tr>`;
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
window.closeTicketRestaurantAbsencePreviewModal = closeTicketRestaurantAbsencePreviewModal;
window.addTicketRestaurantAbsencePreviewRow = addTicketRestaurantAbsencePreviewRow;
window.removeTicketRestaurantAbsencePreviewRow = removeTicketRestaurantAbsencePreviewRow;
window.saveTicketRestaurantAbsencePreviewRows = saveTicketRestaurantAbsencePreviewRows;
window.downloadTicketRestaurantAbsenceTemplate = downloadTicketRestaurantAbsenceTemplate;
window.deleteTicketRestaurantAbsence = deleteTicketRestaurantAbsence;
window.openTicketRestaurantAbsenceImpactDetail = openTicketRestaurantAbsenceImpactDetail;
window.closeTicketRestaurantAbsenceImpactModal = closeTicketRestaurantAbsenceImpactModal;
window.changeTicketAbsenceMonth = changeTicketAbsenceMonth;
window.changeTicketPreviewMonth = changeTicketPreviewMonth;
window.setTicketRestaurantAbsenceSort = setTicketRestaurantAbsenceSort;
window.renderTicketRestaurantPeople = renderTicketRestaurantPeople;
window.exportTicketRestaurantPeopleVisible = exportTicketRestaurantPeopleVisible;
window.printTicketRestaurantPeopleVisible = printTicketRestaurantPeopleVisible;
window.renderTicketRestaurantComputePreview = renderTicketRestaurantComputePreview;
window.changeTicketComputeMonth = changeTicketComputeMonth;
window.setTicketRestaurantComputeSort = setTicketRestaurantComputeSort;
window.exportTicketRestaurantCompute = exportTicketRestaurantCompute;
window.printTicketRestaurantComputeVisible = printTicketRestaurantComputeVisible;
window.renderTicketRestaurantMonthlyQuotePreview = renderTicketRestaurantMonthlyQuotePreview;
window.changeTicketContributionMonth = changeTicketContributionMonth;
window.exportTicketRestaurantMonthlyQuote = exportTicketRestaurantMonthlyQuote;
window.printTicketRestaurantMonthlyQuote = printTicketRestaurantMonthlyQuote;
window.saveTicketRestaurantConfigFromInputs = saveTicketRestaurantConfigFromInputs;
window.renderTicketRestaurant = renderTicketRestaurant;
window.getTicketRestaurantConfig = getTicketRestaurantConfig;
window.calculateTicketRestaurantCompute = calculateTicketRestaurantCompute;
