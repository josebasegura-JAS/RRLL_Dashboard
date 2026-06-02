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
  const options = ticketCalendarManagementModel && ticketCalendarManagementModel.options;
  if (!options) return [];
  return options.calendars.map(calendar => ({
    ...calendar,
    aliases: options.aliases.filter(alias => Number(alias.calendar_id) === Number(calendar.id)).map(alias => alias.alias),
    weekdays: options.weekdays.filter(day => Number(day.calendar_id) === Number(calendar.id)).map(day => Number(day.iso_weekday))
  }));
}

function setTicketCalendarManagementNotice(message = "", type = "") {
  const notice = document.getElementById("ticketCalendarManagementNotice");
  if (!notice) return;
  notice.textContent = message;
  notice.className = `ticket-calendar-management-notice${type ? ` ${type}` : ""}`;
}

async function hydrateTicketCalendarManagement() {
  if (!window.rrllDB || typeof window.rrllDB.loadTicketCalendars !== "function") return;
  ticketCalendarManagementModel = await window.rrllDB.loadTicketCalendars();
  renderTicketCalendarManagement();
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
  document.getElementById("ticketCalendarManagementName").value = calendar.name || "";
  document.getElementById("ticketCalendarManagementAliases").value = calendar.aliases.join(", ");
  document.getElementById("ticketCalendarManagementObservations").value = calendar.observations || "";
  TICKET_CALENDAR_WEEKDAY_LABELS.forEach(([day]) => {
    document.getElementById(`ticketCalendarWeekday${day}`).checked = calendar.weekdays.includes(day);
  });
  document.getElementById("ticketCalendarManagementFormTitle").textContent = "Editar calendario";
  setTicketCalendarManagementNotice();
}

function readTicketCalendarManagementForm() {
  return {
    id: ticketCalendarManagementEditingId || undefined,
    name: document.getElementById("ticketCalendarManagementName").value,
    aliases: document.getElementById("ticketCalendarManagementAliases").value,
    observations: document.getElementById("ticketCalendarManagementObservations").value,
    weekdays: TICKET_CALENDAR_WEEKDAY_LABELS
      .filter(([day]) => document.getElementById(`ticketCalendarWeekday${day}`).checked)
      .map(([day]) => day)
  };
}

async function saveTicketCalendarManagement(event) {
  event.preventDefault();
  if (!window.rrllDB || typeof window.rrllDB.saveTicketCalendar !== "function") {
    setTicketCalendarManagementNotice("No está disponible la conexión con SQLite.", "error");
    return;
  }
  const result = await window.rrllDB.saveTicketCalendar(readTicketCalendarManagementForm());
  if (!result || !result.ok) {
    setTicketCalendarManagementNotice(result && result.message ? result.message : "No se ha podido guardar el calendario.", "error");
    return;
  }
  await hydrateTicketRestaurantCalendars();
  await hydrateTicketCalendarManagement();
  resetTicketCalendarForm();
  renderTicketRestaurant();
  setTicketCalendarManagementNotice("Calendario guardado correctamente.", "success");
}

window.hydrateTicketCalendarManagement = hydrateTicketCalendarManagement;
window.renderTicketCalendarManagement = renderTicketCalendarManagement;
window.resetTicketCalendarForm = resetTicketCalendarForm;
window.editTicketCalendar = editTicketCalendar;
window.saveTicketCalendarManagement = saveTicketCalendarManagement;
