const TicketCalendarDomain = (() => {
  const DEFAULT_TICKET_ISO_WEEKDAYS = Object.freeze([1, 2, 3, 4, 5]);

  function freezeCalendar({ name, aliases = [], ticketIsoWeekdays = DEFAULT_TICKET_ISO_WEEKDAYS }) {
    return Object.freeze({
      name,
      aliases: Object.freeze([...aliases]),
      ticketIsoWeekdays: Object.freeze([...ticketIsoWeekdays])
    });
  }

  const FALLBACK_TICKET_CALENDARS = Object.freeze([
    freezeCalendar({
      name: "Servicios Centrales",
      aliases: ["sscc", "servicioscentrales", "serviciocentrales"]
    }),
    freezeCalendar({
      name: "Ingeniería Ariz",
      aliases: ["ariz", "ingenieriaariz"]
    }),
    freezeCalendar({
      name: "Instalaciones Sopela",
      aliases: ["sopela", "instalacionessopela", "instalacionsopela"]
    }),
    freezeCalendar({
      name: "Liberados",
      aliases: ["liberados"]
    })
  ]);

  function normalizeCompactText(value) {
    return String(value == null ? "" : value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/º/g, "o")
      .replace(/ª/g, "a")
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();
  }

  function normalizeTicketIsoWeekdays(value) {
    const source = Array.isArray(value) ? value : DEFAULT_TICKET_ISO_WEEKDAYS;
    return [...new Set(source.map(Number).filter(day => Number.isInteger(day) && day >= 1 && day <= 7))]
      .sort((left, right) => left - right);
  }

  function normalizeExternalCalendar(calendar) {
    if (typeof calendar === "string") return freezeCalendar({ name: calendar.trim() });
    const source = calendar && typeof calendar === "object" ? calendar : {};
    return freezeCalendar({
      name: String(source.name == null ? "" : source.name).replace(/\s+/g, " ").trim(),
      aliases: Array.isArray(source.aliases) ? source.aliases.map(alias => String(alias)) : [],
      ticketIsoWeekdays: normalizeTicketIsoWeekdays(source.ticketIsoWeekdays)
    });
  }

  function getTicketCalendars(calendars) {
    if (calendars == null) return FALLBACK_TICKET_CALENDARS;
    if (!Array.isArray(calendars)) return Object.freeze([]);
    return Object.freeze(calendars.map(normalizeExternalCalendar).filter(calendar => calendar.name));
  }

  function normalizeTicketCalendar(value, calendars) {
    const text = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    const key = normalizeCompactText(text);
    if (!key) return text;
    const calendar = getTicketCalendars(calendars).find(item => (
      normalizeCompactText(item.name) === key
      || item.aliases.some(alias => normalizeCompactText(alias) === key)
    ));
    return calendar ? calendar.name : text;
  }

  function isKnownTicketCalendar(value, calendars) {
    const normalized = normalizeTicketCalendar(value, calendars);
    return getTicketCalendars(calendars).some(calendar => calendar.name === normalized);
  }

  function parseIsoDate(value) {
    const text = String(value == null ? "" : value).trim();
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return "";
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
    return text;
  }

  function getIsoWeekday(date) {
    const iso = parseIsoDate(date);
    if (!iso) return 0;
    return new Date(`${iso}T00:00:00Z`).getUTCDay() || 7;
  }

  function resolveCalendar(calendarName, calendars) {
    const normalized = normalizeTicketCalendar(calendarName, calendars);
    return getTicketCalendars(calendars).find(calendar => calendar.name === normalized) || null;
  }

  function getNoTicketMarkSet(calendarName, calendarMarks, calendars) {
    const normalized = normalizeTicketCalendar(calendarName, calendars);
    return new Set((Array.isArray(calendarMarks) ? calendarMarks : [])
      .filter(mark => mark && mark.noTicket)
      .filter(mark => normalizeTicketCalendar(mark.calendarName == null ? mark.calendar : mark.calendarName, calendars) === normalized)
      .map(mark => parseIsoDate(mark.date))
      .filter(Boolean));
  }

  function calendarHasTicketRightOnDate({ calendarName, date, calendarMarks = [], calendars } = {}) {
    const calendar = resolveCalendar(calendarName, calendars);
    const iso = parseIsoDate(date);
    if (!calendar || !iso || !calendar.ticketIsoWeekdays.includes(getIsoWeekday(iso))) return false;
    return !getNoTicketMarkSet(calendar.name, calendarMarks, calendars).has(iso);
  }

  function normalizePeriodNumber(value) {
    const number = Number(value);
    return Number.isInteger(number) ? number : 0;
  }

  function countTicketDaysForCalendar({ calendarName, year, month, calendarMarks = [], calendars } = {}) {
    const normalizedYear = normalizePeriodNumber(year);
    const normalizedMonth = normalizePeriodNumber(month);
    if (!resolveCalendar(calendarName, calendars) || normalizedMonth < 1 || normalizedMonth > 12) return 0;
    const totalDays = new Date(Date.UTC(normalizedYear, normalizedMonth, 0)).getUTCDate();
    let count = 0;
    for (let day = 1; day <= totalDays; day += 1) {
      const date = `${String(normalizedYear).padStart(4, "0")}-${String(normalizedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (calendarHasTicketRightOnDate({ calendarName, date, calendarMarks, calendars })) count += 1;
    }
    return count;
  }

  function countNoTicketWeekdaysForCalendar({ calendarName, year, month, calendarMarks = [], calendars } = {}) {
    const calendar = resolveCalendar(calendarName, calendars);
    const normalizedYear = normalizePeriodNumber(year);
    const normalizedMonth = normalizePeriodNumber(month);
    if (!calendar || normalizedMonth < 1 || normalizedMonth > 12) return 0;
    let count = 0;
    getNoTicketMarkSet(calendar.name, calendarMarks, calendars).forEach(date => {
      if (Number(date.slice(0, 4)) !== normalizedYear || Number(date.slice(5, 7)) !== normalizedMonth) return;
      if (calendar.ticketIsoWeekdays.includes(getIsoWeekday(date))) count += 1;
    });
    return count;
  }

  return Object.freeze({
    normalizeTicketCalendar,
    isKnownTicketCalendar,
    getTicketCalendars,
    calendarHasTicketRightOnDate,
    countTicketDaysForCalendar,
    countNoTicketWeekdaysForCalendar
  });
})();

if (typeof window !== "undefined") window.TicketCalendarDomain = TicketCalendarDomain;
if (typeof module !== "undefined" && module.exports) module.exports = TicketCalendarDomain;
