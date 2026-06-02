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
    freezeCalendar({ name: "Servicios Centrales", aliases: ["sscc", "servicioscentrales", "serviciocentrales"] }),
    freezeCalendar({ name: "Ingeniería Ariz", aliases: ["ariz", "ingenieriaariz"] }),
    freezeCalendar({ name: "Instalaciones Sopela", aliases: ["sopela", "instalacionessopela", "instalacionsopela"] }),
    freezeCalendar({ name: "Liberados", aliases: ["liberados"] })
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

  function getCalendarReferenceId(value) {
    const source = value && typeof value === "object" ? value : {};
    return String(source.calendarId == null ? source.calendar_id == null ? "" : source.calendar_id : source.calendarId);
  }

  function normalizeDomainOptions(value) {
    if (Array.isArray(value)) return { calendars: value };
    return value && typeof value === "object" ? value : {};
  }

  function getRelatedValues(values, calendar, mapper) {
    const calendarId = String(calendar.id == null ? "" : calendar.id);
    const calendarName = normalizeCompactText(calendar.name);
    return (Array.isArray(values) ? values : [])
      .filter(value => {
        const referenceId = getCalendarReferenceId(value);
        if (referenceId && calendarId) return referenceId === calendarId;
        const source = value && typeof value === "object" ? value : {};
        return normalizeCompactText(source.calendarName == null ? source.calendar : source.calendarName) === calendarName;
      })
      .map(mapper);
  }

  function normalizeExternalCalendar(calendar, options = {}) {
    if (typeof calendar === "string") return freezeCalendar({ name: calendar.trim() });
    const source = calendar && typeof calendar === "object" ? calendar : {};
    const aliases = [
      ...(Array.isArray(source.aliases) ? source.aliases : []),
      ...getRelatedValues(options.aliases, source, alias => alias && typeof alias === "object" ? alias.alias : alias)
    ].filter(alias => alias != null);
    const configuredWeekdays = getRelatedValues(options.weekdays, source, weekday => (
      weekday && typeof weekday === "object" ? weekday.isoWeekday == null ? weekday.iso_weekday : weekday.isoWeekday : weekday
    ));
    return freezeCalendar({
      name: String(source.name == null ? "" : source.name).replace(/\s+/g, " ").trim(),
      aliases: [...new Set(aliases.map(alias => String(alias)))],
      ticketIsoWeekdays: normalizeTicketIsoWeekdays(configuredWeekdays.length ? configuredWeekdays : source.ticketIsoWeekdays)
    });
  }

  function getTicketCalendars(value) {
    const options = normalizeDomainOptions(value);
    if (!Array.isArray(options.calendars) || !options.calendars.length) return FALLBACK_TICKET_CALENDARS;
    const calendars = options.calendars
      .filter(calendar => options.includeInactive || !(calendar && typeof calendar === "object") || calendar.active == null || Number(calendar.active) === 1)
      .map(calendar => normalizeExternalCalendar(calendar, options))
      .filter(calendar => calendar.name);
    return calendars.length ? Object.freeze(calendars) : FALLBACK_TICKET_CALENDARS;
  }

  function normalizeTicketCalendar(value, options) {
    const text = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    const key = normalizeCompactText(text);
    if (!key) return text;
    const snapshot = options && options.snapshot;
    if (snapshot && snapshot.aliasesByNormalizedName) return snapshot.aliasesByNormalizedName.get(key) || text;
    const calendar = getTicketCalendars(options).find(item => (
      normalizeCompactText(item.name) === key || item.aliases.some(alias => normalizeCompactText(alias) === key)
    ));
    return calendar ? calendar.name : text;
  }

  function isKnownTicketCalendar(value, options) {
    const normalized = normalizeTicketCalendar(value, options);
    const snapshot = options && options.snapshot;
    return (snapshot && snapshot.calendars ? snapshot.calendars : getTicketCalendars(options)).some(calendar => calendar.name === normalized);
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

  function createTicketCalendarSnapshot(value) {
    const options = normalizeDomainOptions(value);
    const calendars = getTicketCalendars(options);
    const aliasesByNormalizedName = new Map();
    const weekdaysByCalendarName = new Map();
    const exclusionsByCalendarName = new Map();
    calendars.forEach(calendar => {
      aliasesByNormalizedName.set(normalizeCompactText(calendar.name), calendar.name);
      calendar.aliases.forEach(alias => aliasesByNormalizedName.set(normalizeCompactText(alias), calendar.name));
      weekdaysByCalendarName.set(calendar.name, new Set(calendar.ticketIsoWeekdays));
      const sourceCalendar = (Array.isArray(options.calendars) ? options.calendars : []).find(item => normalizeCompactText(item && item.name) === normalizeCompactText(calendar.name)) || calendar;
      exclusionsByCalendarName.set(calendar.name, new Set(getRelatedValues(options.exclusions, sourceCalendar, normalizeCalendarMark)
        .filter(mark => mark.noTicket)
        .map(mark => parseIsoDate(mark.date))
        .filter(Boolean)));
    });
    return Object.freeze({ calendars, aliasesByNormalizedName, weekdaysByCalendarName, exclusionsByCalendarName, optionsForDomain: options });
  }

  function getTicketCalendarSnapshot(options) {
    return options && options.snapshot && options.snapshot.aliasesByNormalizedName && options.snapshot.weekdaysByCalendarName
      ? options.snapshot
      : createTicketCalendarSnapshot(options);
  }

  function resolveCalendar(calendarName, options) {
    const snapshot = getTicketCalendarSnapshot(options);
    const text = String(calendarName == null ? "" : calendarName).replace(/\s+/g, " ").trim();
    const normalized = snapshot.aliasesByNormalizedName.get(normalizeCompactText(text)) || text;
    return snapshot.calendars.find(calendar => calendar.name === normalized) || null;
  }

  function normalizeCalendarMark(mark) {
    const source = mark && typeof mark === "object" ? mark : {};
    return {
      calendar: source.calendarName == null ? source.calendar : source.calendarName,
      calendarId: getCalendarReferenceId(source),
      date: source.date,
      noTicket: source.noTicket == null ? source.no_ticket : source.noTicket
    };
  }

  function getNoTicketMarkSet(calendarName, calendarMarks, options) {
    const calendar = resolveCalendar(calendarName, options);
    if (!calendar) return new Set();
    const calendarId = String((normalizeDomainOptions(options).calendars || []).find(item => (
      item && typeof item === "object" && normalizeCompactText(item.name) === normalizeCompactText(calendar.name)
    ))?.id ?? "");
    const marks = [...(Array.isArray(calendarMarks) ? calendarMarks : []), ...(Array.isArray(normalizeDomainOptions(options).exclusions) ? normalizeDomainOptions(options).exclusions : [])];
    return new Set(marks
      .map(normalizeCalendarMark)
      .filter(mark => mark.noTicket)
      .filter(mark => mark.calendarId && calendarId ? mark.calendarId === calendarId : normalizeTicketCalendar(mark.calendar, options) === calendar.name)
      .map(mark => parseIsoDate(mark.date))
      .filter(Boolean));
  }

  function calendarHasTicketRightOnDate({ calendarName, date, calendarMarks = [], calendars, aliases, weekdays, exclusions, rules, snapshot } = {}) {
    const options = { calendars, aliases, weekdays, exclusions, rules, snapshot };
    const calendar = resolveCalendar(calendarName, options);
    const iso = parseIsoDate(date);
    if (!calendar || !iso || !calendar.ticketIsoWeekdays.includes(getIsoWeekday(iso))) return false;
    return !getNoTicketMarkSet(calendar.name, calendarMarks, options).has(iso);
  }

  function normalizePeriodNumber(value) {
    const number = Number(value);
    return Number.isInteger(number) ? number : 0;
  }

  function countTicketDaysForCalendar({ calendarName, year, month, calendarMarks = [], calendars, aliases, weekdays, exclusions, rules, snapshot } = {}) {
    const runtimeSnapshot = snapshot || createTicketCalendarSnapshot({ calendars, aliases, weekdays, exclusions, rules });
    const options = { calendars, aliases, weekdays, exclusions, rules, snapshot: runtimeSnapshot };
    const normalizedYear = normalizePeriodNumber(year);
    const normalizedMonth = normalizePeriodNumber(month);
    if (!resolveCalendar(calendarName, options) || normalizedMonth < 1 || normalizedMonth > 12) return 0;
    const totalDays = new Date(Date.UTC(normalizedYear, normalizedMonth, 0)).getUTCDate();
    let count = 0;
    for (let day = 1; day <= totalDays; day += 1) {
      const date = `${String(normalizedYear).padStart(4, "0")}-${String(normalizedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (calendarHasTicketRightOnDate({ calendarName, date, calendarMarks, calendars, aliases, weekdays, exclusions, rules, snapshot: runtimeSnapshot })) count += 1;
    }
    return count;
  }

  function countNoTicketWeekdaysForCalendar({ calendarName, year, month, calendarMarks = [], calendars, aliases, weekdays, exclusions, rules, snapshot } = {}) {
    const options = { calendars, aliases, weekdays, exclusions, rules, snapshot };
    const calendar = resolveCalendar(calendarName, options);
    const normalizedYear = normalizePeriodNumber(year);
    const normalizedMonth = normalizePeriodNumber(month);
    if (!calendar || normalizedMonth < 1 || normalizedMonth > 12) return 0;
    let count = 0;
    getNoTicketMarkSet(calendar.name, calendarMarks, options).forEach(date => {
      if (Number(date.slice(0, 4)) !== normalizedYear || Number(date.slice(5, 7)) !== normalizedMonth) return;
      if (calendar.ticketIsoWeekdays.includes(getIsoWeekday(date))) count += 1;
    });
    return count;
  }

  return Object.freeze({ normalizeTicketCalendar, isKnownTicketCalendar, getTicketCalendars, createTicketCalendarSnapshot, calendarHasTicketRightOnDate, countTicketDaysForCalendar, countNoTicketWeekdaysForCalendar });
})();

if (typeof window !== "undefined") window.TicketCalendarDomain = TicketCalendarDomain;
if (typeof module !== "undefined" && module.exports) module.exports = TicketCalendarDomain;
