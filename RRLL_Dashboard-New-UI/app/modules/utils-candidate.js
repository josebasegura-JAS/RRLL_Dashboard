/**
 * Fase 2.4 - Utilidades puras extraídas.
 *
 * Cambio controlado:
 * - Se carga desde dashboard.html antes de app.js y de los gestores.
 * - Expone funciones globales ya usadas por el código existente.
 * - No toca navegación, dashboard, SQLite, CSS ni renderizados.
 */
(function () {
  function normalizePriority(value) {
    return ["normal", "high", "critical"].includes(value) ? value : "normal";
  }

  function priorityLabel(value) {
    const labels = { normal: "Normal", high: "Alta", critical: "Crítica" };
    return labels[normalizePriority(value)] || "Normal";
  }

  function priorityBadgeHtml(value) {
    const normalized = normalizePriority(value);
    return `<span class="priority-badge priority-${normalized}">Prioridad: ${priorityLabel(normalized)}</span>`;
  }

  function formatDateValue(value) {
    if (!value) return "";
    return new Date(value + "T00:00:00").toLocaleDateString("es-ES");
  }

  function dueStatus(value) {
    if (!value) return { className: "", text: "Sin fecha límite", diffDays: null };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(value + "T00:00:00");
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    const readable = due.toLocaleDateString("es-ES");
    if (diffDays < 0) return { className: " expired", text: `Fecha límite: ${readable} · Vencida`, diffDays };
    if (diffDays === 0) return { className: " due-soon", text: `Fecha límite: ${readable} · Hoy`, diffDays };
    if (diffDays <= 5) return { className: " due-soon", text: `Fecha límite: ${readable} · Quedan ${diffDays} días`, diffDays };
    return { className: "", text: `Fecha límite: ${readable}`, diffDays };
  }

  function latestActivityDate(item) {
    const dates = [item.createdAt, item.closedAt].filter(Boolean);
    (item.updates || []).forEach(update => { if (update.createdAt) dates.push(update.createdAt); });
    if (!dates.length) return null;
    return dates.map(value => new Date(value)).sort((a, b) => b - a)[0];
  }

  function daysSince(date) {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return Math.floor((today - d) / (1000 * 60 * 60 * 24));
  }


  function normalizeUrl(url) {
    const value = String(url || "").trim();
    if (!value) return "#";
    if (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("mailto:") ||
      value.startsWith("ms-outlook:") ||
      value.startsWith("file://")
    ) {
      return value;
    }
    if (value.includes(".") && !value.includes(" ")) {
      return "https://" + value;
    }
    return value;
  }

  function openExternalUrl(url) {
    const normalized = normalizeUrl(url);
    if (!normalized || normalized === "#") return;
    window.open(normalized, "_blank", "noopener,noreferrer");
  }

  function itemSearchText(parts) {
    return parts.filter(Boolean).join(" ").toLowerCase();
  }

  function serializeBackupValue(value) {
    return typeof value === "string" ? value : JSON.stringify(value);
  }

  function parseBackupValue(value) {
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  function isRRLLKey(key) {
    return typeof key === "string" && key.startsWith("rrll_");
  }

  function isDeprecatedFixedTaskKey(key) {
    return key === "rrll_daily_task_names" ||
      key === "rrll_monthly_task_names" ||
      key.startsWith("rrll_daily_state_") ||
      key.startsWith("rrll_monthly_state_");
  }


  function normalizeDateInput(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    let year;
    let month;
    let day;

    const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    const es = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);

    if (iso) {
      year = Number(iso[1]);
      month = Number(iso[2]);
      day = Number(iso[3]);
    } else if (es) {
      day = Number(es[1]);
      month = Number(es[2]);
      year = Number(es[3]);
    } else {
      return null;
    }

    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function isValidDateInput(value) {
    return normalizeDateInput(value) !== null;
  }

  function formatSyncDate(value) {
    if (!value) return "Sin sincronizar";
    try {
      return new Date(value).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return String(value);
    }
  }

  function formatTrashDate(value) {
    if (!value) return "Sin fecha";
    return new Date(value).toLocaleString("es-ES");
  }

  window.normalizePriority = normalizePriority;
  window.priorityLabel = priorityLabel;
  window.priorityBadgeHtml = priorityBadgeHtml;
  window.formatDateValue = formatDateValue;
  window.dueStatus = dueStatus;
  window.latestActivityDate = latestActivityDate;
  window.daysSince = daysSince;
  window.normalizeUrl = normalizeUrl;
  window.openExternalUrl = openExternalUrl;
  window.itemSearchText = itemSearchText;
  window.serializeBackupValue = serializeBackupValue;
  window.parseBackupValue = parseBackupValue;
  window.isRRLLKey = isRRLLKey;
  window.isDeprecatedFixedTaskKey = isDeprecatedFixedTaskKey;
  window.normalizeDateInput = normalizeDateInput;
  window.isValidDateInput = isValidDateInput;
  window.formatSyncDate = formatSyncDate;
  window.formatTrashDate = formatTrashDate;
})();
