const TICKET_CALENDAR_WEEKDAY_LABELS = Object.freeze([
  [1, "Lunes", "L"],
  [2, "Martes", "M"],
  [3, "Miércoles", "X"],
  [4, "Jueves", "J"],
  [5, "Viernes", "V"],
  [6, "Sábado", "S"],
  [7, "Domingo", "D"]
]);

let ticketCalendarManagementModel = null;
let ticketCalendarManagementEditingId = 0;

function getTicketCalendarManagementRows() {
  const options = ticketCalendarManagementModel && ticketCalendarManagementModel.options || {};
  const calendars = Array.isArray(options.calendars) ? options.calendars : [];
  const aliases = Array.isArray(options.aliases) ? options.aliases : [];
  const weekdays = Array.isArray(options.weekdays) ? options.weekdays : [];
  return calendars.map(calendar => ({
    ...calendar,
    aliases: aliases.filter(alias => Number(alias.calendar_id) === Number(calendar.id)).map(alias => alias.alias),
    weekdays: weekdays.filter(day => Number(day.calendar_id) === Number(calendar.id)).map(day => Number(day.iso_weekday))
  }));
}

function setTicketCalendarManagementNotice(message = "", type = "") {
  const notice = document.getElementById("ticketCalendarManagementNotice");
  if (!notice) return;
  notice.textContent = message;
  notice.className = `ticket-calendar-management-notice${type ? ` ${type}` : ""}`;
}

async function hydrateTicketCalendarManagement({ force = false, render = true } = {}) {
  const finish = typeof rrllTicketRestaurantPerfStart === "function" ? rrllTicketRestaurantPerfStart("hydrateTicketCalendarManagement") : null;
  try {
    ticketCalendarManagementModel = window.rrllDB && typeof window.rrllDB.loadTicketCalendars === "function"
      ? await (typeof window.loadTicketCalendarModelCached === "function" ? window.loadTicketCalendarModelCached({ force }) : window.rrllDB.loadTicketCalendars())
      : null;
  } catch (error) {
    console.warn("No se pudo hidratar el mantenimiento de calendarios Ticket; se muestra vacío o fallback.", error);
    ticketCalendarManagementModel = null;
    setTicketCalendarManagementNotice("No se pudieron cargar los calendarios guardados. Se mantiene el fallback de Ticket Restaurante.", "error");
  }
  if (render) renderTicketCalendarManagement();
  if (finish) finish();
}

function renderTicketCalendarManagement() {
  const body = document.getElementById("ticketCalendarManagementBody");
  if (!body) return;
  const rows = getTicketCalendarManagementRows();
  body.innerHTML = rows.map(calendar => `
    <tr>
      <td>${escapeHtml(calendar.name)}</td>
      <td>${escapeHtml(calendar.aliases.join(", ") || "—")}</td>
      <td>${Number(calendar.active) === 1 ? "Sí" : "No"}</td>
      <td>${escapeHtml(TICKET_CALENDAR_WEEKDAY_LABELS.filter(([day]) => calendar.weekdays.includes(day)).map(([, , short]) => short).join(" "))}</td>
      <td class="table-actions"><button class="secondary small" type="button" onclick="editTicketCalendar(${Number(calendar.id)})">Editar</button></td>
    </tr>`).join("") || '<tr><td colspan="5" class="rrll-pro-empty">No hay calendarios disponibles.</td></tr>';
}

function resetTicketCalendarForm() {
  ticketCalendarManagementEditingId = 0;
  const form = document.getElementById("ticketCalendarManagementForm");
  if (form) form.reset();
  TICKET_CALENDAR_WEEKDAY_LABELS.forEach(([day]) => {
    const checkbox = document.getElementById(`ticketCalendarWeekday${day}`);
    if (checkbox) checkbox.checked = day <= 5;
  });
  const title = document.getElementById("ticketCalendarManagementFormTitle");
  if (title) title.textContent = "Nuevo calendario";
  setTicketCalendarManagementNotice();
}

function editTicketCalendar(calendarId) {
  const calendar = getTicketCalendarManagementRows().find(item => Number(item.id) === Number(calendarId));
  if (!calendar) return;
  ticketCalendarManagementEditingId = Number(calendar.id);
  const name = document.getElementById("ticketCalendarManagementName");
  const aliases = document.getElementById("ticketCalendarManagementAliases");
  const observations = document.getElementById("ticketCalendarManagementObservations");
  const title = document.getElementById("ticketCalendarManagementFormTitle");
  if (name) name.value = calendar.name || "";
  if (aliases) aliases.value = calendar.aliases.join(", ");
  if (observations) observations.value = calendar.observations || "";
  TICKET_CALENDAR_WEEKDAY_LABELS.forEach(([day]) => {
    const checkbox = document.getElementById(`ticketCalendarWeekday${day}`);
    if (checkbox) checkbox.checked = calendar.weekdays.includes(day);
  });
  if (title) title.textContent = "Editar calendario";
  setTicketCalendarManagementNotice();
}

function readTicketCalendarManagementForm() {
  return {
    id: ticketCalendarManagementEditingId || undefined,
    name: (document.getElementById("ticketCalendarManagementName") || {}).value || "",
    aliases: (document.getElementById("ticketCalendarManagementAliases") || {}).value || "",
    observations: (document.getElementById("ticketCalendarManagementObservations") || {}).value || "",
    weekdays: TICKET_CALENDAR_WEEKDAY_LABELS
      .filter(([day]) => {
        const checkbox = document.getElementById(`ticketCalendarWeekday${day}`);
        return checkbox && checkbox.checked;
      })
      .map(([day]) => day)
  };
}

async function saveTicketCalendarManagement(event) {
  if (event && typeof event.preventDefault === "function") event.preventDefault();
  if (!window.rrllDB || typeof window.rrllDB.saveTicketCalendar !== "function") {
    setTicketCalendarManagementNotice("No está disponible la conexión con SQLite.", "error");
    return;
  }
  let result;
  try {
    result = await window.rrllDB.saveTicketCalendar(readTicketCalendarManagementForm());
  } catch (error) {
    console.warn("No se pudo guardar el calendario Ticket.", error);
    setTicketCalendarManagementNotice(error && error.message ? error.message : "No se ha podido guardar el calendario.", "error");
    return;
  }
  if (!result || !result.ok) {
    setTicketCalendarManagementNotice(result && result.message ? result.message : "No se ha podido guardar el calendario.", "error");
    return;
  }
  try {
    if (typeof window.invalidateTicketCalendarModelCache === "function") window.invalidateTicketCalendarModelCache();
    if (typeof hydrateTicketRestaurantCalendars === "function") await hydrateTicketRestaurantCalendars({ force: true });
  } catch (error) { console.warn("No se pudo refrescar Ticket Restaurante tras guardar el calendario.", error); }
  await hydrateTicketCalendarManagement();
  resetTicketCalendarForm();
  if (typeof renderTicketRestaurant === "function") renderTicketRestaurant();
  setTicketCalendarManagementNotice("Calendario guardado correctamente.", "success");
}

window.hydrateTicketCalendarManagement = hydrateTicketCalendarManagement;
window.renderTicketCalendarManagement = renderTicketCalendarManagement;
window.resetTicketCalendarForm = resetTicketCalendarForm;
window.editTicketCalendar = editTicketCalendar;
window.saveTicketCalendarManagement = saveTicketCalendarManagement;
