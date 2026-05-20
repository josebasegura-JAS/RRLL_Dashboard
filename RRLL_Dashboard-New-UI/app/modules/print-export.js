/**
 * Impresión y exportación Excel/HTML.
 * Extraído en Fase 2 sin cambiar comportamiento funcional.
 */

function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }


    function htmlEscapeForPrint(value) { return String(value || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
    function datePrint(value) { try { return value ? new Date(value).toLocaleDateString("es-ES") : ""; } catch { return ""; } }

    function getActiveModuleFilter(type) {
      if (type === "tasks") {
        const active = document.querySelector("#gestor-tareas .rrll-pro-tabs button.active");
        if (!active || active.id === "task-filter-all") return "all";
        return active.id.replace("task-filter-", "");
      }
      if (type === "petitions") {
        const active = document.querySelector("#gestor-peticiones .rrll-pro-tabs button.active");
        if (!active || active.id === "petition-filter-all") return "all";
        const short = active.id.replace("petition-filter-", "");
        return short === "pending" || short === "progress" || short === "closed" ? `petition-${short}` : "all";
      }
      if (type === "minutes") {
        const active = document.querySelector("#gestor-actas .rrll-pro-tabs button.active");
        if (!active || active.id === "minute-filter-all") return "all";
        return active.id.replace("minute-filter-", "");
      }
      if (type === "agenda") {
        const active = document.querySelector("#gestor-puntos-comite .rrll-pro-tabs button.active");
        if (!active || active.id === "agenda-filter-all") return "all";
        const short = active.id.replace("agenda-filter-", "");
        return short === "pending" || short === "progress" || short === "closed" ? `agenda-${short}` : "all";
      }
      if (type === "paritaria") {
        const active = document.querySelector("#gestor-puntos-paritaria .rrll-pro-tabs button.active");
        if (!active || active.id === "paritaria-filter-all") return "all";
        const short = active.id.replace("paritaria-filter-", "");
        return short === "pending" || short === "progress" || short === "closed" ? `paritaria-${short}` : "all";
      }
      if (type === "telework") {
        const active = document.querySelector("#gestor-teletrabajo .rrll-pro-tabs button.active");
        if (!active || active.id === "telework-filter-all") return "all";
        const short = active.id.replace("telework-filter-", "");
        return ["entry", "processing", "direction", "approved", "denied"].includes(short) ? `telework-${short}` : "all";
      }
      return "all";
    }

    function getInlineSearchQuery(type) {
      const ids = { tasks: "taskInlineSearch", petitions: "petitionInlineSearch", minutes: "minuteInlineSearch", agenda: "agendaInlineSearch", paritaria: "paritariaInlineSearch", telework: "teleworkInlineSearch" };
      return String(document.getElementById(ids[type])?.value || "").trim().toLowerCase();
    }

    function matchesText(parts, query) {
      if (!query) return true;
      return String(parts.filter(Boolean).join(" ")).toLowerCase().includes(query);
    }

    function closedWithinLastMonthForPrint(item) {
      if (typeof isClosedWithinLastMonth === "function") return isClosedWithinLastMonth(item);
      if (item.status !== "closed") return false;
      const closed = new Date(item.closedAt || item.createdAt || 0);
      const limit = new Date();
      limit.setDate(limit.getDate() - 30);
      return closed >= limit;
    }

    function getFilteredTasksForOutput() {
      if (typeof window.getVisibleTasks === "function") return window.getVisibleTasks();
      const filter = getActiveModuleFilter("tasks");
      const query = getInlineSearchQuery("tasks");
      return getTasks()
        .filter(i => filter === "closed" ? i.status === "closed" : i.status !== "closed")
        .filter(i => filter === "all" || filter === "closed" || i.status === filter)
        .filter(i => matchesText([i.title, i.notes, i.dueDate, statusLabel(i.status), priorityLabel(i.priority), updatesToText(i.updates)], query));
    }

    function getFilteredPetitionsForOutput() {
      if (typeof window.getVisiblePetitions === "function") return window.getVisiblePetitions();
      const filter = getActiveModuleFilter("petitions");
      const query = getInlineSearchQuery("petitions");
      return getPetitions()
        .filter(i => filter === "petition-closed" ? i.status === "petition-closed" : i.status !== "petition-closed")
        .filter(i => filter === "all" || filter === "petition-closed" || i.status === filter)
        .filter(i => matchesText([i.title, i.notes, i.dueDate, statusLabel(i.status), priorityLabel(i.priority), (i.sources || []).join(" "), updatesToText(i.updates)], query));
    }

    function getFilteredMinutesForOutput() {
      const filter = getActiveModuleFilter("minutes");
      const query = getInlineSearchQuery("minutes");
      return getMinutes()
        .filter(i => filter === "all" || i.status === filter)
        .filter(i => matchesText([i.title, i.notes, i.dueDate, statusLabel(i.status)], query));
    }

    function getFilteredAgendaForOutput() {
      const filter = getActiveModuleFilter("agenda");
      const query = getInlineSearchQuery("agenda");
      return getAgendaItems()
        .filter(i => filter === "all" || i.status === filter)
        .filter(i => matchesText([i.title, i.petitioner, i.notes, i.requestDate, statusLabel(i.status), i.committeeSessionCode, i.committeeSessionDate, updatesToText(i.updates)], query));
    }

    function getFilteredParitariaForOutput() {
      const filter = getActiveModuleFilter("paritaria");
      const query = getInlineSearchQuery("paritaria");
      return getParitariaItems()
        .filter(i => filter === "all" || i.status === filter)
        .filter(i => matchesText([i.title, i.petitioner, i.notes, i.requestDate, statusLabel(i.status), i.paritariaSessionCode, i.paritariaSessionDate, updatesToText(i.updates)], query));
    }

    function getFilteredTeleworkForOutput() {
      if (typeof window.getTeleworkRowsForExport === "function") return window.getTeleworkRowsForExport(false);
      const filter = getActiveModuleFilter("telework");
      const query = getInlineSearchQuery("telework");
      const active = typeof window.getTeleworkActiveCampaign === "function" ? window.getTeleworkActiveCampaign() : null;
      return getTeleworkItems()
        .filter(i => !active || String(i.period || "") === active)
        .filter(i => filter === "all" || i.status === filter)
        .filter(i => matchesText([i.employeeNumber, i.name, i.job, i.period, i.type, teleworkOutputStatusLabel(i.status), i.presenceValidation, i.favorableReport, i.security, i.prevention, i.directionValidation, i.observations, (i.days || []).join(" ")], query));
    }

    function teleworkOutputStatusLabel(status) {
      const labels = {
        "telework-entry": "Solicitud recibida",
        "telework-processing": "Validaciones pendientes",
        "telework-direction": "Pendiente Dirección",
        "telework-approved": "Aprobada",
        "telework-denied": "Denegada"
      };
      return labels[status] || statusLabel(status);
    }

    function outputFilterLabel(type) {
      const filter = getActiveModuleFilter(type);
      const maps = {
        tasks: { all: "todas visibles", pending: "pendientes", progress: "en curso", closed: "cerradas visibles" },
        petitions: { all: "todas", "petition-pending": "pendientes", "petition-progress": "en curso", "petition-closed": "cerradas" },
        minutes: { all: "todas", todo: "pendientes de hacer", direction: "enviadas a Dirección", allegations: "pendientes de alegaciones", signature: "pendientes de firma" },
        agenda: { all: "todos", "agenda-pending": "pendientes", "agenda-progress": "en curso", "agenda-closed": "cerrados" },
        paritaria: { all: "todos", "paritaria-pending": "pendientes", "paritaria-progress": "en curso", "paritaria-closed": "cerrados" },
        telework: { all: "todas", "telework-entry": "recibidas", "telework-processing": "validaciones pendientes", "telework-direction": "pendientes de Dirección", "telework-approved": "aprobadas", "telework-denied": "denegadas" }
      };
      return maps[type]?.[filter] || "filtro actual";
    }
    function buildPrintRows(type) {
      if (type === "tasks") return { title: `Gestor de tareas - ${outputFilterLabel("tasks")}`, rows: getFilteredTasksForOutput().map(i => ({ estado: statusLabel(i.status), titulo: i.title, detalle: `Prioridad: ${htmlEscapeForPrint(priorityLabel(i.priority))}<br>${htmlEscapeForPrint(dueStatus(i.dueDate).text)}<br>${htmlEscapeForPrint(i.notes || "")}`, avances: (i.updates || []).map(u => `${datePrint(u.createdAt)}: ${htmlEscapeForPrint(u.text)}`).join("<br>") })) };
      if (type === "agenda") return { title: `Puntos del Comité - ${outputFilterLabel("agenda")}`, rows: getFilteredAgendaForOutput().map(i => ({ estado: statusLabel(i.status), titulo: i.title, detalle: `Peticionario: ${htmlEscapeForPrint(i.petitioner || "Sin indicar")}<br>Fecha solicitud: ${htmlEscapeForPrint(i.requestDate || "Sin fecha")}<br>Sesión: ${htmlEscapeForPrint(i.committeeSessionCode || "Sin asignar")}<br>${htmlEscapeForPrint(i.notes || "")}`, avances: (i.updates || []).map(u => `${datePrint(u.createdAt)}: ${htmlEscapeForPrint(u.text)}`).join("<br>") })) };
      if (type === "paritaria") return { title: `Puntos Paritaria - ${outputFilterLabel("paritaria")}`, rows: getFilteredParitariaForOutput().map(i => ({ estado: statusLabel(i.status), titulo: i.title, detalle: `Peticionario: ${htmlEscapeForPrint(i.petitioner || "Sin indicar")}<br>Fecha solicitud: ${htmlEscapeForPrint(i.requestDate || "Sin fecha")}<br>Sesión: ${htmlEscapeForPrint(i.paritariaSessionCode || "Sin asignar")}<br>${htmlEscapeForPrint(i.notes || "")}`, avances: (i.updates || []).map(u => `${datePrint(u.createdAt)}: ${htmlEscapeForPrint(u.text)}`).join("<br>") })) };
      if (type === "petitions") return { title: `Gestor de peticiones - ${outputFilterLabel("petitions")}`, rows: getFilteredPetitionsForOutput().map(i => ({ estado: statusLabel(i.status), titulo: i.title, detalle: `Origen: ${htmlEscapeForPrint((i.sources || []).join(", ") || "Sin clasificar")}<br>Prioridad: ${htmlEscapeForPrint(priorityLabel(i.priority))}<br>${htmlEscapeForPrint(dueStatus(i.dueDate).text)}<br>${htmlEscapeForPrint(i.notes || "")}`, avances: (i.updates || []).map(u => `${datePrint(u.createdAt)}: ${htmlEscapeForPrint(u.text)}`).join("<br>") })) };
      if (type === "committeeSessions") return { title: "Sesiones de Comité", rows: getCommitteeSessions().map(s => ({ estado: s.status === "closed" ? "Histórico" : "Abierta", titulo: s.title || s.code || "Sesión", detalle: `Código: ${htmlEscapeForPrint(s.code || "")}<br>Fecha: ${htmlEscapeForPrint(s.date || s.rawDate || "")}<br>${htmlEscapeForPrint(s.notes || "")}`, avances: getCommitteeSessionDisplayItems(s).map((item, idx) => `${idx + 1}. ${htmlEscapeForPrint(item.title || "")}`).join("<br>") })) };
      if (type === "paritariaSessions") return { title: "Sesiones Paritaria", rows: getParitariaSessions().map(s => ({ estado: s.status === "closed" ? "Histórico" : "Abierta", titulo: s.title || s.code || "Sesión", detalle: `Código: ${htmlEscapeForPrint(s.code || "")}<br>Fecha: ${htmlEscapeForPrint(s.date || s.rawDate || "")}<br>${htmlEscapeForPrint(s.notes || "")}`, avances: getParitariaSessionDisplayItems(s).map((item, idx) => `${idx + 1}. ${htmlEscapeForPrint(item.title || "")}`).join("<br>") })) };
      if (type === "minutes") return { title: `Gestor de actas - ${outputFilterLabel("minutes")}`, rows: getFilteredMinutesForOutput().map(i => ({ estado: statusLabel(i.status), titulo: i.title, detalle: `Fecha límite: ${htmlEscapeForPrint(i.dueDate || "Sin fecha")}<br>${htmlEscapeForPrint(i.notes || "")}`, avances: "" })) };
      if (type === "telework") return { title: `Gestor de teletrabajo - ${outputFilterLabel("telework")}`, rows: getFilteredTeleworkForOutput().map(i => ({ estado: teleworkOutputStatusLabel(i.status), titulo: i.name || i.employeeNumber || "Solicitud", detalle: `Nº empleado: ${htmlEscapeForPrint(i.employeeNumber || "")}<br>Puesto: ${htmlEscapeForPrint(i.job || "")}<br>Periodo: ${htmlEscapeForPrint(i.period || "")}<br>Tipo: ${htmlEscapeForPrint(i.type || "")}<br>Días: ${htmlEscapeForPrint((i.days || []).join(", "))}`, avances: `Presencialidad: ${htmlEscapeForPrint(i.presenceValidation || "Pendiente")}<br>Informe favorable: ${htmlEscapeForPrint(i.favorableReport || "Pendiente")}<br>Seguridad Informática: ${htmlEscapeForPrint(i.security || "Pendiente")}<br>Prevención: ${htmlEscapeForPrint(i.prevention || "Pendiente")}<br>Dirección: ${htmlEscapeForPrint(i.directionValidation || "Pendiente")}<br>Observaciones: ${htmlEscapeForPrint(i.observations || "")}` })) };
      return { title: "Impresión", rows: [] };
    }


    function excelSafeValue(value) {
      const text = String(value ?? "");
      return /^[=+\-@]/.test(text) ? `\'${text}` : text;
    }

    function excelEscape(value) {
      return excelSafeValue(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    function statusLabel(value) {
      const labels = {
        pending: "Pendiente",
        progress: "En curso",
        closed: "Cerrada",
        "agenda-pending": "Pendiente",
        "agenda-progress": "En curso",
        "agenda-closed": "Cerrado",
        "paritaria-pending": "Pendiente",
        "paritaria-progress": "En curso",
        "paritaria-closed": "Cerrado",
        "petition-pending": "Pendiente",
        "petition-progress": "En curso",
        "petition-closed": "Cerrada",
        direction: "Enviada a Dirección",
        allegations: "Pendiente de alegaciones",
        signature: "Pendiente de firma",
        entry: "Entrada",
        processing: "En tramitación",
        approved: "Aprobada",
        denied: "Denegada",
        "telework-entry": "Solicitud recibida",
        "telework-processing": "Validaciones pendientes",
        "telework-direction": "Pendiente Dirección",
        "telework-approved": "Aprobada",
        "telework-denied": "Denegada"
      };
      return labels[value] || value || "";
    }

    function updatesToText(updates) {
      return (updates || []).map(update => `${datePrint(update.createdAt)}: ${update.text || ""}`).join("\n");
    }

    function teleworkYesNo(value) {
      if (value === true) return "Sí";
      if (value === false) return "No";
      return value || "";
    }

    function buildTeleworkExcelData(rows, title, filename) {
      const items = Array.isArray(rows) ? rows : getFilteredTeleworkForOutput();
      return {
        title: title || "Teletrabajo",
        filename: filename || `teletrabajo-${typeof window.getTeleworkActiveCampaign === "function" ? window.getTeleworkActiveCampaign() : "campana"}`,
        headers: ["Nº empleado", "Solicitante", "Puesto", "Periodo", "Tipo solicitud", "Días solicitados", "Cumplimiento presencialidad", "Informe favorable", "Seguridad informática", "Prevención", "Año anterior teletrabajado", "Validación Jefatura Unidad", "Validación Dirección", "Estado", "Fecha resolución", "Observaciones"],
        rows: items.map(item => [
          item.employeeNumber || "",
          item.name || "",
          item.job || "",
          item.period || "Sin periodo",
          item.type || "",
          (item.days || []).join(", "),
          item.presenceValidation || teleworkYesNo(item.presenceCompliance) || "Pendiente",
          item.favorableReport || teleworkYesNo(item.managerApproval) || "Pendiente",
          item.security || teleworkYesNo(item.security) || "Pendiente",
          item.prevention || teleworkYesNo(item.prevention) || "Pendiente",
          item.previousYearTeleworked || teleworkYesNo(item.previousYearTelework) || "No aplica",
          item.unitHeadRepeatValidation || teleworkYesNo(item.unitManagerRepeatApproval) || "No aplica",
          item.directionValidation || teleworkYesNo(item.directionApproval) || "Pendiente",
          teleworkOutputStatusLabel(item.status),
          item.resolutionDate || (item.resolvedAt ? datePrint(item.resolvedAt) : ""),
          item.observations || ""
        ])
      };
    }

    function buildExcelData(type) {
      if (type === "tasks") {
        return {
          title: "Tareas",
          filename: "tareas",
          headers: ["Estado", "Prioridad", "Fecha límite", "Título", "Notas", "Creada", "Cerrada", "Avances"],
          rows: getFilteredTasksForOutput().map(item => [statusLabel(item.status), priorityLabel(item.priority), item.dueDate || "", item.title, item.notes, datePrint(item.createdAt), datePrint(item.closedAt), updatesToText(item.updates)])
        };
      }
      if (type === "agenda") {
        return {
          title: "Comité",
          filename: "comite",
          headers: ["Estado", "Peticionario", "Título", "Fecha solicitud", "Comité", "Fecha Comité", "Orden", "Notas", "Creado", "Cerrado", "Avances"],
          rows: getFilteredAgendaForOutput().map(item => [statusLabel(item.status), item.petitioner, item.title, item.requestDate, item.committeeSessionCode || "", item.committeeSessionDate || "", item.committeeSessionOrder || "", item.notes, datePrint(item.createdAt), datePrint(item.closedAt), updatesToText(item.updates)])
        };
      }
      if (type === "paritaria") {
        return {
          title: "Paritaria",
          filename: "paritaria",
          headers: ["Estado", "Peticionario", "Título", "Fecha solicitud", "Sesión Paritaria", "Fecha Paritaria", "Orden", "Notas", "Creado", "Cerrado", "Avances"],
          rows: getFilteredParitariaForOutput().map(item => [statusLabel(item.status), item.petitioner, item.title, item.requestDate, item.paritariaSessionCode || "", item.paritariaSessionDate || "", item.paritariaSessionOrder || "", item.notes, datePrint(item.createdAt), datePrint(item.closedAt), updatesToText(item.updates)])
        };
      }
      if (type === "committeeSessions") {
        return {
          title: "Sesiones de Comité",
          filename: "sesiones-comite",
          headers: ["Estado", "Código", "Fecha", "Título", "Notas", "Creada", "Cerrada", "Puntos del orden del día"],
          rows: getCommitteeSessions().map(session => {
            const points = getCommitteeSessionDisplayItems(session).map((item, idx) => `${idx + 1}. ${item.title || ""}`).join("\n");
            return [session.status === "closed" ? "Histórico" : "Abierta", session.code || "", session.date || "", session.title || "", session.notes || "", datePrint(session.createdAt), datePrint(session.closedAt), points];
          })
        };
      }
      if (type === "paritariaSessions") {
        return {
          title: "Sesiones Paritaria",
          filename: "sesiones-paritaria",
          headers: ["Estado", "Código", "Fecha", "Título", "Notas", "Creada", "Cerrada", "Puntos del orden del día"],
          rows: getParitariaSessions().map(session => {
            const points = getParitariaSessionDisplayItems(session).map((item, idx) => `${idx + 1}. ${item.title || ""}`).join("\n");
            return [session.status === "closed" ? "Histórico" : "Abierta", session.code || "", session.date || "", session.title || "", session.notes || "", datePrint(session.createdAt), datePrint(session.closedAt), points];
          })
        };
      }
      if (type === "minutes") {
        return {
          title: "Actas",
          filename: "actas",
          headers: ["Estado", "Título", "Fecha límite", "Notas", "Creada"],
          rows: getFilteredMinutesForOutput().map(item => [statusLabel(item.status), item.title, item.dueDate, item.notes, datePrint(item.createdAt)])
        };
      }
      if (type === "petitions") {
        return {
          title: "Peticiones",
          filename: "peticiones",
          headers: ["Estado", "Origen", "Prioridad", "Fecha límite", "Título", "Notas", "Creada", "Cerrada", "Actualizaciones"],
          rows: getFilteredPetitionsForOutput().map(item => [statusLabel(item.status), (item.sources || []).join(", "), priorityLabel(item.priority), item.dueDate || "", item.title, item.notes, datePrint(item.createdAt), datePrint(item.closedAt), updatesToText(item.updates)])
        };
      }
      if (type === "telework") {
        return {
          title: "Teletrabajo",
          filename: "teletrabajo",
          headers: ["Estado", "Nº empleado", "Nombre", "Puesto", "Periodo", "Tipo", "Días", "Presencialidad", "Informe favorable", "Seguridad Informática", "Prevención", "Año anterior", "Jefatura Unidad", "Dirección", "Fecha resolución", "Observaciones", "Creada"],
          rows: getFilteredTeleworkForOutput().map(item => [teleworkOutputStatusLabel(item.status), item.employeeNumber, item.name, item.job || "", item.period || "", item.type, (item.days || []).join(", "), item.presenceValidation || "Pendiente", item.favorableReport || "Pendiente", item.security || "Pendiente", item.prevention || "Pendiente", item.previousYearTeleworked || "No aplica", item.unitHeadRepeatValidation || "No aplica", item.directionValidation || "Pendiente", item.resolutionDate || "", item.observations || "", datePrint(item.createdAt)])
        };
      }
      return { title: "Exportación", filename: "exportacion", headers: [], rows: [] };
    }

    function buildSingleSessionExcelData(kind, sessionId) {
      const isParitaria = kind === "paritaria";
      const sessions = isParitaria ? getParitariaSessions() : getCommitteeSessions();
      const session = sessions.find(s => s.id === sessionId);
      const label = isParitaria ? "Paritaria" : "Comité";
      if (!session) {
        return { title: `Sesión de ${label}`, filename: `sesion-${isParitaria ? "paritaria" : "comite"}`, headers: [], rows: [] };
      }
      const items = isParitaria ? getParitariaSessionDisplayItems(session) : getCommitteeSessionDisplayItems(session);
      return {
        title: `Sesión de ${label} - ${session.code || session.title || "sin-codigo"}`,
        filename: `sesion-${isParitaria ? "paritaria" : "comite"}-${String(session.code || session.date || session.id).replace(/[^a-zA-Z0-9_-]/g, "-")}`,
        headers: ["Estado", "Código", "Fecha", "Título", "Notas", "Orden", "Punto", "Detalle"],
        rows: items.length ? items.map((item, idx) => [
          session.status === "closed" ? "Histórico" : "Abierta",
          session.code || "",
          session.date || session.rawDate || "",
          session.title || "",
          session.notes || "",
          idx + 1,
          item.title || "",
          item.meta || ""
        ]) : [[session.status === "closed" ? "Histórico" : "Abierta", session.code || "", session.date || session.rawDate || "", session.title || "", session.notes || "", "", "Sin puntos asignados", ""]]
      };
    }

    function exportExcelData(data) {
      const headerHtml = data.headers.map(h => `<th>${excelEscape(h)}</th>`).join("");
      const bodyHtml = data.rows.length
        ? data.rows.map(row => `<tr>${row.map(cell => `<td style="mso-number-format:'@'; white-space:pre-wrap;">${excelEscape(cell)}</td>`).join("")}</tr>`).join("")
        : `<tr><td colspan="${Math.max(data.headers.length, 1)}">Sin registros.</td></tr>`;
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></body></html>`;
      const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `cuadro-mando-rrll-${data.filename}-${date}.xls`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    function exportCommitteeSessionExcel(sessionId) {
      exportExcelData(buildSingleSessionExcelData("committee", sessionId));
    }

    function exportParitariaSessionExcel(sessionId) {
      exportExcelData(buildSingleSessionExcelData("paritaria", sessionId));
    }

    function exportModuleExcel(type) {
      exportExcelData(buildExcelData(type));
    }

    window.buildTeleworkExcelData = buildTeleworkExcelData;
    window.exportExcelData = exportExcelData;

    let currentPrintHtml = "";

    function buildPrintHtml(type) {
      const data = buildPrintRows(type);
      const lastHeader = (type === "committeeSessions" || type === "paritariaSessions") ? "Puntos del orden del día" : "Avances";
      const emptyText = (type === "committeeSessions" || type === "paritariaSessions") ? "Sin sesiones." : "Sin registros pendientes o en curso.";
      const rowsHtml = data.rows.length
        ? data.rows.map((r, idx) => `<tr><td>${idx + 1}</td><td>${htmlEscapeForPrint(r.estado)}</td><td>${htmlEscapeForPrint(r.titulo)}</td><td>${r.detalle}</td><td>${r.avances}</td></tr>`).join("")
        : `<tr><td colspan="5">${emptyText}</td></tr>`;

      return `<h1>${htmlEscapeForPrint(data.title)}</h1><div class="date">Generado: ${new Date().toLocaleString("es-ES")}</div><table><thead><tr><th>#</th><th>Estado</th><th>Título</th><th>Detalle</th><th>${lastHeader}</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
    }

    function buildSingleSessionPrintHtml(kind, sessionId) {
      const isParitaria = kind === "paritaria";
      const sessions = isParitaria ? getParitariaSessions() : getCommitteeSessions();
      const session = sessions.find(s => s.id === sessionId);
      const label = isParitaria ? "Paritaria" : "Comité";
      if (!session) return `<h1>Sesión de ${label}</h1><p>Sesión no encontrada.</p>`;
      const items = isParitaria ? getParitariaSessionDisplayItems(session) : getCommitteeSessionDisplayItems(session);
      const rowsHtml = items.length
        ? items.map((item, idx) => `<tr><td>${idx + 1}</td><td>${htmlEscapeForPrint(item.title || "")}</td><td>${htmlEscapeForPrint(item.meta || "")}</td></tr>`).join("")
        : `<tr><td colspan="3">Sin puntos asignados.</td></tr>`;
      return `<h1>Sesión de ${label}: ${htmlEscapeForPrint(session.title || session.code || "Sesión")}</h1>
        <div class="date">Generado: ${new Date().toLocaleString("es-ES")}</div>
        <table><tbody>
          <tr><th>Código</th><td colspan="2">${htmlEscapeForPrint(session.code || "Sin código")}</td></tr>
          <tr><th>Fecha</th><td colspan="2">${htmlEscapeForPrint(session.date || session.rawDate || "Sin fecha")}</td></tr>
          <tr><th>Estado</th><td colspan="2">${session.status === "closed" ? "Histórico" : "Abierta"}</td></tr>
          <tr><th>Notas</th><td colspan="2">${htmlEscapeForPrint(session.notes || "Sin notas")}</td></tr>
        </tbody></table>
        <h2>Orden del día</h2>
        <table><thead><tr><th>#</th><th>Punto</th><th>Detalle</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
    }

    function openPrintPreviewWithHtml(html) {
      currentPrintHtml = html;
      const content = document.getElementById("printPreviewContent");
      const modal = document.getElementById("printPreviewModal");
      if (!content || !modal) return;
      content.innerHTML = `<div class="print-preview-document">${currentPrintHtml}</div>`;
      modal.classList.add("open");
    }

    function printCommitteeSession(sessionId) {
      openPrintPreviewWithHtml(buildSingleSessionPrintHtml("committee", sessionId));
    }

    function printParitariaSession(sessionId) {
      openPrintPreviewWithHtml(buildSingleSessionPrintHtml("paritaria", sessionId));
    }

    function printModule(type) {
      openPrintPreviewWithHtml(buildPrintHtml(type));
    }

    function closePrintPreview() {
      const modal = document.getElementById("printPreviewModal");
      if (modal) modal.classList.remove("open");
      const content = document.getElementById("printPreviewContent");
      if (content) content.textContent = "";
      currentPrintHtml = "";
    }

    function printPreview() {
      if (!currentPrintHtml) return;
      let frame = document.getElementById("printFrame");
      if (!frame) {
        frame = document.createElement("iframe");
        frame.id = "printFrame";
        frame.className = "hidden-print-frame";
        document.body.appendChild(frame);
      }

      const doc = frame.contentWindow.document;
      doc.open();
      doc.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Impresión</title><style>@page{size:A4;margin:14mm}body{font-family:Arial;color:#111827;background:#ffffff}h1{font-size:18px;border-bottom:3px solid #e93425;padding-bottom:8px}.date{font-size:11px;color:#666;margin-bottom:12px}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#343b46;color:#ffffff;text-align:left}th,td{border:1px solid #cbd5e1;padding:6px;vertical-align:top}td:first-child{width:24px;text-align:center}td:nth-child(2){width:90px}

    /* Panel lateral plegable */
    .dashboard-layout { transition: grid-template-columns 0.18s ease, gap 0.18s ease; }
    .sidebar-left { position: relative; }
    .sidebar-collapse-toggle { width:100%; margin-bottom:10px; background:#343b46; color:#ffffff; border-radius:4px; padding:8px 10px; font-size:12px; display:flex; align-items:center; justify-content:center; gap:6px; }
    .sidebar-collapse-toggle:hover { background:#303746; }
    .dashboard-layout.sidebar-collapsed { grid-template-columns:44px minmax(0,1fr) !important; gap:10px; }
    .dashboard-layout.sidebar-collapsed .sidebar-inner { display:none; }
    .dashboard-layout.sidebar-collapsed .sidebar-left { min-width:44px; width:44px; }
    .dashboard-layout.sidebar-collapsed .sidebar-collapse-toggle { min-height:150px; padding:10px 5px; writing-mode:vertical-rl; text-orientation:mixed; white-space:nowrap; }
    .dashboard-layout.sidebar-collapsed .sidebar-collapse-toggle .sidebar-toggle-symbol { writing-mode:horizontal-tb; }
    @media (max-width:1200px){ .dashboard-layout.sidebar-collapsed{ grid-template-columns:1fr !important; } .dashboard-layout.sidebar-collapsed .sidebar-left{ width:100%; } .dashboard-layout.sidebar-collapsed .sidebar-collapse-toggle{ writing-mode:horizontal-tb; min-height:0; } }

</style></head><body>${currentPrintHtml}</body></html>`);
      doc.close();
      frame.contentWindow.focus();
      frame.contentWindow.print();
    }
