/**
 * Dashboard inicial: métricas útiles, calendario y actividad.
 * Tarjetas con mini-donut, próximos vencimientos, calendario y alertas compactas.
 */

let phase5CalendarEventsByDay = new Map();
let phase5CalendarClickReady = false;


function phase4SafeArray(getterName) {
  try {
    const getter = window[getterName];
    if (typeof getter !== "function") return [];
    const value = getter();
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function phase4SetText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function phase4SetTexts(ids, value) {
  ids.forEach(id => phase4SetText(id, value));
}

function phase4ParseDate(value) {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function phase4FormatDate(value) {
  const date = phase4ParseDate(value);
  if (!date) return value ? String(value) : "Sin fecha";
  return date.toLocaleDateString("es-ES");
}

function phase4ShortDate(value) {
  const date = phase4ParseDate(value);
  if (!date) return "--";
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).replace(".", "");
}

function phase4DaysUntil(value) {
  const date = phase4ParseDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.round((date - today) / 86400000);
}

function phase4DueLabel(value) {
  const days = phase4DaysUntil(value);
  if (days === null) return "Sin fecha";
  if (days < 0) return `Vencido hace ${Math.abs(days)} d.`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  return `En ${days} días`;
}

function phase4RecentItem(title, module, date, target) {
  return {
    title: title || "Sin título",
    module,
    date: date || "",
    target,
    ts: date ? new Date(date).getTime() : 0
  };
}

const PHASE5_DASHBOARD_COLORS = {
  pending: "#f59e0b",
  progress: "#3b82f6",
  allegations: "#8b5cf6",
  signature: "#22c55e",
  session: "#14b8a6",
  expired: "#ef4444"
};

function phase5StartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function phase5IsRelevantSession(session) {
  if (!session || session.status === "closed") return false;
  const date = phase4ParseDate(session.date);
  return !date || date >= phase5StartOfToday();
}

function phase5SetMetricDonut(id, segments) {
  const el = document.getElementById(id);
  if (!el) return;
  const normalized = (segments || []).map(segment => ({
    ...segment,
    value: Math.max(0, Number(segment.value) || 0)
  }));
  const total = normalized.reduce((sum, segment) => sum + segment.value, 0);
  const legend = document.getElementById(`${id}Legend`);

  if (!total) {
    el.style.background = "conic-gradient(rgba(148,163,184,.22) 0 100%)";
    el.title = "Sin asuntos activos";
    if (legend) legend.innerHTML = `<span class="phase5-empty-legend">Sin asuntos activos</span>`;
    return;
  }

  let acc = 0;
  const stops = normalized
    .filter(segment => segment.value > 0)
    .map(segment => {
      const start = acc;
      acc += (segment.value / total) * 100;
      return `${segment.color} ${start}% ${acc}%`;
    });
  el.style.background = `conic-gradient(${stops.join(", ")})`;
  el.title = `${total} asuntos activos`;

  if (legend) {
    legend.innerHTML = normalized.filter(segment => segment.value > 0).map(segment => `
      <span class="phase5-metric-legend-item">
        <i style="background:${segment.color}"></i>
        <span>${escapeHtml(segment.label)}</span>
        <b>${segment.value}</b>
      </span>`).join("");
  }
}

function phase5CalendarKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function phase5MonthLabel(date) {
  return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function phase5EventClass(type, dateValue) {
  const days = phase4DaysUntil(dateValue);
  if (days !== null && days < 0) return "cal-expired";
  if (type === "committee") return "cal-committee";
  if (type === "paritaria") return "cal-paritaria";
  return "cal-due";
}

function phase5CollectDashboardData() {
  const tasks = phase4SafeArray("getTasks");
  const petitions = phase4SafeArray("getPetitions");
  const minutes = phase4SafeArray("getMinutes");
  const telework = phase4SafeArray("getTeleworkItems");
  const committee = phase4SafeArray("getAgendaItems");
  const committeeSessions = phase4SafeArray("getCommitteeSessions");
  const paritaria = phase4SafeArray("getParitariaItems");
  const paritariaSessions = phase4SafeArray("getParitariaSessions");

  return { tasks, petitions, minutes, telework, committee, committeeSessions, paritaria, paritariaSessions };
}

function dashboardSearchNormalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function dashboardSearchText(parts) {
  return dashboardSearchNormalize((parts || []).filter(Boolean).join(" "));
}

function dashboardSearchHtml(value) {
  if (typeof escapeHtml === "function") return escapeHtml(value || "");
  return String(value || "").replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function dashboardSearchStatus(value) {
  if (!value) return "";
  try {
    return typeof statusLabel === "function" ? statusLabel(value) : String(value);
  } catch {
    return String(value);
  }
}

function dashboardSearchResultDate(item) {
  return item.requestDate || item.date || item.rawDate || item.committeeSessionDate || item.paritariaSessionDate || item.createdAt || "";
}

function dashboardSearchMatches(text, query) {
  if (!query) return false;
  if (text.includes(query)) return true;
  return query.split(" ").filter(Boolean).every(term => text.includes(term));
}

function dashboardSearchSnippet(source, query) {
  const compact = String(source || "").replace(/\s+/g, " ").trim();
  if (!compact) return "Coincidencia en el registro.";
  const normalizedSource = dashboardSearchNormalize(compact);
  const firstTerm = query.split(" ").find(Boolean) || query;
  const index = normalizedSource.indexOf(firstTerm);
  if (index < 0) return compact.length > 150 ? `${compact.slice(0, 147)}…` : compact;
  const start = Math.max(0, index - 45);
  const end = Math.min(compact.length, index + firstTerm.length + 95);
  return `${start > 0 ? "…" : ""}${compact.slice(start, end)}${end < compact.length ? "…" : ""}`;
}

function dashboardSearchDateTime(value) {
  const date = phase4ParseDate(value);
  return date ? date.getTime() : null;
}

function dashboardSearchSortNewestFirst(a, b) {
  const aTime = dashboardSearchDateTime(a.date);
  const bTime = dashboardSearchDateTime(b.date);
  if (aTime !== null && bTime !== null && aTime !== bTime) return bTime - aTime;
  if (aTime !== null && bTime === null) return -1;
  if (aTime === null && bTime !== null) return 1;
  return String(a.title || "").localeCompare(String(b.title || ""), "es");
}

function dashboardSearchYearLabel(value) {
  const date = phase4ParseDate(value);
  return date ? String(date.getFullYear()) : "Sin fecha";
}

function dashboardSearchSortTimeline(a, b) {
  return dashboardSearchSortNewestFirst(a, b);
}

function dashboardSearchBuildRows() {
  const { committee, committeeSessions, paritaria, paritariaSessions } = phase5CollectDashboardData();
  const rows = [];

  committee.forEach(item => {
    const date = dashboardSearchResultDate(item);
    const code = item.committeeSessionCode || item.code || "";
    const source = [item.title, item.petitioner, item.notes, code, date, item.committeeSessionOrder, dashboardSearchStatus(item.status), ...(item.updates || []).map(update => update.text)].filter(Boolean).join(" · ");
    rows.push({
      type: "Comité",
      kind: "committee",
      date,
      code,
      title: item.title || "Punto de Comité",
      status: dashboardSearchStatus(item.status),
      source,
      target: "gestor-puntos-comite",
      targetId: `rrll-agenda-${item.id}`,
      text: dashboardSearchText([source])
    });
  });

  committeeSessions.forEach(session => {
    const date = dashboardSearchResultDate(session);
    const linkedItems = typeof getCommitteeSessionDisplayItems === "function" ? getCommitteeSessionDisplayItems(session).map(item => `${item.title || ""} ${item.meta || ""}`) : [];
    const source = [session.title, session.code, date, session.rawDate, session.notes, session.status === "closed" ? "Histórico" : "Abierta", ...linkedItems].filter(Boolean).join(" · ");
    rows.push({
      type: "Comité",
      kind: "committee",
      date,
      code: session.code || "",
      title: session.title || session.code || "Sesión Comité",
      status: session.status === "closed" ? "Histórico" : "Abierta",
      source,
      target: "gestor-sesiones-comite",
      targetId: `rrll-session-${session.id}`,
      text: dashboardSearchText([source])
    });
  });

  paritaria.forEach(item => {
    const date = dashboardSearchResultDate(item);
    const code = item.paritariaSessionCode || item.code || "";
    const source = [item.title, item.petitioner, item.notes, code, date, item.paritariaSessionOrder, dashboardSearchStatus(item.status), ...(item.updates || []).map(update => update.text)].filter(Boolean).join(" · ");
    rows.push({
      type: "Paritaria",
      kind: "paritaria",
      date,
      code,
      title: item.title || "Punto de Paritaria",
      status: dashboardSearchStatus(item.status),
      source,
      target: "gestor-puntos-paritaria",
      targetId: `rrll-paritaria-${item.id}`,
      text: dashboardSearchText([source])
    });
  });

  paritariaSessions.forEach(session => {
    const date = dashboardSearchResultDate(session);
    const linkedItems = typeof getParitariaSessionDisplayItems === "function" ? getParitariaSessionDisplayItems(session).map(item => `${item.title || ""} ${item.meta || ""}`) : [];
    const source = [session.title, session.code, date, session.rawDate, session.notes, session.status === "closed" ? "Histórico" : "Abierta", ...linkedItems].filter(Boolean).join(" · ");
    rows.push({
      type: "Paritaria",
      kind: "paritaria",
      date,
      code: session.code || "",
      title: session.title || session.code || "Sesión Paritaria",
      status: session.status === "closed" ? "Histórico" : "Abierta",
      source,
      target: "gestor-sesiones-paritaria",
      targetId: `rrll-paritaria-session-${session.id}`,
      text: dashboardSearchText([source])
    });
  });

  return rows;
}

function openDashboardSearchResult(target, targetId) {
  if (target === "gestor-puntos-comite" || target === "gestor-sesiones-comite") {
    if (typeof openCommitteeSubsection === "function") openCommitteeSubsection(target);
    else if (typeof openPhase4DashboardTarget === "function") openPhase4DashboardTarget("gestor-comite");
  } else if (target === "gestor-puntos-paritaria" || target === "gestor-sesiones-paritaria") {
    if (typeof openParitariaSubsection === "function") openParitariaSubsection(target);
    else if (typeof openPhase4DashboardTarget === "function") openPhase4DashboardTarget("gestor-paritaria");
  }

  if (target === "gestor-sesiones-comite" && targetId && typeof getCommitteeSessions === "function" && typeof setCommitteeSessionView === "function") {
    const session = getCommitteeSessions().find(item => `rrll-session-${item.id}` === targetId);
    if (session) setCommitteeSessionView(session.status === "closed" ? "history" : "open");
  }
  if (target === "gestor-sesiones-paritaria" && targetId && typeof getParitariaSessions === "function" && typeof setParitariaSessionView === "function") {
    const session = getParitariaSessions().find(item => `rrll-paritaria-session-${item.id}` === targetId);
    if (session) setParitariaSessionView(session.status === "closed" ? "history" : "open");
  }

  setTimeout(() => {
    const el = document.getElementById(targetId) || document.getElementById(target);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("search-hit-highlight");
    setTimeout(() => el.classList.remove("search-hit-highlight"), 2200);
  }, 180);
}

function renderDashboardSearchTimeline(results, query) {
  const container = document.getElementById("dashboardSearchTimeline");
  if (!container) return;

  const head = `
    <div class="phase4-card-head">
      <h3>Timeline del asunto</h3>
      <span>Comité · Paritaria</span>
    </div>`;

  if (!query) {
    container.innerHTML = "";
    return;
  }

  if (!results.length) {
    container.innerHTML = `${head}<div class="dashboard-search-empty">No se han encontrado coincidencias.</div>`;
    return;
  }

  const groups = new Map();
  results.slice().sort(dashboardSearchSortTimeline).forEach(item => {
    const year = dashboardSearchYearLabel(item.date);
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(item);
  });

  const timeline = Array.from(groups.entries()).map(([year, items]) => `
    <section class="dashboard-timeline-year" aria-label="${dashboardSearchHtml(year)}">
      <h4>${dashboardSearchHtml(year)}</h4>
      ${items.map(item => `
        <button type="button" class="dashboard-timeline-item" onclick="openDashboardSearchResult('${item.target}', '${dashboardSearchHtml(item.targetId)}')">
          <span class="dashboard-timeline-node" aria-hidden="true"></span>
          <span class="dashboard-timeline-content">
            <span class="dashboard-timeline-meta">
              <span class="dashboard-timeline-badge dashboard-timeline-badge--${item.kind}">${dashboardSearchHtml(item.type)}</span>
              <em>${dashboardSearchHtml(item.date ? phase4FormatDate(item.date) : "Sin fecha")}</em>
              ${item.code ? `<em>${dashboardSearchHtml(item.code)}</em>` : ""}
              ${item.status ? `<em>${dashboardSearchHtml(item.status)}</em>` : ""}
            </span>
            <strong>${dashboardSearchHtml(item.title)}</strong>
            <small>${dashboardSearchHtml(dashboardSearchSnippet(item.source, query))}</small>
          </span>
        </button>`).join("")}
    </section>`).join("");

  container.innerHTML = `${head}<div class="dashboard-timeline">${timeline}</div>`;
}

function renderDashboardSearchResults(results, query) {
  renderDashboardSearchTimeline(results, query);
}

function runDashboardSearch() {
  const input = document.getElementById("dashboardSearchInput");
  const query = dashboardSearchNormalize(input ? input.value : "");
  if (input && input.value !== query) input.value = query;
  const results = dashboardSearchBuildRows()
    .filter(row => dashboardSearchMatches(row.text, query))
    .sort(dashboardSearchSortNewestFirst);
  renderDashboardSearchResults(results, query);
}

function clearDashboardSearch() {
  const input = document.getElementById("dashboardSearchInput");
  if (input) input.value = "";
  renderDashboardSearchResults([], "");
  const timeline = document.getElementById("dashboardSearchTimeline");
  if (timeline) timeline.innerHTML = "";
  if (input) input.focus();
}

function setDashboardSearchCollapsed(collapsed) {
  const card = document.querySelector(".dashboard-search-collapsible");
  const header = card ? card.querySelector(".dashboard-search-header") : null;
  const body = document.getElementById("dashboardSearchBody");
  if (!card || !header || !body) return;
  card.classList.toggle("is-collapsed", collapsed);
  header.setAttribute("aria-expanded", collapsed ? "false" : "true");
  body.hidden = collapsed;
  if (!collapsed) {
    const input = document.getElementById("dashboardSearchInput");
    if (input) setTimeout(() => input.focus(), 0);
  }
}

function toggleDashboardSearch() {
  const card = document.querySelector(".dashboard-search-collapsible");
  setDashboardSearchCollapsed(!(card && card.classList.contains("is-collapsed")));
}


function phase5SetupCalendarClicks() {
  if (phase5CalendarClickReady) return;
  phase5CalendarClickReady = true;
  document.addEventListener("click", event => {
    const dayButton = event.target && event.target.closest ? event.target.closest(".phase5-calendar-day[data-date]") : null;
    if (dayButton) {
      event.preventDefault();
      phase5OpenCalendarDay(dayButton.dataset.date);
      return;
    }
    const closeButton = event.target && event.target.closest ? event.target.closest("[data-calendar-modal-close]") : null;
    if (closeButton) {
      event.preventDefault();
      phase5CloseCalendarDay();
      return;
    }
    const eventButton = event.target && event.target.closest ? event.target.closest("[data-calendar-target]") : null;
    if (eventButton) {
      event.preventDefault();
      const target = eventButton.getAttribute("data-calendar-target");
      phase5CloseCalendarDay();
      if (target && typeof phase4OpenTarget === "function") phase4OpenTarget(target);
    }
  });
}

function phase5EnsureCalendarModal() {
  let modal = document.getElementById("phase5CalendarDayModal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "phase5CalendarDayModal";
  modal.className = "phase5-calendar-modal";
  modal.innerHTML = `
    <div class="phase5-calendar-modal-panel" role="dialog" aria-modal="true" aria-labelledby="phase5CalendarModalTitle">
      <div class="phase5-calendar-modal-head">
        <div>
          <strong id="phase5CalendarModalTitle">Agenda del día</strong>
          <small id="phase5CalendarModalDate"></small>
        </div>
        <button type="button" data-calendar-modal-close aria-label="Cerrar">×</button>
      </div>
      <div class="phase5-calendar-modal-list" id="phase5CalendarModalList"></div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

function phase5CalendarTypeLabel(event) {
  if (event.type === "committee") return "Comité";
  if (event.type === "paritaria") return "Paritaria";
  if (phase4DaysUntil(event.date) < 0) return "Vencido";
  return "Vencimiento";
}

function phase5OpenCalendarDay(dateKey) {
  const events = phase5CalendarEventsByDay.get(dateKey) || [];
  if (!events.length) return;
  const modal = phase5EnsureCalendarModal();
  const title = document.getElementById("phase5CalendarModalTitle");
  const date = document.getElementById("phase5CalendarModalDate");
  const list = document.getElementById("phase5CalendarModalList");
  const parsed = phase4ParseDate(dateKey);
  if (title) title.textContent = `${events.length} asunto${events.length === 1 ? "" : "s"}`;
  if (date) date.textContent = parsed ? parsed.toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : dateKey;
  if (list) {
    list.innerHTML = events.map(event => {
      const typeClass = phase5EventClass(event.type, event.date);
      const label = phase5CalendarTypeLabel(event);
      const due = phase4DueLabel(event.date);
      const target = event.target ? ` data-calendar-target="${escapeHtml(event.target)}"` : "";
      return `<button type="button" class="phase5-calendar-modal-item ${typeClass}"${target}>
        <span><i></i>${escapeHtml(label)}</span>
        <strong>${escapeHtml(event.title || "Sin título")}</strong>
        <small>${escapeHtml(event.module || "")} · ${escapeHtml(due)}</small>
      </button>`;
    }).join("");
  }
  modal.classList.add("open");
}

function phase5CloseCalendarDay() {
  const modal = document.getElementById("phase5CalendarDayModal");
  if (modal) modal.classList.remove("open");
}

function phase5RenderCalendarLegend(events) {
  const legend = document.querySelector(".phase5-calendar-legend");
  if (!legend) return;
  const labels = {
    "cal-due": "Vencimiento activo",
    "cal-committee": "Comité abierto/futuro",
    "cal-paritaria": "Paritaria abierta/futura",
    "cal-expired": "Vencido activo"
  };
  const counts = events.reduce((acc, event) => {
    const className = phase5EventClass(event.type, event.date);
    acc[className] = (acc[className] || 0) + 1;
    return acc;
  }, {});
  const order = ["cal-expired", "cal-due", "cal-committee", "cal-paritaria"];
  legend.innerHTML = order
    .filter(className => counts[className] > 0)
    .map(className => `<span><i class="${className}"></i> ${labels[className]} <b>${counts[className]}</b></span>`)
    .join("") || `<span class="phase5-empty-legend">Sin eventos activos</span>`;
}

function phase5RenderCalendar(events) {
  const grid = document.getElementById("homeCalendarGrid");
  if (!grid) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonthHasEvents = events.some(event => {
    const date = phase4ParseDate(event.date);
    return date && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
  });
  const firstUpcoming = events
    .map(event => ({ ...event, parsed: phase4ParseDate(event.date) }))
    .filter(event => event.parsed && event.parsed >= today)
    .sort((a, b) => a.parsed - b.parsed)[0];
  const base = currentMonthHasEvents || !firstUpcoming ? today : firstUpcoming.parsed;
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const mondayOffset = (first.getDay() + 6) % 7;
  const cells = [];

  for (let i = 0; i < mondayOffset; i++) cells.push({ empty: true });
  for (let day = 1; day <= last.getDate(); day++) cells.push({ date: new Date(year, month, day) });
  while (cells.length % 7 !== 0) cells.push({ empty: true });

  const byDay = new Map();
  events.forEach(event => {
    const date = phase4ParseDate(event.date);
    if (!date) return;
    const key = phase5CalendarKey(date);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(event);
  });
  phase5CalendarEventsByDay = byDay;
  phase5SetupCalendarClicks();

  phase4SetText("homeCalendarTitle", phase5MonthLabel(base));
  phase4SetText("homeCalendarSub", "Vencimientos activos · sesiones abiertas/futuras");
  phase5RenderCalendarLegend(events);

  grid.innerHTML = cells.map(cell => {
    if (cell.empty) return `<span class="phase5-calendar-day empty"></span>`;
    const key = phase5CalendarKey(cell.date);
    const dayEvents = byDay.get(key) || [];
    const classes = ["phase5-calendar-day"];
    if (key === phase5CalendarKey(today)) classes.push("today");
    if (dayEvents.length) classes.push("has-event");
    const dots = dayEvents.slice(0, 4).map(event => `<i class="${phase5EventClass(event.type, event.date)}"></i>`).join("");
    const title = dayEvents.map(event => `${event.module}: ${event.title}`).join("\n");
    return `<button type="button" class="${classes.join(" ")}" data-date="${key}" title="${escapeHtml(title)}"><b>${cell.date.getDate()}</b><span>${dots}</span></button>`;
  }).join("");
}

function renderHomeDashboard() {
  const home = document.getElementById("phase4HomeDashboard");
  if (!home) return;

  const { tasks, petitions, minutes, telework, committee, committeeSessions, paritaria, paritariaSessions } = phase5CollectDashboardData();

  const activeTasks = tasks.filter(i => i.status === "pending" || i.status === "progress");
  const activePetitions = petitions.filter(i => i.status === "petition-pending" || i.status === "petition-progress");
  const activeMinutes = minutes.filter(i => ["todo", "direction", "allegations", "signature"].includes(i.status));
  const teleworkActivePeriod = typeof getTeleworkActiveCampaign === "function" ? getTeleworkActiveCampaign() : null;
  const activeTelework = telework.filter(i => (!teleworkActivePeriod || i.period === teleworkActivePeriod) && (i.status === "telework-entry" || i.status === "telework-processing"));
  const activeCommittee = committee.filter(i => i.status === "agenda-pending" || i.status === "agenda-progress");
  const activeParitaria = paritaria.filter(i => i.status === "paritaria-pending" || i.status === "paritaria-progress");
  const activeCommitteeSessions = committeeSessions.filter(phase5IsRelevantSession);
  const activeParitariaSessions = paritariaSessions.filter(phase5IsRelevantSession);

  const taskPending = activeTasks.filter(i => i.status === "pending").length;
  const taskProgress = activeTasks.filter(i => i.status === "progress").length;

  const petitionPending = activePetitions.filter(i => i.status === "petition-pending").length;
  const petitionProgress = activePetitions.filter(i => i.status === "petition-progress").length;

  const minutesTodo = activeMinutes.filter(i => i.status === "todo").length;
  const minutesDirection = activeMinutes.filter(i => i.status === "direction").length;
  const minutesAllegations = activeMinutes.filter(i => i.status === "allegations").length;
  const minutesSignature = activeMinutes.filter(i => i.status === "signature").length;

  const teleworkEntry = activeTelework.filter(i => i.status === "telework-entry").length;
  const teleworkProcessing = activeTelework.filter(i => i.status === "telework-processing").length;

  const committeePending = activeCommittee.filter(i => i.status === "agenda-pending").length;
  const committeeProgress = activeCommittee.filter(i => i.status === "agenda-progress").length;
  const committeeOpenSessions = activeCommitteeSessions.length;

  const paritariaPending = activeParitaria.filter(i => i.status === "paritaria-pending").length;
  const paritariaProgress = activeParitaria.filter(i => i.status === "paritaria-progress").length;
  const paritariaOpenSessions = activeParitariaSessions.length;

  phase4SetText("homeMetricTasks", taskPending + taskProgress);
  phase4SetText("homeMetricTasksSub", `${taskPending} pendientes · ${taskProgress} en curso`);
  phase4SetText("homeMetricPetitions", petitionPending + petitionProgress);
  phase4SetText("homeMetricPetitionsSub", `${petitionPending} pendientes · ${petitionProgress} en curso`);
  phase4SetText("homeMetricMinutes", minutesTodo + minutesDirection + minutesAllegations + minutesSignature);
  phase4SetText("homeMetricMinutesSub", `${minutesTodo} hacer · ${minutesDirection} dirección · ${minutesAllegations} aleg.`);
  phase4SetText("homeMetricTelework", teleworkEntry + teleworkProcessing);
  phase4SetText("homeMetricTeleworkSub", `${teleworkEntry} entrada · ${teleworkProcessing} trámite`);
  phase4SetText("homeMetricCommittee", committeePending + committeeProgress + committeeOpenSessions);
  phase4SetText("homeMetricCommitteeSub", `${committeePending} pendientes · ${committeeProgress} en curso · ${committeeOpenSessions} sesiones`);
  phase4SetText("homeMetricParitaria", paritariaPending + paritariaProgress + paritariaOpenSessions);
  phase4SetText("homeMetricParitariaSub", `${paritariaPending} pendientes · ${paritariaProgress} en curso · ${paritariaOpenSessions} sesiones`);

  phase5SetMetricDonut("homeMetricTasksDonut", [
    { label: "Pendientes", value: taskPending, color: PHASE5_DASHBOARD_COLORS.pending },
    { label: "En curso", value: taskProgress, color: PHASE5_DASHBOARD_COLORS.progress }
  ]);
  phase5SetMetricDonut("homeMetricPetitionsDonut", [
    { label: "Pendientes", value: petitionPending, color: PHASE5_DASHBOARD_COLORS.pending },
    { label: "En curso", value: petitionProgress, color: PHASE5_DASHBOARD_COLORS.progress }
  ]);
  phase5SetMetricDonut("homeMetricMinutesDonut", [
    { label: "Pend. hacer", value: minutesTodo, color: PHASE5_DASHBOARD_COLORS.pending },
    { label: "Dirección", value: minutesDirection, color: PHASE5_DASHBOARD_COLORS.progress },
    { label: "Alegaciones", value: minutesAllegations, color: PHASE5_DASHBOARD_COLORS.allegations },
    { label: "Firma", value: minutesSignature, color: PHASE5_DASHBOARD_COLORS.signature }
  ]);
  phase5SetMetricDonut("homeMetricTeleworkDonut", [
    { label: "Entrada", value: teleworkEntry, color: PHASE5_DASHBOARD_COLORS.pending },
    { label: "Trámite", value: teleworkProcessing, color: PHASE5_DASHBOARD_COLORS.progress }
  ]);
  phase5SetMetricDonut("homeMetricCommitteeDonut", [
    { label: "Pendientes", value: committeePending, color: PHASE5_DASHBOARD_COLORS.pending },
    { label: "En curso", value: committeeProgress, color: PHASE5_DASHBOARD_COLORS.progress },
    { label: "Sesiones", value: committeeOpenSessions, color: PHASE5_DASHBOARD_COLORS.session }
  ]);
  phase5SetMetricDonut("homeMetricParitariaDonut", [
    { label: "Pendientes", value: paritariaPending, color: PHASE5_DASHBOARD_COLORS.pending },
    { label: "En curso", value: paritariaProgress, color: PHASE5_DASHBOARD_COLORS.progress },
    { label: "Sesiones", value: paritariaOpenSessions, color: PHASE5_DASHBOARD_COLORS.session }
  ]);

  const dueItems = [];
  activeTasks.filter(i => i.dueDate).forEach(i => dueItems.push({ title: i.title, module: "Tareas", type: "due", date: i.dueDate, target: "gestor-tareas" }));
  activePetitions.filter(i => i.dueDate).forEach(i => dueItems.push({ title: i.title, module: "Peticiones", type: "due", date: i.dueDate, target: "gestor-peticiones" }));
  activeMinutes.filter(i => i.status === "allegations" && i.dueDate).forEach(i => dueItems.push({ title: i.title, module: "Actas", type: "due", date: i.dueDate, target: "gestor-actas" }));

  const sessionItems = [];
  activeCommitteeSessions.filter(i => i.date).forEach(i => sessionItems.push({ title: i.title || i.code || "Sesión Comité", module: "Comité", type: "committee", date: i.date, target: "gestor-sesiones-comite" }));
  activeParitariaSessions.filter(i => i.date).forEach(i => sessionItems.push({ title: i.title || i.code || "Sesión Paritaria", module: "Paritaria", type: "paritaria", date: i.date, target: "gestor-sesiones-paritaria" }));

  const calendarEvents = [...dueItems, ...sessionItems].filter(i => phase4ParseDate(i.date));
  phase5RenderCalendar(calendarEvents);

  const agendaItems = [...dueItems, ...sessionItems]
    .map(item => ({ ...item, days: phase4DaysUntil(item.date) }))
    .filter(item => item.days !== null)
    .sort((a, b) => a.days - b.days);

  const dueList = document.getElementById("homeDueList");
  phase4SetText("homeDueCount", `${agendaItems.length} activos con fecha`);
  if (dueList) {
    dueList.innerHTML = agendaItems.slice(0, 9).map(item => {
      const days = item.days;
      const level = days < 0 ? "danger" : days <= 2 ? "warning" : item.type;
      return `<button type="button" class="phase4-list-row phase5-dashboard-row phase5-agenda-row ${level}" onclick="openPhase4DashboardTarget('${item.target}')"><span>${escapeHtml(item.module)}</span><b>${escapeHtml(item.title)}</b><small>${phase4DueLabel(item.date)}</small><em>${escapeHtml(phase4ShortDate(item.date))}</em></button>`;
    }).join("") || `<div class="phase4-empty">Sin asuntos activos con fecha.</div>`;
  }

  const alerts = dueItems
    .map(item => ({ ...item, days: phase4DaysUntil(item.date) }))
    .filter(item => item.days !== null && item.days <= 7)
    .sort((a, b) => a.days - b.days);
  phase4SetText("homeAlertCount", alerts.length);
  const alertsList = document.getElementById("homeAlertsList");
  if (alertsList) {
    alertsList.innerHTML = alerts.slice(0, 7).map(item => {
      const level = item.days < 0 ? "danger" : item.days <= 2 ? "warning" : "info";
      return `<button type="button" class="phase4-list-row phase5-dashboard-row phase5-alert-row ${level}" onclick="openPhase4DashboardTarget('${item.target}')"><span>${escapeHtml(item.module)}</span><b>${escapeHtml(item.title)}</b><small>${phase4DueLabel(item.date)}</small><em>${escapeHtml(phase4ShortDate(item.date))}</em></button>`;
    }).join("") || `<div class="phase4-empty">Sin alertas de asuntos activos.</div>`;
  }

  const recent = [];
  activeTasks.forEach(i => recent.push(phase4RecentItem(i.title, "Tarea", i.updatedAt || i.createdAt, "gestor-tareas")));
  activePetitions.forEach(i => recent.push(phase4RecentItem(i.title, "Petición", i.updatedAt || i.createdAt, "gestor-peticiones")));
  activeMinutes.forEach(i => recent.push(phase4RecentItem(i.title, "Acta", i.updatedAt || i.createdAt, "gestor-actas")));
  activeTelework.forEach(i => recent.push(phase4RecentItem(i.person || i.title || "Solicitud teletrabajo", "Teletrabajo", i.updatedAt || i.createdAt, "gestor-teletrabajo")));
  activeCommittee.forEach(i => recent.push(phase4RecentItem(i.title, "Comité", i.updatedAt || i.createdAt, "gestor-comite")));
  activeParitaria.forEach(i => recent.push(phase4RecentItem(i.title, "Paritaria", i.updatedAt || i.createdAt, "gestor-paritaria")));
  activeCommitteeSessions.forEach(i => recent.push(phase4RecentItem(i.title || i.code || "Sesión Comité", "Sesión Comité", i.updatedAt || i.createdAt || i.date, "gestor-sesiones-comite")));
  activeParitariaSessions.forEach(i => recent.push(phase4RecentItem(i.title || i.code || "Sesión Paritaria", "Sesión Paritaria", i.updatedAt || i.createdAt || i.date, "gestor-sesiones-paritaria")));
  recent.sort((a, b) => b.ts - a.ts);
  const recentList = document.getElementById("homeRecentList");
  if (recentList) {
    recentList.innerHTML = recent.slice(0, 8).map(item => `<button type="button" class="phase4-list-row phase5-dashboard-row phase5-recent-row" onclick="openPhase4DashboardTarget('${item.target}')"><span>${escapeHtml(item.module)}</span><b>${escapeHtml(item.title)}</b><small>${item.date ? phase4FormatDate(item.date) : "Sin fecha"}</small><em>›</em></button>`).join("") || `<div class="phase4-empty">Sin actividad activa reciente.</div>`;
  }
}

function renderDate() {
  const date = new Date();
  const today = document.getElementById("today");
  if (today) {
    today.textContent = date.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }
}

window.phase4SafeArray = phase4SafeArray;
window.phase4SetText = phase4SetText;
window.phase4SetTexts = phase4SetTexts;
window.phase4FormatDate = phase4FormatDate;
window.phase4DaysUntil = phase4DaysUntil;
window.phase4DueLabel = phase4DueLabel;
window.phase4RecentItem = phase4RecentItem;
window.runDashboardSearch = runDashboardSearch;
window.clearDashboardSearch = clearDashboardSearch;
window.toggleDashboardSearch = toggleDashboardSearch;
window.setDashboardSearchCollapsed = setDashboardSearchCollapsed;
window.openDashboardSearchResult = openDashboardSearchResult;
window.renderHomeDashboard = renderHomeDashboard;
window.renderDate = renderDate;

window.phase5CloseCalendarDay = phase5CloseCalendarDay;
