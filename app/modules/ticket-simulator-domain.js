const TicketSimulatorDomain = (() => {
  function parseTicketSimulationNumber(value) {
    if (typeof value === "number") return value;

    const text = String(value == null ? "" : value).replace(/\s+/g, "").trim();
    if (!text) return NaN;

    const lastComma = text.lastIndexOf(",");
    const lastDot = text.lastIndexOf(".");
    let normalized = text;
    if (lastComma > lastDot) normalized = text.replace(/\./g, "").replace(",", ".");
    else if (lastDot > lastComma && lastComma >= 0) normalized = text.replace(/,/g, "");
    else normalized = text.replace(",", ".");

    return Number(normalized);
  }

  function normalizeTicketSimulationNumber(value, fallback = 0) {
    const number = parseTicketSimulationNumber(value);
    if (Number.isFinite(number)) return number;
    const fallbackNumber = parseTicketSimulationNumber(fallback);
    return Number.isFinite(fallbackNumber) ? fallbackNumber : 0;
  }

  function normalizeTicketSimulationRate(value, fallback = 0) {
    const text = String(value == null ? "" : value).trim();
    const hasPercentageSymbol = text.includes("%");
    const number = parseTicketSimulationNumber(text.replace(/%/g, ""));
    if (!Number.isFinite(number) || number < 0) {
      if (value === fallback) return 0;
      return normalizeTicketSimulationRate(fallback, 0);
    }

    const rate = hasPercentageSymbol || number > 1 ? number / 100 : number;
    if (rate > 1) {
      if (value === fallback) return 0;
      return normalizeTicketSimulationRate(fallback, 0);
    }
    return rate;
  }

  function normalizeTicketSimulationPeriodNumber(value, fallback) {
    const number = normalizeTicketSimulationNumber(value, fallback);
    return Math.trunc(number);
  }

  function resolveTicketCalendarDomain() {
    if (typeof TicketCalendarDomain === "undefined") {
      throw new Error("TicketCalendarDomain is required to calculate ticket simulations.");
    }
    return TicketCalendarDomain;
  }

  function calculateTicketSimulationGroupCost(group = {}, scenario = {}) {
    const calendarDomain = resolveTicketCalendarDomain();
    const calendarName = String(group.calendarName == null ? "" : group.calendarName).trim();
    const normalizedCalendarName = calendarDomain.normalizeTicketCalendar(calendarName);
    const year = normalizeTicketSimulationPeriodNumber(scenario.year, 0);
    const month = normalizeTicketSimulationPeriodNumber(scenario.month, 1);
    const peopleCount = Math.max(0, normalizeTicketSimulationNumber(group.peopleCount, 0));
    const absenceRate = normalizeTicketSimulationRate(
      group.absenceRate == null ? scenario.defaultAbsenceRate : group.absenceRate,
      0
    );
    const ticketAmount = Math.max(0, normalizeTicketSimulationNumber(
      group.ticketAmount == null ? scenario.ticketAmount : group.ticketAmount,
      0
    ));
    const warnings = [];
    const hasKnownCalendar = calendarDomain.isKnownTicketCalendar(normalizedCalendarName);
    if (!hasKnownCalendar) warnings.push(`Calendario desconocido: ${calendarName || "(vacío)"}.`);

    const ticketDaysPerPerson = hasKnownCalendar
      ? calendarDomain.countTicketDaysForCalendar({
        calendarName: normalizedCalendarName,
        year,
        month,
        calendarMarks: Array.isArray(scenario.calendarMarks) ? scenario.calendarMarks : []
      })
      : 0;
    const theoreticalTickets = ticketDaysPerPerson * peopleCount;
    const estimatedAbsenceTickets = theoreticalTickets * absenceRate;
    const estimatedTickets = theoreticalTickets - estimatedAbsenceTickets;
    const estimatedCost = estimatedTickets * ticketAmount;

    return {
      groupId: group.id,
      label: group.label,
      calendarName,
      normalizedCalendarName,
      year,
      month,
      peopleCount,
      ticketDaysPerPerson,
      theoreticalTickets,
      absenceRate,
      estimatedAbsenceTickets,
      estimatedTickets,
      ticketAmount,
      estimatedCost,
      warnings
    };
  }

  function calculateTicketSimulationScenario(groups = [], scenario = {}) {
    const year = normalizeTicketSimulationPeriodNumber(scenario.year, 0);
    const month = normalizeTicketSimulationPeriodNumber(scenario.month, 1);
    const ticketAmount = Math.max(0, normalizeTicketSimulationNumber(scenario.ticketAmount, 0));
    const defaultAbsenceRate = normalizeTicketSimulationRate(scenario.defaultAbsenceRate, 0);
    const normalizedScenario = { ...scenario, year, month, ticketAmount, defaultAbsenceRate };
    const calculatedGroups = (Array.isArray(groups) ? groups : []).map(group => (
      calculateTicketSimulationGroupCost(group, normalizedScenario)
    ));
    const totals = calculatedGroups.reduce((result, group) => ({
      peopleCount: result.peopleCount + group.peopleCount,
      theoreticalTickets: result.theoreticalTickets + group.theoreticalTickets,
      estimatedAbsenceTickets: result.estimatedAbsenceTickets + group.estimatedAbsenceTickets,
      estimatedTickets: result.estimatedTickets + group.estimatedTickets,
      estimatedCost: result.estimatedCost + group.estimatedCost
    }), {
      peopleCount: 0,
      theoreticalTickets: 0,
      estimatedAbsenceTickets: 0,
      estimatedTickets: 0,
      estimatedCost: 0
    });
    const warnings = calculatedGroups.flatMap(group => group.warnings.map(warning => ({
      groupId: group.groupId,
      warning
    })));

    return { year, month, ticketAmount, defaultAbsenceRate, groups: calculatedGroups, totals, warnings };
  }

  return Object.freeze({
    normalizeTicketSimulationNumber,
    normalizeTicketSimulationRate,
    calculateTicketSimulationGroupCost,
    calculateTicketSimulationScenario
  });
})();
