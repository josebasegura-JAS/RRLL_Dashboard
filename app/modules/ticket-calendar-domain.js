const TicketCalendarDomain = (() => {
  const TICKET_CALENDARS = Object.freeze(["Servicios Centrales", "Ingeniería Ariz", "Instalaciones Sopela", "Liberados"]);

  function normalizeTicketCalendarText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/º/g, "o")
      .replace(/ª/g, "a")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function normalizeTicketCalendarCompactText(value) {
    return normalizeTicketCalendarText(value).replace(/[^a-z0-9]/g, "");
  }

  function normalizeTicketCalendar(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    const key = normalizeTicketCalendarCompactText(text);
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
    return calendarAliases.get(key) || TICKET_CALENDARS.find(item => normalizeTicketCalendarCompactText(item) === key) || text;
  }

  function isKnownTicketCalendar(value) {
    return TICKET_CALENDARS.includes(normalizeTicketCalendar(value));
  }

  function isValidTicketIsoDate(value) {
    const text = String(value || "").trim();
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(0);
    date.setHours(0, 0, 0, 0);
    date.setFullYear(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  function ticketIsoDateToLocalDate(value) {
    if (!isValidTicketIsoDate(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(0);
    date.setHours(0, 0, 0, 0);
    date.setFullYear(year, month - 1, day);
    return date;
  }

  function normalizeNoTicketDates(noTicketDates) {
    const dates = noTicketDates instanceof Set ? [...noTicketDates] : (Array.isArray(noTicketDates) ? noTicketDates : []);
    return new Set(dates.filter(isValidTicketIsoDate));
  }

  function getNoTicketDatesForCalendar(calendarName, calendarMarks) {
    const normalizedCalendar = normalizeTicketCalendar(calendarName);
    if (!isKnownTicketCalendar(normalizedCalendar)) return new Set();
    return normalizeNoTicketDates((Array.isArray(calendarMarks) ? calendarMarks : [])
      .filter(item => item && item.noTicket && normalizeTicketCalendar(item.calendar) === normalizedCalendar)
      .map(item => item.date));
  }

  function calendarHasTicketRightOnDate({ calendarName, date, noTicketDates } = {}) {
    if (!isKnownTicketCalendar(calendarName)) return false;
    const localDate = ticketIsoDateToLocalDate(date);
    if (!localDate) return false;
    const weekday = localDate.getDay();
    if (weekday === 0 || weekday === 6) return false;
    return !normalizeNoTicketDates(noTicketDates).has(date);
  }

  function countTicketDaysForCalendar({ calendarName, year, month, calendarMarks } = {}) {
    const normalizedCalendar = normalizeTicketCalendar(calendarName);
    if (!isKnownTicketCalendar(normalizedCalendar)) return 0;
    const normalizedYear = Number(year);
    const normalizedMonth = Number(month);
    if (!Number.isInteger(normalizedYear) || !Number.isInteger(normalizedMonth) || normalizedMonth < 1 || normalizedMonth > 12) return 0;
    const noTicketDates = getNoTicketDatesForCalendar(normalizedCalendar, calendarMarks);
    const totalDays = new Date(normalizedYear, normalizedMonth, 0).getDate();
    let count = 0;
    for (let day = 1; day <= totalDays; day += 1) {
      const date = `${String(normalizedYear).padStart(4, "0")}-${String(normalizedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (calendarHasTicketRightOnDate({ calendarName: normalizedCalendar, date, noTicketDates })) count += 1;
    }
    return count;
  }

  function countNoTicketWeekdaysForCalendar({ calendarName, year, month, calendarMarks } = {}) {
    const normalizedCalendar = normalizeTicketCalendar(calendarName);
    if (!isKnownTicketCalendar(normalizedCalendar)) return 0;
    const normalizedYear = Number(year);
    const normalizedMonth = Number(month);
    if (!Number.isInteger(normalizedYear) || !Number.isInteger(normalizedMonth) || normalizedMonth < 1 || normalizedMonth > 12) return 0;
    const noTicketDates = getNoTicketDatesForCalendar(normalizedCalendar, calendarMarks);
    let count = 0;
    noTicketDates.forEach(date => {
      const localDate = ticketIsoDateToLocalDate(date);
      if (!localDate || localDate.getFullYear() !== normalizedYear || localDate.getMonth() + 1 !== normalizedMonth) return;
      const weekday = localDate.getDay();
      if (weekday !== 0 && weekday !== 6) count += 1;
    });
    return count;
  }

  return Object.freeze({
    TICKET_CALENDARS,
    normalizeTicketCalendar,
    isKnownTicketCalendar,
    calendarHasTicketRightOnDate,
    countTicketDaysForCalendar,
    countNoTicketWeekdaysForCalendar
  });
})();
