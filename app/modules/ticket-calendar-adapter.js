/**
 * Adaptador de solo lectura entre TicketCalendarRepository y TicketCalendarDomain.
 * La ausencia de datos o cualquier error conserva el fallback base del dominio.
 */
const TicketCalendarAdapter = (() => {
  function freezeRows(rows) {
    return Object.freeze((Array.isArray(rows) ? rows : []).map(row => Object.freeze({ ...row })));
  }

  function createFallbackModel(domain) {
    return Object.freeze({
      source: "fallback",
      options: null,
      calendars: domain.getTicketCalendars()
    });
  }

  function buildDomainOptions({ calendars, aliases, weekdays, exclusions, rules } = {}) {
    return Object.freeze({
      calendars: freezeRows(calendars),
      aliases: freezeRows(aliases),
      weekdays: freezeRows(weekdays),
      exclusions: freezeRows(exclusions),
      rules: freezeRows(rules)
    });
  }

  function createTicketCalendarAdapter({ repository, domain, warn = console.warn } = {}) {
    if (!domain || typeof domain.getTicketCalendars !== "function") throw new Error("Se requiere TicketCalendarDomain para TicketCalendarAdapter.");

    function readTicketCalendarModel() {
      try {
        const options = buildDomainOptions({
          calendars: repository.getTicketCalendars(),
          aliases: repository.getTicketCalendarAliases(),
          weekdays: repository.getTicketCalendarWeekdays(),
          exclusions: repository.getTicketCalendarExclusions(),
          rules: repository.getTicketCalendarRules()
        });
        if (!options.calendars.length) {
          warn("TicketCalendarRepository no devolvió calendarios; se usa el fallback base.");
          return createFallbackModel(domain);
        }
        return Object.freeze({ source: "sqlite", options, calendars: domain.getTicketCalendars(options) });
      } catch (error) {
        warn("No se pudieron leer calendarios Ticket Restaurante desde SQLite; se usa el fallback base.", error);
        return createFallbackModel(domain);
      }
    }

    return Object.freeze({ readTicketCalendarModel });
  }

  return Object.freeze({ buildDomainOptions, createTicketCalendarAdapter });
})();

if (typeof window !== "undefined") window.TicketCalendarAdapter = TicketCalendarAdapter;
if (typeof module !== "undefined" && module.exports) module.exports = TicketCalendarAdapter;
