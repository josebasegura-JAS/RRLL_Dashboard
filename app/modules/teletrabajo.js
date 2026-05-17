// Fase 3.5: Gestor de Teletrabajo encapsulado como módulo independiente.
// Mantiene wrappers globales por compatibilidad con los onclick existentes del HTML.
(function () {
  'use strict';

  const KEY = "rrll_telework";
  const CAMPAIGN_KEY = "rrll_telework_selected_period";
  const JOB_CATALOG_KEY = "rrll_telework_job_catalog";
  const TELEWORK_NO_PERIOD = "Sin periodo";
  const STATUS_VALUES = ["telework-entry", "telework-processing", "telework-direction", "telework-approved", "telework-denied"];
  const VALIDATION_VALUES = ["Pendiente", "Sí", "No"];
  const RENEWAL_VALUES = ["Sí", "No", "No aplica"];
  const RENEWAL_VALIDATION_VALUES = ["Pendiente", "Sí", "No", "No aplica"];
  const DIRECTION_VALUES = ["Pendiente", "Aprobada", "Denegada"];
  const DAYS = ["Martes", "Miércoles", "Jueves"];
  const TELEWORK_JOB_CATALOG_HEADERS = [
    "Puesto Organizativo",
    "Dirección",
    "Unidad",
    "Plantilla",
    "Teletrabajo S/N",
    "Presencialidad mínima de personas por puesto para el normal funcionamiento de la unidad Puestos 2 o mas personas"
  ];

  let teleworkViewFilter = "all";
  let editingTeleworkId = null;
  let teleworkCatalogDraft = null;

  function getTeleworkItems() {
    const items = load(KEY, []);
    return Array.isArray(items) ? items.map(normalizeTeleworkItem) : [];
  }

  function setTeleworkItems(items) {
    save(KEY, Array.isArray(items) ? items.map(normalizeTeleworkItem) : []);
  }

  function currentTeleworkPeriod(date = new Date()) {
    const year = date.getFullYear();
    return `${year}-${year + 1}`;
  }

  function normalizeTeleworkPeriod(value) {
    const text = String(value || "").trim();
    if (!text) return TELEWORK_NO_PERIOD;
    const match = text.match(/(20\d{2})\s*[-\/]\s*(20\d{2})/);
    if (match) return `${match[1]}-${match[2]}`;
    const year = text.match(/20\d{2}/);
    if (year) {
      const start = Number(year[0]);
      return `${start}-${start + 1}`;
    }
    return text;
  }

  function getTeleworkCampaignInfo(date = new Date()) {
    const active = currentTeleworkPeriod(date);
    return { active, suggested: active, manual: false };
  }

  function getTeleworkActiveCampaign() {
    const active = getTeleworkCampaignInfo().active;
    const selected = normalizeTeleworkPeriod(String(load(CAMPAIGN_KEY, "") || "").trim());
    const selectedStart = teleworkCampaignStart(selected);
    const activeStart = teleworkCampaignStart(active);
    return Number.isFinite(selectedStart) && selectedStart >= activeStart ? selected : active;
  }

  function setTeleworkActiveCampaign(period) {
    save(CAMPAIGN_KEY, normalizeTeleworkPeriod(period));
  }

  function teleworkCampaignStart(period) {
    const match = String(period || "").match(/^(20\d{2})-(20\d{2})$/);
    return match ? Number(match[1]) : -Infinity;
  }

  function compareTeleworkCampaignsDesc(a, b) {
    return teleworkCampaignStart(b) - teleworkCampaignStart(a) || String(b).localeCompare(String(a), "es");
  }

  function getTeleworkActiveHistoryBoundary() {
    return teleworkCampaignStart(getTeleworkCampaignInfo().active);
  }

  function isTeleworkHistoricalCampaign(period) {
    const start = teleworkCampaignStart(normalizeTeleworkPeriod(period));
    if (!Number.isFinite(start)) return false;
    return start < getTeleworkActiveHistoryBoundary();
  }

  function isTeleworkFutureCampaign(period) {
    const start = teleworkCampaignStart(normalizeTeleworkPeriod(period));
    if (!Number.isFinite(start)) return false;
    return start > getTeleworkActiveHistoryBoundary();
  }

  function getTeleworkDuplicateKey(item) {
    const employeeNumber = String(item?.employeeNumber || "").trim().toLowerCase();
    const period = normalizeTeleworkPeriod(item?.period);
    return employeeNumber && period !== TELEWORK_NO_PERIOD ? `${employeeNumber}::${period}` : "";
  }

  function getTeleworkJobCatalog() {
    const items = load(JOB_CATALOG_KEY, []);
    return Array.isArray(items) ? items.map(normalizeTeleworkCatalogItem).filter(item => item.jobKey) : [];
  }

  function setTeleworkJobCatalog(items) {
    save(JOB_CATALOG_KEY, Array.isArray(items) ? items.map(normalizeTeleworkCatalogItem).filter(item => item.jobKey) : []);
  }

  function parseCatalogEligibility(value) {
    const text = normalizeTeleworkLookup(value);
    if (!text) return true;
    if (["no", "n", "false", "0", "noapto", "noapta", "noelegible", "excluido"].includes(text)) return false;
    return true;
  }

  function parseTeleworkCatalogNumber(value) {
    const raw = String(value ?? "").replace(/,/g, ".").trim();
    if (!raw) return "";
    const number = Number(raw);
    return Number.isFinite(number) ? number : String(value ?? "").trim();
  }

  function normalizeTeleworkSN(value, fallback = "") {
    const text = normalizeTeleworkLookup(value).replace(/[^a-z0-9]/g, "");
    if (["s", "si", "sí", "true", "1", "x", "ok", "apto", "apta", "teletrabajable"].includes(text)) return "S";
    if (["n", "no", "false", "0", "noapto", "noapta", "noelegible", "excluido"].includes(text)) return "N";
    return fallback;
  }

  function normalizeTeleworkCatalogItem(item) {
    const source = item && typeof item === "object" ? item : {};
    const puestoOrganizativo = String(source.puestoOrganizativo || source.job || source.puesto || source["Puesto Organizativo"] || source["Puesto"] || "").trim();
    const teletrabajoSN = normalizeTeleworkSN(source.teletrabajoSN ?? source.teletrabajo ?? source.eligible ?? source.elegible ?? source.apto ?? source["Teletrabajo S/N"] ?? source["Elegible"], parseCatalogEligibility(source.eligible ?? source.elegible ?? source.apto ?? source["Elegible"]) ? "S" : "N");
    const normalized = {
      puestoOrganizativo,
      direccion: String(source.direccion || source["Dirección"] || source.direccionArea || "").trim(),
      unidad: String(source.unidad || source["Unidad"] || "").trim(),
      plantilla: parseTeleworkCatalogNumber(source.plantilla ?? source["Plantilla"]),
      teletrabajoSN,
      presencialidadMinima: parseTeleworkCatalogNumber(source.presencialidadMinima ?? source.presencialidad ?? source["Presencialidad mínima"] ?? source["Presencialidad minima"]),
      jobKey: normalizeTeleworkLookup(puestoOrganizativo),
      eligible: teletrabajoSN !== "N",
      warning: String(source.warning || source.advertencia || source.observations || source.observaciones || "").trim()
    };
    normalized.job = normalized.puestoOrganizativo;
    return normalized;
  }

  function getTeleworkJobEligibility(job) {
    const key = normalizeTeleworkLookup(job);
    if (!key) return { eligible: true, warnings: [] };
    const match = getTeleworkJobCatalog().find(item => item.jobKey === key || key.includes(item.jobKey) || item.jobKey.includes(key));
    if (!match) return { eligible: true, warnings: [] };
    const warnings = [];
    if (!match.eligible) warnings.push("Puesto marcado como no elegible en el catálogo.");
    if (match.warning) warnings.push(match.warning);
    return { eligible: match.eligible, warnings };
  }

  function getTeleworkCatalogMatchByJob(job, catalog = getTeleworkJobCatalog()) {
    const key = normalizeTeleworkLookup(job);
    if (!key) return null;
    return catalog.find(item => item.jobKey === key) || null;
  }

  function buildTeleworkRequestCountByJob(items) {
    return items.reduce((acc, item) => {
      if (item.status === "telework-denied") return acc;
      const key = normalizeTeleworkLookup(item.job);
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function toTeleworkNumericValue(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const text = String(value ?? "").replace(/,/g, ".").trim();
    if (!text) return null;
    const number = Number(text);
    return Number.isFinite(number) ? number : null;
  }

  function getTeleworkPositionIndicator(item, context = {}) {
    const catalog = context.catalog || getTeleworkJobCatalog();
    const countsByJob = context.countsByJob || buildTeleworkRequestCountByJob(getTeleworkVisibleItems());
    const key = normalizeTeleworkLookup(item.job);
    const match = getTeleworkCatalogMatchByJob(item.job, catalog);
    if (!key || !match || match.teletrabajoSN === "N" || !match.eligible) {
      return {
        status: "error",
        className: "telework-status-dot telework-status-dot--error",
        symbol: "",
        label: "Puesto no encontrado en catálogo o no teletrabajable"
      };
    }

    const plantilla = toTeleworkNumericValue(match.plantilla);
    const presencialidadMinima = toTeleworkNumericValue(match.presencialidadMinima);
    if (plantilla === null || presencialidadMinima === null) {
      return {
        status: "ok",
        className: "telework-status-dot telework-status-dot--ok",
        symbol: "",
        label: "Puesto teletrabajable dentro del límite permitido"
      };
    }

    const maximumAllowed = plantilla - presencialidadMinima;
    const requests = countsByJob[key] || 0;
    if (requests > maximumAllowed) {
      return {
        status: "warning",
        className: "telework-status-dot telework-status-dot--warning",
        symbol: "!",
        label: "Solicitudes para este puesto por encima del límite permitido"
      };
    }

    return {
      status: "ok",
      className: "telework-status-dot telework-status-dot--ok",
      symbol: "",
      label: "Puesto teletrabajable dentro del límite permitido"
    };
  }

  function renderTeleworkPositionIndicator(item, context) {
    const indicator = getTeleworkPositionIndicator(item, context);
    return `<span class="${indicator.className}" title="${escapeHtml(indicator.label)}" aria-label="${escapeHtml(indicator.label)}" role="img">${escapeHtml(indicator.symbol)}</span>`;
  }

  function pick(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
  }

  function validationFromLegacy(value) {
    if (value === true || value === "Sí") return "Sí";
    if (value === "No") return "No";
    return "Pendiente";
  }

  function normalizeDays(days) {
    return Array.isArray(days) ? days.filter(day => DAYS.includes(day)) : [];
  }

  function normalizeTeleworkItem(item) {
    const source = item && typeof item === "object" ? item : {};
    const hasNewFlowFields = ["presenceValidation", "favorableReport", "directionValidation", "period", "observations"].some(field => Object.prototype.hasOwnProperty.call(source, field));
    const directionValidation = pick(source.directionValidation, DIRECTION_VALUES, source.status === "telework-approved" ? "Aprobada" : source.status === "telework-denied" ? "Denegada" : "Pendiente");
    const normalized = {
      ...source,
      id: source.id || ((window.crypto && typeof window.crypto.randomUUID === "function") ? window.crypto.randomUUID() : `telework-${Date.now()}-${Math.random().toString(36).slice(2)}`),
      employeeNumber: String(source.employeeNumber || "").trim(),
      name: String(source.name || "").trim(),
      job: String(source.job || "").trim(),
      period: normalizeTeleworkPeriod(source.period || source.periodo || source.campaign || source.campaña),
      type: source.type === "Renovación" ? "Renovación" : "Nuevo",
      days: normalizeDays(source.days),
      presenceValidation: validationFromLegacy(source.presenceValidation),
      favorableReport: validationFromLegacy(source.favorableReport ?? source.managerApproval),
      security: validationFromLegacy(source.security),
      prevention: validationFromLegacy(source.prevention),
      previousYearTeleworked: pick(source.previousYearTeleworked, RENEWAL_VALUES, "No aplica"),
      unitHeadRepeatValidation: pick(source.unitHeadRepeatValidation, RENEWAL_VALIDATION_VALUES, "No aplica"),
      directionValidation,
      resolutionDate: source.resolutionDate || (directionValidation !== "Pendiente" && source.resolvedAt ? String(source.resolvedAt).slice(0, 10) : ""),
      observations: String(source.observations || ""),
      observationHistory: Array.isArray(source.observationHistory) ? source.observationHistory : [],
      createdAt: source.createdAt || new Date().toISOString(),
      updatedAt: source.updatedAt || source.createdAt || null,
      resolvedAt: source.resolvedAt || null,
      statusManual: source.statusManual === true || (source.statusManual !== false && !hasNewFlowFields && STATUS_VALUES.includes(source.status))
    };
    normalized.status = STATUS_VALUES.includes(source.status) ? source.status : calculateTeleworkStatus(normalized);
    if (!normalized.statusManual) normalized.status = calculateTeleworkStatus(normalized);
    return normalized;
  }

  function calculateTeleworkStatus(item) {
    if (item.directionValidation === "Aprobada") return "telework-approved";
    if (item.directionValidation === "Denegada") return "telework-denied";

    const principal = [item.presenceValidation, item.favorableReport, item.security, item.prevention];
    const allPending = principal.every(value => value === "Pendiente") && item.directionValidation === "Pendiente";
    if (allPending) return "telework-entry";
    if (principal.every(value => value === "Sí") && item.directionValidation === "Pendiente") return "telework-direction";
    if (principal.some(value => value === "Pendiente")) return "telework-processing";
    return "telework-processing";
  }

  function teleworkStatusLabel(status) {
    const labels = {
      "telework-entry": "Solicitud recibida",
      "telework-processing": "Validaciones pendientes",
      "telework-direction": "Pendiente Dirección",
      "telework-approved": "Aprobada",
      "telework-denied": "Denegada"
    };
    return labels[status] || "Solicitud recibida";
  }

  function teleworkStatusClass(status) {
    const classes = {
      "telework-entry": "pending",
      "telework-processing": "progress",
      "telework-direction": "direction",
      "telework-approved": "closed",
      "telework-denied": "danger"
    };
    return classes[status] || "pending";
  }

  function refreshTeleworkDependents() {
    renderTelework();
    if (typeof updateQuickCounts === "function") updateQuickCounts();
    if (typeof renderHomeDashboard === "function") renderHomeDashboard();
    if (typeof renderTrash === "function") renderTrash();
    if (typeof restoreAlertsPanelState === "function") restoreAlertsPanelState();
    if (typeof renderAlertsPanel === "function") renderAlertsPanel();
    if (typeof applyAllClosedColumnStates === "function") applyAllClosedColumnStates();
    if (typeof refreshDatabaseInfo === "function") refreshDatabaseInfo();
  }

  function toggleTeleworkCreateForm(forceOpen) {
    const form = document.getElementById("teleworkCreateForm");
    if (!form) return;
    const open = typeof forceOpen === "boolean" ? forceOpen : form.classList.contains("rrll-create-form-collapsed");
    form.classList.toggle("rrll-create-form-collapsed", !open);
    if (open) {
      const periodEl = document.getElementById("newTeleworkPeriod");
      if (periodEl && !periodEl.value) periodEl.value = getTeleworkActiveCampaign();
      setTimeout(() => document.getElementById("newTeleworkEmployeeNumber")?.focus(), 0);
    }
  }

  function getPlantillaForTelework() {
    try {
      if (typeof getPlantilla !== "function") return [];
      const items = getPlantilla();
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  function normalizeTeleworkLookup(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function findPlantillaByEmployeeNumber(value) {
    const target = String(value || "").trim();
    if (!target) return null;
    return getPlantillaForTelework().find(person => String(person.employeeNumber || "").trim() === target) || null;
  }

  function fillTeleworkPerson(person, prefix = "new") {
    if (!person) return;
    const employeeEl = document.getElementById(`${prefix}TeleworkEmployeeNumber`);
    const nameEl = document.getElementById(`${prefix}TeleworkName`);
    const jobEl = document.getElementById(`${prefix}TeleworkJob`);
    if (employeeEl) employeeEl.value = person.employeeNumber || "";
    if (nameEl) nameEl.value = person.name || "";
    if (jobEl) jobEl.value = person.job || "";
    renderTeleworkEligibilityWarning(prefix);
    hideTeleworkSuggestions(prefix);
  }

  function teleworkEmployeeNumberChanged(prefix = "new") {
    const employeeEl = document.getElementById(`${prefix}TeleworkEmployeeNumber`);
    if (!employeeEl) return;
    const person = findPlantillaByEmployeeNumber(employeeEl.value);
    if (person) fillTeleworkPerson(person, prefix);
  }

  function hideTeleworkSuggestions(prefix = "new") {
    const box = document.getElementById(`${prefix}TeleworkPersonSuggestions`);
    if (!box) return;
    box.classList.remove("open");
    box.innerHTML = "";
  }

  function hideTeleworkSuggestionsDelayed(prefix = "new") {
    setTimeout(() => hideTeleworkSuggestions(prefix), 180);
  }

  function teleworkNameAutocomplete(prefix = "new") {
    const input = document.getElementById(`${prefix}TeleworkName`);
    const box = document.getElementById(`${prefix}TeleworkPersonSuggestions`);
    if (!input || !box) return;
    const query = normalizeTeleworkLookup(input.value);
    if (query.length < 2) {
      hideTeleworkSuggestions(prefix);
      return;
    }
    const results = getPlantillaForTelework()
      .filter(person => {
        const name = normalizeTeleworkLookup(person.name);
        const employee = normalizeTeleworkLookup(person.employeeNumber);
        const job = normalizeTeleworkLookup(person.job);
        return name.includes(query) || employee.includes(query) || job.includes(query);
      })
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" }))
      .slice(0, 8);

    if (!results.length) {
      box.innerHTML = `<div class="rrll-autocomplete-empty">Sin coincidencias en Plantilla. Puedes continuar con entrada manual.</div>`;
      box.classList.add("open");
      return;
    }

    box.innerHTML = results.map(person => `
      <button type="button" class="rrll-autocomplete-option" onmousedown="event.preventDefault(); selectTeleworkPerson('${escapeJs(String(person.id || ""))}', '${prefix}')">
        <strong>${escapeHtml(person.name || "Sin nombre")}</strong>
        <span>Nº ${escapeHtml(person.employeeNumber || "")} · ${escapeHtml(person.job || "Sin puesto")}</span>
      </button>
    `).join("");
    box.classList.add("open");
  }

  function selectTeleworkPerson(personId, prefix = "new") {
    const person = getPlantillaForTelework().find(item => String(item.id) === String(personId));
    if (person) fillTeleworkPerson(person, prefix);
  }

  function readDays(prefix) {
    return DAYS.filter(day => document.getElementById(`${prefix}Telework${day}`)?.checked);
  }

  function setDays(prefix, days) {
    DAYS.forEach(day => {
      const el = document.getElementById(`${prefix}Telework${day}`);
      if (el) el.checked = Array.isArray(days) && days.includes(day);
    });
  }

  function readTeleworkForm(prefix, previousItem = null) {
    const employeeNumber = (document.getElementById(`${prefix}TeleworkEmployeeNumber`)?.value || "").trim();
    const nameEl = document.getElementById(`${prefix}TeleworkName`);
    const matchedPerson = findPlantillaByEmployeeNumber(employeeNumber);
    if (matchedPerson) {
      if (!String(nameEl?.value || "").trim()) nameEl.value = matchedPerson.name || "";
      const jobEl = document.getElementById(`${prefix}TeleworkJob`);
      if (jobEl && !jobEl.value.trim()) jobEl.value = matchedPerson.job || "";
    }
    const name = (nameEl?.value || "").trim();
    const job = (document.getElementById(`${prefix}TeleworkJob`)?.value || "").trim();
    if (!employeeNumber || !name) {
      alert("Introduce al menos número de empleado y solicitante.");
      return null;
    }

    const now = new Date().toISOString();
    const observations = String(document.getElementById(`${prefix}TeleworkObservations`)?.value || "");
    const observationHistory = Array.isArray(previousItem?.observationHistory) ? [...previousItem.observationHistory] : [];
    if (previousItem && observations !== String(previousItem.observations || "")) {
      observationHistory.unshift({ createdAt: now, text: observations });
    } else if (!previousItem && observations.trim()) {
      observationHistory.unshift({ createdAt: now, text: observations });
    }

    const directionValidation = pick(document.getElementById(`${prefix}TeleworkDirectionValidation`)?.value, DIRECTION_VALUES, "Pendiente");
    const resolutionDate = document.getElementById(`${prefix}TeleworkResolutionDate`)?.value || (directionValidation !== "Pendiente" ? now.slice(0, 10) : "");
    const manualStatus = document.getElementById(`${prefix}TeleworkStatus`)?.value || "auto";

    const draft = normalizeTeleworkItem({
      ...(previousItem || {}),
      employeeNumber,
      name,
      job,
      period: normalizeTeleworkPeriod(document.getElementById(`${prefix}TeleworkPeriod`)?.value || getTeleworkActiveCampaign()),
      type: document.getElementById(`${prefix}TeleworkType`)?.value || "Nuevo",
      days: readDays(prefix),
      presenceValidation: pick(document.getElementById(`${prefix}TeleworkPresenceValidation`)?.value, VALIDATION_VALUES, "Pendiente"),
      favorableReport: pick(document.getElementById(`${prefix}TeleworkFavorableReport`)?.value, VALIDATION_VALUES, "Pendiente"),
      security: pick(document.getElementById(`${prefix}TeleworkSecurity`)?.value, VALIDATION_VALUES, "Pendiente"),
      prevention: pick(document.getElementById(`${prefix}TeleworkPrevention`)?.value, VALIDATION_VALUES, "Pendiente"),
      previousYearTeleworked: pick(document.getElementById(`${prefix}TeleworkPreviousYear`)?.value, RENEWAL_VALUES, "No aplica"),
      unitHeadRepeatValidation: pick(document.getElementById(`${prefix}TeleworkUnitHeadRepeat`)?.value, RENEWAL_VALIDATION_VALUES, "No aplica"),
      directionValidation,
      resolutionDate,
      observations,
      observationHistory,
      createdAt: previousItem?.createdAt || now,
      updatedAt: previousItem ? now : null,
      resolvedAt: directionValidation !== "Pendiente" ? (previousItem?.resolvedAt || now) : null,
      statusManual: manualStatus !== "auto"
    });
    draft.status = manualStatus === "auto" ? calculateTeleworkStatus(draft) : pick(manualStatus, STATUS_VALUES, calculateTeleworkStatus(draft));
    return draft;
  }

  function resetTeleworkCreateForm() {
    ["EmployeeNumber", "Name", "Job", "Observations"].forEach(field => {
      const el = document.getElementById(`newTelework${field}`);
      if (el) el.value = "";
    });
    const periodEl = document.getElementById("newTeleworkPeriod");
    if (periodEl) periodEl.value = getTeleworkActiveCampaign();
    const typeEl = document.getElementById("newTeleworkType");
    if (typeEl) typeEl.value = "Nuevo";
    setDays("new", []);
    ["PresenceValidation", "FavorableReport", "Security", "Prevention", "DirectionValidation"].forEach(field => {
      const el = document.getElementById(`newTelework${field}`);
      if (el) el.value = "Pendiente";
    });
    const previousEl = document.getElementById("newTeleworkPreviousYear");
    if (previousEl) previousEl.value = "No aplica";
    const unitEl = document.getElementById("newTeleworkUnitHeadRepeat");
    if (unitEl) unitEl.value = "No aplica";
    const resolutionEl = document.getElementById("newTeleworkResolutionDate");
    if (resolutionEl) resolutionEl.value = "";
    hideTeleworkSuggestions("new");
  }

  function addTelework() {
    const draft = readTeleworkForm("new");
    if (!draft) return;
    const items = getTeleworkItems();
    const duplicateKey = getTeleworkDuplicateKey(draft);
    const duplicate = duplicateKey ? items.find(item => getTeleworkDuplicateKey(item) === duplicateKey) : null;
    if (duplicate) {
      const message = `Ya existe una solicitud para Nº empleado ${draft.employeeNumber} en la campaña ${draft.period}. Abre la solicitud existente para editarla o confirma si quieres crear un duplicado manual.`;
      if (!confirm(message)) return;
    }
    const id = (window.crypto && typeof window.crypto.randomUUID === "function") ? window.crypto.randomUUID() : String(Date.now());
    items.unshift({ ...draft, id });
    setTeleworkItems(items);
    resetTeleworkCreateForm();
    toggleTeleworkCreateForm(false);
    refreshTeleworkDependents();
  }

  function executeMoveTeleworkToProcessing(id) {
    setTeleworkItems(getTeleworkItems().map(item => item.id === id ? { ...item, status: "telework-processing", statusManual: true, updatedAt: new Date().toISOString() } : item));
    refreshTeleworkDependents();
  }

  function moveTeleworkToProcessing(id) {
    const item = getTeleworkItems().find(entry => entry.id === id);
    const title = item && item.name ? `“${item.name}”` : "esta solicitud";
    if (typeof confirmDangerAction === "function") {
      confirmDangerAction({
        title: "Cambiar estado de solicitud",
        message: `¿Quieres cambiar el estado de ${title} a validaciones pendientes?`,
        confirmLabel: "Cambiar estado",
        onConfirm: () => executeMoveTeleworkToProcessing(id)
      });
      return;
    }
    executeMoveTeleworkToProcessing(id);
  }

  function setTeleworkCheck(id, field, value) {
    setTeleworkItems(getTeleworkItems().map(item => {
      if (item.id !== id) return item;
      const updated = normalizeTeleworkItem({ ...item, [field]: value, updatedAt: new Date().toISOString(), statusManual: false });
      updated.status = calculateTeleworkStatus(updated);
      return updated;
    }));
    refreshTeleworkDependents();
  }

  function executeResolveTelework(id, status) {
    if (!["telework-approved", "telework-denied"].includes(status)) return;
    const directionValidation = status === "telework-denied" ? "Denegada" : "Aprobada";
    const now = new Date().toISOString();
    setTeleworkItems(getTeleworkItems().map(item => item.id === id ? normalizeTeleworkItem({
      ...item,
      directionValidation,
      resolutionDate: item.resolutionDate || now.slice(0, 10),
      resolvedAt: now,
      statusManual: false,
      updatedAt: now
    }) : item));
    refreshTeleworkDependents();
  }

  function resolveTelework(id, status) {
    if (!["telework-approved", "telework-denied"].includes(status)) return;
    const item = getTeleworkItems().find(entry => entry.id === id);
    const title = item && item.name ? `“${item.name}”` : "esta solicitud";
    const nextStatus = teleworkStatusLabel(status).toLowerCase();
    if (typeof confirmDangerAction === "function") {
      confirmDangerAction({
        title: "Cambiar estado de teletrabajo",
        message: `¿Quieres cambiar el estado de ${title} a ${nextStatus}?`,
        confirmLabel: "Cambiar estado",
        onConfirm: () => executeResolveTelework(id, status)
      });
      return;
    }
    executeResolveTelework(id, status);
  }

  function executeDeleteTelework(id) {
    const items = getTeleworkItems();
    const item = items.find(i => i.id === id);
    if (item && typeof moveToTrash === "function") moveToTrash("telework", item);
    setTeleworkItems(items.filter(i => i.id !== id));
    refreshTeleworkDependents();
  }

  function deleteTelework(id) {
    const item = getTeleworkItems().find(i => i.id === id);
    const title = item && item.name ? `“${item.name}”` : "esta solicitud";
    if (typeof confirmDangerAction === "function") {
      confirmDangerAction({
        title: "Eliminar solicitud de teletrabajo",
        message: `¿Quieres eliminar ${title}? Se enviará a la papelera.`,
        confirmLabel: "Eliminar",
        onConfirm: () => executeDeleteTelework(id)
      });
      return;
    }
    executeDeleteTelework(id);
  }

  function setTeleworkViewFilter(filter) {
    teleworkViewFilter = ["all", ...STATUS_VALUES].includes(filter) ? filter : "all";
    renderTelework();
  }

  function teleworkMatchesQuery(item, query) {
    if (!query) return true;
    return itemSearchText([
      item.name,
      item.employeeNumber,
      item.job,
      item.period,
      item.type,
      teleworkStatusLabel(item.status),
      item.presenceValidation,
      item.favorableReport,
      item.security,
      item.prevention,
      item.previousYearTeleworked,
      item.unitHeadRepeatValidation,
      item.directionValidation,
      item.observations,
      ...(item.days || [])
    ]).includes(query);
  }

  function validationSelectHtml(id, field, value, options = VALIDATION_VALUES) {
    return `<select aria-label="${escapeHtml(field)}" onchange="setTeleworkCheck('${escapeJs(id)}', '${field}', this.value)">${options.map(option => `<option value="${option}" ${value === option ? "selected" : ""}>${option}</option>`).join("")}</select>`;
  }

  function validationSummary(item) {
    const validations = [
      ["Presencialidad", item.presenceValidation],
      ["Informe", item.favorableReport],
      ["Seguridad", item.security],
      ["Prevención", item.prevention],
      ["Dirección", item.directionValidation]
    ];
    return `<div class="telework-validation-summary">${validations.map(([label, value]) => `<span class="telework-validation-chip validation-${normalizeTeleworkLookup(value).replace(/\s+/g, '-')}">${escapeHtml(label)}: ${escapeHtml(value)}</span>`).join("")}</div>`;
  }

  function observationsPreview(text) {
    const clean = String(text || "").trim();
    if (!clean) return "Sin observaciones";
    return clean.length > 150 ? `${clean.slice(0, 150)}…` : clean;
  }

  function ensureTeleworkEditModal() {
    let modal = document.getElementById("teleworkEditModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "teleworkEditModal";
    modal.className = "modal-backdrop telework-edit-modal";
    modal.innerHTML = `
      <div class="modal-box rrll-pro-modal-box telework-modal-box">
        <div class="modal-header">
          <h3>Editar solicitud de teletrabajo</h3>
          <button type="button" class="icon-button" onclick="closeTeleworkEditModal()">×</button>
        </div>
        <div class="rrll-pro-task-form rrll-pro-edit-form telework-professional-form">
          ${teleworkFormBlocks("edit")}
        </div>
        <div class="modal-actions telework-sticky-actions">
          <button type="button" class="secondary" onclick="closeTeleworkEditModal()">Cancelar</button>
          <button type="button" class="danger" onclick="deleteEditingTelework()">Eliminar</button>
          <button type="button" class="primary" onclick="saveEditingTelework()">Guardar cambios</button>
        </div>
      </div>`;
    modal.addEventListener("click", event => {
      if (event.target === modal) closeTeleworkEditModal();
    });
    document.body.appendChild(modal);
    return modal;
  }

  function teleworkFormBlocks(prefix) {
    const isEdit = prefix === "edit";
    return `
      <fieldset class="telework-form-section">
        <legend>Datos persona</legend>
        <label class="rrll-pro-field">
          <span>Nº empleado</span>
          <input id="${prefix}TeleworkEmployeeNumber" placeholder="Ej. 12345" oninput="teleworkEmployeeNumberChanged('${prefix}')" onblur="teleworkEmployeeNumberChanged('${prefix}')" />
        </label>
        <label class="rrll-pro-field rrll-autocomplete-field">
          <span>Solicitante</span>
          <input id="${prefix}TeleworkName" placeholder="Empieza a escribir para buscar en Plantilla" autocomplete="off" oninput="teleworkNameAutocomplete('${prefix}')" onfocus="teleworkNameAutocomplete('${prefix}')" onblur="hideTeleworkSuggestionsDelayed('${prefix}')" />
          <div id="${prefix}TeleworkPersonSuggestions" class="rrll-autocomplete-list" role="listbox"></div>
        </label>
        <label class="rrll-pro-field">
          <span>Puesto de trabajo</span>
          <input id="${prefix}TeleworkJob" placeholder="Puesto snapshot de la solicitud" oninput="renderTeleworkEligibilityWarning('${prefix}')" />
        </label>
        <div id="${prefix}TeleworkEligibilityWarning" class="telework-eligibility-warning" aria-live="polite"></div>
      </fieldset>
      <fieldset class="telework-form-section">
        <legend>Solicitud</legend>
        <label class="rrll-pro-field">
          <span>Periodo / campaña</span>
          <input id="${prefix}TeleworkPeriod" placeholder="Ej. 2025-2026" />
        </label>
        <label class="rrll-pro-field">
          <span>Tipo de solicitud</span>
          <select id="${prefix}TeleworkType"><option>Nuevo</option><option>Renovación</option></select>
        </label>
        <div class="rrll-pro-field rrll-pro-field-full rrll-pro-days-field">
          <span>Días solicitados</span>
          <div class="rrll-pro-checks rrll-pro-inline-checks">
            ${DAYS.map(day => `<label><input id="${prefix}Telework${day}" type="checkbox" /> ${day}</label>`).join("")}
          </div>
        </div>
      </fieldset>
      <fieldset class="telework-form-section">
        <legend>Validaciones</legend>
        ${teleworkSelectField(prefix, "PresenceValidation", "Cumplimiento condiciones presencialidad", VALIDATION_VALUES)}
        ${teleworkSelectField(prefix, "FavorableReport", "Informe favorable", VALIDATION_VALUES)}
        ${teleworkSelectField(prefix, "Security", "Seguridad Informática", VALIDATION_VALUES)}
        ${teleworkSelectField(prefix, "Prevention", "Prevención", VALIDATION_VALUES)}
      </fieldset>
      <fieldset class="telework-form-section">
        <legend>Renovación</legend>
        ${teleworkSelectField(prefix, "PreviousYear", "Año anterior teletrabajado", RENEWAL_VALUES)}
        ${teleworkSelectField(prefix, "UnitHeadRepeat", "Validación Jefatura de Unidad a repetir", RENEWAL_VALIDATION_VALUES)}
      </fieldset>
      <fieldset class="telework-form-section">
        <legend>Resolución</legend>
        ${teleworkSelectField(prefix, "DirectionValidation", "Validación ordinaria de la Dirección", DIRECTION_VALUES)}
        <label class="rrll-pro-field">
          <span>Fecha resolución</span>
          <input id="${prefix}TeleworkResolutionDate" type="date" />
        </label>
        ${isEdit ? `<label class="rrll-pro-field"><span>Estado manual (opcional)</span><select id="${prefix}TeleworkStatus"><option value="auto">Automático según validaciones</option>${STATUS_VALUES.map(status => `<option value="${status}">${teleworkStatusLabel(status)}</option>`).join("")}</select></label>` : ""}
      </fieldset>
      <fieldset class="telework-form-section telework-observations-section">
        <legend>Observaciones</legend>
        <label class="rrll-pro-field rrll-pro-field-full">
          <span>Observaciones editables</span>
          <textarea id="${prefix}TeleworkObservations" placeholder="Observaciones, seguimiento, incidencias o contexto de la solicitud"></textarea>
        </label>
        ${isEdit ? `<div id="editTeleworkObservationHistory" class="telework-observation-history"></div>` : ""}
      </fieldset>`;
  }

  function teleworkSelectField(prefix, suffix, label, options) {
    return `<label class="rrll-pro-field"><span>${label}</span><select id="${prefix}Telework${suffix}">${options.map(option => `<option value="${option}">${option}</option>`).join("")}</select></label>`;
  }

  function openTeleworkEditModal(id) {
    const item = getTeleworkItems().find(entry => entry.id === id);
    if (!item) return;
    editingTeleworkId = id;
    const modal = ensureTeleworkEditModal();
    document.getElementById("editTeleworkEmployeeNumber").value = item.employeeNumber || "";
    document.getElementById("editTeleworkName").value = item.name || "";
    document.getElementById("editTeleworkJob").value = item.job || "";
    renderTeleworkEligibilityWarning("edit");
    document.getElementById("editTeleworkPeriod").value = item.period || "";
    document.getElementById("editTeleworkType").value = item.type || "Nuevo";
    setDays("edit", item.days);
    document.getElementById("editTeleworkPresenceValidation").value = item.presenceValidation || "Pendiente";
    document.getElementById("editTeleworkFavorableReport").value = item.favorableReport || "Pendiente";
    document.getElementById("editTeleworkSecurity").value = item.security || "Pendiente";
    document.getElementById("editTeleworkPrevention").value = item.prevention || "Pendiente";
    document.getElementById("editTeleworkPreviousYear").value = item.previousYearTeleworked || "No aplica";
    document.getElementById("editTeleworkUnitHeadRepeat").value = item.unitHeadRepeatValidation || "No aplica";
    document.getElementById("editTeleworkDirectionValidation").value = item.directionValidation || "Pendiente";
    document.getElementById("editTeleworkResolutionDate").value = item.resolutionDate || "";
    document.getElementById("editTeleworkObservations").value = item.observations || "";
    document.getElementById("editTeleworkStatus").value = item.statusManual ? item.status : "auto";
    renderTeleworkObservationHistory(item);
    modal.classList.add("open");
    setTimeout(() => document.getElementById("editTeleworkEmployeeNumber")?.focus(), 0);
  }

  function renderTeleworkObservationHistory(item) {
    const box = document.getElementById("editTeleworkObservationHistory");
    if (!box) return;
    const history = Array.isArray(item.observationHistory) ? item.observationHistory : [];
    if (!history.length) {
      box.innerHTML = `<p class="muted">Historial: se generará al guardar observaciones.</p>`;
      return;
    }
    box.innerHTML = `<strong>Historial de observaciones</strong>${history.slice(0, 6).map(entry => `<div class="telework-history-entry"><span>${escapeHtml(formatTeleworkDateTime(entry.createdAt))}</span><p>${escapeHtml(entry.text || "")}</p></div>`).join("")}`;
  }

  function closeTeleworkEditModal() {
    const modal = document.getElementById("teleworkEditModal");
    if (modal) modal.classList.remove("open");
    editingTeleworkId = null;
  }

  function teleworkEditEmployeeNumberChanged() {
    teleworkEmployeeNumberChanged("edit");
  }

  function saveEditingTelework() {
    if (!editingTeleworkId) return;
    const previous = getTeleworkItems().find(item => item.id === editingTeleworkId);
    const draft = readTeleworkForm("edit", previous);
    if (!draft) return;
    setTeleworkItems(getTeleworkItems().map(item => item.id === editingTeleworkId ? { ...draft, id: editingTeleworkId } : item));
    closeTeleworkEditModal();
    refreshTeleworkDependents();
  }

  function deleteEditingTelework() {
    if (!editingTeleworkId) return;
    const id = editingTeleworkId;
    closeTeleworkEditModal();
    deleteTelework(id);
  }

  function formatTeleworkDateTime(value) {
    if (!value) return "Sin fecha";
    try { return new Date(value).toLocaleString("es-ES"); } catch { return "Sin fecha"; }
  }

  function renderTeleworkCard(rawItem) {
    const item = normalizeTeleworkItem(rawItem);
    const created = item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-ES") : "Sin fecha";
    const daysHtml = item.days.length
      ? item.days.map(day => `<span class="telework-day rrll-pro-source">${escapeHtml(day)}</span>`).join("")
      : `<span class="telework-day rrll-pro-source">Sin días</span>`;
    const statusClass = teleworkStatusClass(item.status);
    const eligibilityWarnings = getTeleworkJobEligibility(item.job).warnings;
    const eligibilityHtml = eligibilityWarnings.length ? `<div class="telework-eligibility-warning visible">${eligibilityWarnings.map(warning => `<span>⚠️ ${escapeHtml(warning)}</span>`).join("")}</div>` : "";

    return `
      <article id="rrll-telework-${escapeHtml(item.id)}" class="rrll-pro-row telework-request-card status-${statusClass}" ondblclick="event.preventDefault(); event.stopPropagation(); openTeleworkEditModal('${escapeJs(item.id)}')" title="Doble clic para editar la ficha completa">
        <div class="telework-card-main">
          <div>
            <div class="rrll-pro-title">${escapeHtml(item.name || "Sin solicitante")}</div>
            <div class="rrll-pro-subtitle">Nº empleado: ${escapeHtml(item.employeeNumber || "Sin número")} · ${escapeHtml(item.job || "Sin puesto")}</div>
          </div>
          <span class="rrll-status-pill ${statusClass}">${escapeHtml(teleworkStatusLabel(item.status))}</span>
        </div>
        <div class="telework-card-grid">
          <div><span>Periodo</span><strong>${escapeHtml(item.period || "Sin periodo")}</strong></div>
          <div><span>Tipo</span><strong>${escapeHtml(item.type || "Nuevo")}</strong></div>
          <div><span>Días solicitados</span><div class="telework-days rrll-pro-day-list">${daysHtml}</div></div>
          <div><span>Creada</span><strong>${escapeHtml(created)}</strong></div>
        </div>
        ${validationSummary(item)}
        ${eligibilityHtml}
        <p class="telework-observations-preview">${escapeHtml(observationsPreview(item.observations))}</p>
        <div class="rrll-pro-actions telework-card-actions" onclick="event.stopPropagation()">
          ${item.status !== "telework-approved" ? `<button class="small" onclick="resolveTelework('${escapeJs(item.id)}', 'telework-approved')">Aprobar</button>` : ""}
          ${item.status !== "telework-denied" ? `<button class="small secondary" onclick="resolveTelework('${escapeJs(item.id)}', 'telework-denied')">Denegar</button>` : ""}
          <button class="small secondary" onclick="openTeleworkEditModal('${escapeJs(item.id)}')">Editar</button>
          <button class="small danger rrll-delete-icon-button" onclick="deleteTelework('${escapeJs(item.id)}')" title="Eliminar solicitud" aria-label="Eliminar solicitud"><span aria-hidden="true">🗑️</span></button>
        </div>
      </article>`;
  }

  function renderTeleworkRow(rawItem, indicatorContext) {
    const item = normalizeTeleworkItem(rawItem);
    const created = item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-ES") : "Sin fecha";
    const daysHtml = item.days.length
      ? item.days.map(day => `<span class="telework-day rrll-pro-source">${escapeHtml(day)}</span>`).join("")
      : `<span class="telework-day rrll-pro-source">Sin días</span>`;
    const statusClass = teleworkStatusClass(item.status);
    const eligibilityWarnings = getTeleworkJobEligibility(item.job).warnings;
    const eligibilityHtml = eligibilityWarnings.length ? `<div class="telework-eligibility-warning visible">${eligibilityWarnings.map(warning => `<span>⚠️ ${escapeHtml(warning)}</span>`).join("")}</div>` : "";

    return `
      <tr id="rrll-telework-${escapeHtml(item.id)}" class="rrll-pro-row telework-request-row status-${statusClass}" ondblclick="event.preventDefault(); event.stopPropagation(); openTeleworkEditModal('${escapeJs(item.id)}')" title="Doble clic para editar la ficha completa">
        <td class="rrll-pro-main-cell telework-col-person">
          <div class="telework-person-with-indicator">
            ${renderTeleworkPositionIndicator(item, indicatorContext)}
            <div class="telework-person-text">
              <div class="rrll-pro-title">${escapeHtml(item.name || "Sin solicitante")}</div>
              <div class="rrll-pro-subtitle">Nº empleado: ${escapeHtml(item.employeeNumber || "Sin número")} · ${escapeHtml(item.job || "Sin puesto")}</div>
            </div>
          </div>
          ${eligibilityHtml}
        </td>
        <td class="telework-col-status"><span class="rrll-status-pill ${statusClass}">${escapeHtml(teleworkStatusLabel(item.status))}</span></td>
        <td class="telework-col-period"><span class="rrll-pro-source">${escapeHtml(item.period || "Sin periodo")}</span></td>
        <td class="telework-col-type"><span class="rrll-pro-source">${escapeHtml(item.type || "Nuevo")}</span></td>
        <td class="telework-col-days"><div class="telework-days rrll-pro-day-list">${daysHtml}</div></td>
        <td class="telework-col-created"><span class="rrll-pro-created">${escapeHtml(created)}</span></td>
      </tr>`;
  }

  function getTeleworkCampaigns() {
    const info = getTeleworkCampaignInfo();
    const activeStart = teleworkCampaignStart(info.active);
    const campaigns = new Set([info.active, info.suggested, getTeleworkActiveCampaign()]);
    getTeleworkItems().forEach(item => {
      const period = normalizeTeleworkPeriod(item.period);
      const start = teleworkCampaignStart(period);
      if (Number.isFinite(start) && start >= activeStart) campaigns.add(period);
    });
    return Array.from(campaigns).filter(Boolean).sort(compareTeleworkCampaignsDesc);
  }

  function ensureTeleworkPeriodControls() {
    const selector = document.getElementById("teleworkCampaignSelector");
    const campaigns = getTeleworkCampaigns();
    if (selector) {
      const current = getTeleworkActiveCampaign();
      selector.innerHTML = campaigns.map(period => `<option value="${escapeHtml(period)}">${escapeHtml(period)}</option>`).join("");
      if (!campaigns.includes(current)) selector.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(current)}">${escapeHtml(current)}</option>`);
      selector.value = current;
    }
    const periodEl = document.getElementById("newTeleworkPeriod");
    if (periodEl && !periodEl.value) periodEl.value = getTeleworkActiveCampaign();
    const hint = document.getElementById("teleworkCampaignHint");
    if (hint) {
      const info = getTeleworkCampaignInfo();
      hint.textContent = `Campaña vigente por año natural: ${info.active}. Las campañas anteriores se muestran solo en histórico.`;
    }
  }

  function changeTeleworkCampaign(period) {
    const normalized = normalizeTeleworkPeriod(period);
    if (isTeleworkHistoricalCampaign(normalized)) {
      alert(`La campaña ${normalized} es histórica y se consulta en el bloque Histórico de campañas.`);
      ensureTeleworkPeriodControls();
      return;
    }
    setTeleworkActiveCampaign(normalized);
    const periodEl = document.getElementById("newTeleworkPeriod");
    if (periodEl) periodEl.value = getTeleworkActiveCampaign();
    refreshTeleworkDependents();
  }

  function addTeleworkCampaignOption() {
    const period = normalizeTeleworkPeriod(getTeleworkCampaignInfo().suggested);
    if (!period || period === TELEWORK_NO_PERIOD) return;
    changeTeleworkCampaign(period);
  }

  function getTeleworkVisibleItems(items = getTeleworkItems()) {
    const selected = getTeleworkActiveCampaign();
    const query = normalizeTeleworkLookup(document.getElementById("teleworkInlineSearch")?.value || "");
    const statusOrder = { "telework-processing": 0, "telework-direction": 1, "telework-entry": 2, "telework-approved": 3, "telework-denied": 4 };
    return items
      .filter(item => normalizeTeleworkPeriod(item.period) === selected)
      .filter(item => teleworkViewFilter === "all" || item.status === teleworkViewFilter)
      .filter(item => teleworkMatchesQuery(item, query))
      .sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  function countTeleworkSummary(items) {
    return {
      received: items.length,
      validationPending: items.filter(item => [item.presenceValidation, item.favorableReport, item.security, item.prevention].some(value => value === "Pendiente")).length,
      directionPending: items.filter(item => item.status === "telework-direction").length,
      approved: items.filter(item => item.status === "telework-approved").length,
      denied: items.filter(item => item.status === "telework-denied").length,
      warnings: items.filter(item => getTeleworkJobEligibility(item.job).warnings.length).length
    };
  }

  function renderTeleworkCampaignSummary(items) {
    const box = document.getElementById("teleworkCampaignSummary");
    if (!box) return;
    const summary = countTeleworkSummary(items);
    const labels = [
      ["Solicitudes recibidas", summary.received],
      ["Validaciones pendientes", summary.validationPending],
      ["Pendientes Dirección", summary.directionPending],
      ["Aprobadas", summary.approved],
      ["Denegadas", summary.denied],
      ["Advertencias", summary.warnings]
    ];
    box.innerHTML = labels.map(([label, value]) => `<div class="telework-campaign-metric"><span>${escapeHtml(label)}</span><b>${value}</b></div>`).join("");
  }

  function groupTeleworkByPeriod(items) {
    return items.reduce((acc, item) => {
      const period = normalizeTeleworkPeriod(item.period);
      if (!acc[period]) acc[period] = [];
      acc[period].push(item);
      return acc;
    }, {});
  }

  function renderTeleworkHistory(items) {
    const box = document.getElementById("teleworkHistoryList");
    if (!box) return;
    const grouped = groupTeleworkByPeriod(items);
    const renderPeriodBlock = (period, label, className = "telework-history-campaign") => {
      const rows = grouped[period].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map(renderTeleworkCard).join("");
      return `<details class="${className}">
        <summary><strong>${escapeHtml(period)}</strong><span>${label} · ${grouped[period].length} solicitudes</span></summary>
        <div class="history-table-wrapper telework-history-table-wrapper"><div class="telework-request-list">${rows}</div></div>
      </details>`;
    };
    const historicalPeriods = Object.keys(grouped)
      .filter(period => isTeleworkHistoricalCampaign(period))
      .sort(compareTeleworkCampaignsDesc);
    const futurePeriods = Object.keys(grouped)
      .filter(period => isTeleworkFutureCampaign(period))
      .sort(compareTeleworkCampaignsDesc);
    const historicalHtml = historicalPeriods.map(period => renderPeriodBlock(period, "Histórico")).join("") || `<div class="rrll-pro-empty">Sin campañas históricas cerradas.</div>`;
    const futureHtml = futurePeriods.length ? `<div class="telework-future-heading">Campañas futuras/manuales</div>${futurePeriods.map(period => renderPeriodBlock(period, "Planificada", "telework-history-campaign telework-future-campaign")).join("")}` : "";
    box.innerHTML = `${historicalHtml}${futureHtml}`;
  }

  function renderTelework() {
    const items = getTeleworkItems();
    ensureTeleworkPeriodControls();
    const selectedItems = items.filter(item => normalizeTeleworkPeriod(item.period) === getTeleworkActiveCampaign());
    const counts = Object.fromEntries(STATUS_VALUES.map(status => [status, 0]));
    selectedItems.forEach(item => { counts[item.status] = (counts[item.status] || 0) + 1; });

    const countAll = document.getElementById("count-telework-all");
    if (countAll) countAll.textContent = selectedItems.length;
    STATUS_VALUES.forEach(status => {
      const id = `count-telework-${status.replace("telework-", "")}`;
      const el = document.getElementById(id);
      if (el) el.textContent = counts[status] || 0;
    });
    renderTeleworkCampaignSummary(selectedItems);

    document.querySelectorAll("#gestor-teletrabajo .rrll-pro-tabs button").forEach(button => button.classList.remove("active"));
    const activeId = teleworkViewFilter === "all" ? "telework-filter-all" : `telework-filter-${teleworkViewFilter.replace("telework-", "")}`;
    const activeFilter = document.getElementById(activeId);
    if (activeFilter) activeFilter.classList.add("active");

    const filtered = getTeleworkVisibleItems(items);
    const indicatorContext = {
      catalog: getTeleworkJobCatalog(),
      countsByJob: buildTeleworkRequestCountByJob(selectedItems)
    };
    const list = document.getElementById("teleworkListBody") || document.getElementById("teleworkTableBody");
    const empty = document.getElementById("teleworkTableEmpty");
    if (list) {
      list.innerHTML = `
        <div class="rrll-pro-table-wrap telework-table-wrap">
          <table class="rrll-pro-table telework-table">
            <thead>
              <tr>
                <th>Solicitante</th>
                <th>Estado</th>
                <th>Campaña</th>
                <th>Tipo</th>
                <th>Días</th>
                <th>Creada</th>
              </tr>
            </thead>
            <tbody>${filtered.map(item => renderTeleworkRow(item, indicatorContext)).join("")}</tbody>
          </table>
        </div>`;
    }
    if (empty) empty.style.display = filtered.length ? "none" : "block";
    renderTeleworkHistory(items);
  }

  function openTeleworkJobCatalogModal() {
    const modal = document.getElementById("teleworkJobCatalogModal");
    if (!modal) return;
    teleworkCatalogDraft = getTeleworkJobCatalog();
    renderTeleworkJobCatalogModal();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => document.getElementById("teleworkJobCatalogSearch")?.focus(), 0);
  }

  function closeTeleworkJobCatalogModal() {
    const modal = document.getElementById("teleworkJobCatalogModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    teleworkCatalogDraft = null;
  }

  function teleworkCatalogDraftFromRow(index) {
    const field = name => document.querySelector(`[data-telework-catalog-index="${index}"][data-telework-catalog-field="${name}"]`);
    return normalizeTeleworkCatalogItem({
      puestoOrganizativo: field("puestoOrganizativo")?.value || "",
      direccion: field("direccion")?.value || "",
      unidad: field("unidad")?.value || "",
      plantilla: field("plantilla")?.value || "",
      teletrabajoSN: field("teletrabajoSN")?.value || "",
      presencialidadMinima: field("presencialidadMinima")?.value || ""
    });
  }

  function getTeleworkCatalogDraftSource() {
    if (!Array.isArray(teleworkCatalogDraft)) teleworkCatalogDraft = getTeleworkJobCatalog();
    return [...teleworkCatalogDraft];
  }

  function getTeleworkCatalogDraftFromModal() {
    const next = getTeleworkCatalogDraftSource();
    document.querySelectorAll("#teleworkJobCatalogBody tr[data-telework-catalog-index]").forEach(row => {
      const index = Number(row.dataset.teleworkCatalogIndex);
      next[index] = teleworkCatalogDraftFromRow(index);
    });
    teleworkCatalogDraft = next;
    return next.filter(item => item && item.jobKey);
  }

  function renderTeleworkJobCatalogModal() {
    const body = document.getElementById("teleworkJobCatalogBody");
    if (!body) return;
    const query = normalizeTeleworkLookup(document.getElementById("teleworkJobCatalogSearch")?.value || "");
    const items = getTeleworkCatalogDraftFromModal();
    const filtered = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !query || [item.puestoOrganizativo, item.direccion, item.unidad, item.teletrabajoSN].some(value => normalizeTeleworkLookup(value).includes(query)));
    const count = document.getElementById("teleworkJobCatalogCount");
    if (count) count.textContent = `${filtered.length} de ${items.length} puestos`;
    body.innerHTML = filtered.map(({ item, index }) => renderTeleworkCatalogRow(item, index)).join("") || `<tr><td colspan="7" class="telework-catalog-empty">Sin puestos importados. Usa “Nuevo puesto” o importa un modelo Excel.</td></tr>`;
  }

  function renderTeleworkCatalogRow(item, index) {
    const input = (field, value, type = "text") => `<input data-telework-catalog-index="${index}" data-telework-catalog-field="${field}" type="${type}" value="${escapeHtml(value ?? "")}" />`;
    return `<tr data-telework-catalog-index="${index}">
      <td>${input("puestoOrganizativo", item.puestoOrganizativo)}</td>
      <td>${input("direccion", item.direccion)}</td>
      <td>${input("unidad", item.unidad)}</td>
      <td>${input("plantilla", item.plantilla, "number")}</td>
      <td><select data-telework-catalog-index="${index}" data-telework-catalog-field="teletrabajoSN"><option value="S" ${item.teletrabajoSN === "S" ? "selected" : ""}>S</option><option value="N" ${item.teletrabajoSN === "N" ? "selected" : ""}>N</option></select></td>
      <td>${input("presencialidadMinima", item.presencialidadMinima, "number")}</td>
      <td><button class="secondary telework-catalog-delete" type="button" onclick="deleteTeleworkCatalogRow(${index})">Eliminar</button></td>
    </tr>`;
  }

  function addTeleworkCatalogRow() {
    const current = getTeleworkCatalogDraftFromModal();
    current.push(normalizeTeleworkCatalogItem({ puestoOrganizativo: "Nuevo puesto", teletrabajoSN: "S" }));
    teleworkCatalogDraft = current;
    const search = document.getElementById("teleworkJobCatalogSearch");
    if (search) search.value = "";
    renderTeleworkJobCatalogModal();
    setTimeout(() => document.querySelector("#teleworkJobCatalogBody tr:last-child input")?.focus(), 0);
  }

  function deleteTeleworkCatalogRow(index) {
    const item = getTeleworkCatalogDraftFromModal()[Number(index)];
    const title = item?.puestoOrganizativo ? `“${item.puestoOrganizativo}”` : "este puesto";
    const remove = () => {
      const next = getTeleworkCatalogDraftFromModal().filter((_, idx) => idx !== Number(index));
      teleworkCatalogDraft = next;
      renderTeleworkJobCatalogModal();
    };
    if (typeof confirmDangerAction === "function") {
      confirmDangerAction({ title: "Eliminar puesto teletrabajo", message: `¿Quieres eliminar ${title} del catálogo?`, confirmLabel: "Eliminar", onConfirm: remove });
      return;
    }
    if (confirm(`¿Quieres eliminar ${title} del catálogo?`)) remove();
  }

  function saveTeleworkJobCatalogModal() {
    const next = getTeleworkCatalogDraftFromModal();
    setTeleworkJobCatalog(next);
    renderTeleworkJobCatalogModal();
    renderTeleworkEligibilityWarning("new");
    renderTeleworkEligibilityWarning("edit");
    renderTelework();
    alert(`Catálogo guardado. Puestos: ${next.length}.`);
  }

  function escapeJs(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  function getTeleworkRowsForExport(includeAllCampaigns = false) {
    const rows = includeAllCampaigns ? getTeleworkItems() : getTeleworkVisibleItems();
    return rows
      .map(normalizeTeleworkItem)
      .sort((a, b) => compareTeleworkCampaignsDesc(a.period, b.period) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  function exportTeleworkHistoryExcel() {
    if (typeof window.buildTeleworkExcelData !== "function" || typeof window.exportExcelData !== "function") {
      alert("La exportación Excel todavía no está disponible. Inténtalo de nuevo en unos segundos.");
      return;
    }
    const rows = getTeleworkRowsForExport(true);
    window.exportExcelData(window.buildTeleworkExcelData(rows, "Histórico de teletrabajo", "historico-teletrabajo"));
  }

  function parseTeleworkCsv(text) {
    const delimiter = text.includes(";") ? ";" : (text.includes("\t") ? "\t" : ",");
    const rows = [];
    let row = [], cell = "", inQuotes = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"' && inQuotes && next === '"') { cell += '"'; i += 1; continue; }
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === delimiter && !inQuotes) { row.push(cell); cell = ""; continue; }
      if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(cell); rows.push(row); row = []; cell = ""; continue;
      }
      cell += char;
    }
    row.push(cell); rows.push(row);
    return rows.filter(r => r.some(c => String(c || "").trim()));
  }

  function spreadsheetCellToText(value) {
    return String(value ?? "").replace(/\u00a0/g, " ").trim();
  }

  function columnLettersToIndex(ref) {
    const letters = String(ref || "").replace(/[^A-Z]/gi, "").toUpperCase();
    let index = 0;
    for (const letter of letters) index = (index * 26) + letter.charCodeAt(0) - 64;
    return Math.max(index - 1, 0);
  }

  function columnIndexToLetters(index) {
    let number = index + 1;
    let letters = "";
    while (number > 0) {
      const remainder = (number - 1) % 26;
      letters = String.fromCharCode(65 + remainder) + letters;
      number = Math.floor((number - 1) / 26);
    }
    return letters;
  }

  async function inflateTeleworkZipEntry(bytes, compressionMethod) {
    if (compressionMethod === 0) return bytes;
    if (compressionMethod !== 8) throw new Error("El Excel usa un método de compresión no soportado.");
    if (typeof DecompressionStream !== "function") throw new Error("Este entorno no permite descomprimir archivos .xlsx.");
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function decodeTeleworkUtf8(bytes) {
    return new TextDecoder("utf-8").decode(bytes);
  }

  async function readTeleworkZipEntries(buffer) {
    const data = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const entries = {};
    for (let i = data.length - 22; i >= 0; i -= 1) {
      if (view.getUint32(i, true) !== 0x06054b50) continue;
      const total = view.getUint16(i + 10, true);
      let offset = view.getUint32(i + 16, true);
      for (let e = 0; e < total; e += 1) {
        if (view.getUint32(offset, true) !== 0x02014b50) break;
        const method = view.getUint16(offset + 10, true);
        const compressedSize = view.getUint32(offset + 20, true);
        const fileNameLength = view.getUint16(offset + 28, true);
        const extraLength = view.getUint16(offset + 30, true);
        const commentLength = view.getUint16(offset + 32, true);
        const localOffset = view.getUint32(offset + 42, true);
        const fileName = decodeTeleworkUtf8(data.slice(offset + 46, offset + 46 + fileNameLength));
        const localNameLength = view.getUint16(localOffset + 26, true);
        const localExtraLength = view.getUint16(localOffset + 28, true);
        const dataStart = localOffset + 30 + localNameLength + localExtraLength;
        entries[fileName] = decodeTeleworkUtf8(await inflateTeleworkZipEntry(data.slice(dataStart, dataStart + compressedSize), method));
        offset += 46 + fileNameLength + extraLength + commentLength;
      }
      return entries;
    }
    throw new Error("No se pudo abrir el archivo Excel.");
  }

  function parseTeleworkSharedStrings(xmlText) {
    if (!xmlText) return [];
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    return [...doc.querySelectorAll("si")].map(si => [...si.querySelectorAll("t")].map(t => t.textContent || "").join(""));
  }

  function getFirstTeleworkWorksheetPath(entries) {
    const workbook = entries["xl/workbook.xml"];
    const rels = entries["xl/_rels/workbook.xml.rels"];
    if (!workbook || !rels) return "xl/worksheets/sheet1.xml";
    const workbookDoc = new DOMParser().parseFromString(workbook, "application/xml");
    const firstSheet = workbookDoc.querySelector("sheet");
    const relId = firstSheet?.getAttribute("r:id");
    if (!relId) return "xl/worksheets/sheet1.xml";
    const relsDoc = new DOMParser().parseFromString(rels, "application/xml");
    const relationship = [...relsDoc.querySelectorAll("Relationship")].find(rel => rel.getAttribute("Id") === relId);
    const target = relationship?.getAttribute("Target") || "worksheets/sheet1.xml";
    return `xl/${target.replace(/^\//, "").replace(/^xl\//, "")}`;
  }

  function parseTeleworkWorksheetRows(xmlText, sharedStrings) {
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    return [...doc.querySelectorAll("sheetData row")].map(rowNode => {
      const row = [];
      [...rowNode.querySelectorAll("c")].forEach(cell => {
        const index = columnLettersToIndex(cell.getAttribute("r"));
        const type = cell.getAttribute("t");
        let value = "";
        if (type === "inlineStr") {
          value = [...cell.querySelectorAll("is t")].map(t => t.textContent || "").join("");
        } else {
          value = cell.querySelector("v")?.textContent || "";
          if (type === "s") value = sharedStrings[Number(value)] || "";
        }
        row[index] = spreadsheetCellToText(value);
      });
      return row.map(cell => cell || "");
    }).filter(row => row.some(Boolean));
  }

  async function readTeleworkImportRows(file) {
    const name = String(file?.name || "").toLowerCase();
    const buffer = await file.arrayBuffer();
    if (name.endsWith(".xlsx")) {
      const entries = await readTeleworkZipEntries(buffer);
      const worksheetPath = getFirstTeleworkWorksheetPath(entries);
      if (!entries[worksheetPath]) throw new Error("No se encontró la primera hoja del Excel.");
      return parseTeleworkWorksheetRows(entries[worksheetPath], parseTeleworkSharedStrings(entries["xl/sharedStrings.xml"]));
    }
    return parseTeleworkCsv(new TextDecoder("utf-8").decode(buffer));
  }

  function teleworkRowsToRecords(rows) {
    if (rows.length < 2) return { headers: [], records: [] };
    const headers = rows[0].map(teleworkHeaderKey);
    const records = rows.slice(1).map(row => Object.fromEntries(headers.map((h, idx) => [h, row[idx] || ""])));
    return { headers, records };
  }

  function teleworkHeaderKey(value) {
    return normalizeTeleworkLookup(value).replace(/[^a-z0-9]/g, "");
  }

  function teleworkCell(record, aliases) {
    const recordKeys = Object.keys(record);
    for (const alias of aliases) {
      const aliasKey = teleworkHeaderKey(alias);
      const key = recordKeys.find(k => k === aliasKey);
      if (key) return String(record[key] || "").trim();
    }
    return "";
  }

  function buildTeleworkCatalogItemFromRecord(record) {
    const puestoOrganizativo = teleworkCell(record, ["Puesto Organizativo", "Puesto de trabajo", "Puesto", "Job"]);
    if (!puestoOrganizativo) return null;
    return normalizeTeleworkCatalogItem({
      puestoOrganizativo,
      direccion: teleworkCell(record, ["Dirección", "Direccion"]),
      unidad: teleworkCell(record, ["Unidad"]),
      plantilla: teleworkCell(record, ["Plantilla"]),
      teletrabajoSN: teleworkCell(record, ["Teletrabajo S/N", "Teletrabajo SN", "Teletrabajo", "Elegible", "Apto", "Teletrabajable"]),
      presencialidadMinima: teleworkCell(record, ["Presencialidad mínima de personas por puesto para el normal funcionamiento de la unidad Puestos 2 o mas personas", "Presencialidad minima de personas por puesto para el normal funcionamiento de la unidad Puestos 2 o mas personas", "Presencialidad mínima", "Presencialidad minima", "Presencialidad"]),
      warning: teleworkCell(record, ["Advertencia", "Observaciones", "Notas"])
    });
  }

  function renderTeleworkEligibilityWarning(prefix = "new") {
    const box = document.getElementById(`${prefix}TeleworkEligibilityWarning`);
    if (!box) return;
    const job = document.getElementById(`${prefix}TeleworkJob`)?.value || "";
    const warnings = getTeleworkJobEligibility(job).warnings;
    box.innerHTML = warnings.length ? warnings.map(warning => `<span>⚠️ ${escapeHtml(warning)}</span>`).join("") : "";
    box.classList.toggle("visible", warnings.length > 0);
  }

  function applyTeleworkJobCatalogRows(rows) {
    if (rows.length < 2) throw new Error("El catálogo no contiene filas importables.");
    const { records } = teleworkRowsToRecords(rows);
    const catalog = records.map(buildTeleworkCatalogItemFromRecord).filter(item => item && item.jobKey);
    setTeleworkJobCatalog(catalog);
    renderTelework();
    renderTeleworkEligibilityWarning("new");
    renderTeleworkJobCatalogModal();
    return catalog;
  }

  async function importTeleworkJobCatalog(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const catalog = applyTeleworkJobCatalogRows(await readTeleworkImportRows(file));
      alert(`Catálogo de puestos importado. Puestos: ${catalog.length}.`);
    } catch (error) {
      console.error("Error importando catálogo de puestos:", error);
      alert(`No se pudo importar el catálogo. Detalle: ${error && error.message ? error.message : "error desconocido"}`);
    } finally {
      event.target.value = "";
      closeTeleworkImportModal();
    }
  }

  function parseTeleworkBoolean(value) {
      const text = normalizeTeleworkLookup(value);
      if (!text) return false;
      return ["si", "sí", "s", "true", "1", "x", "ok", "aprobado", "favorable"].includes(text);
    }

  function teleworkStatusFromImport(record) {
      const value = teleworkCell(record, ["Estado", "Estado solicitud", "Estado de solicitud", "Situación", "Situacion"]);
      const text = normalizeTeleworkLookup(value);
      if (!text) return "";
      if (text.includes("aprob")) return "telework-approved";
      if (text.includes("deneg") || text.includes("rechaz")) return "telework-denied";
      if (text.includes("direccion")) return "telework-direction";
      if (text.includes("validacion") || text.includes("validaciones") || text.includes("tram") || text.includes("proceso")) return "telework-processing";
      if (text.includes("recibid") || text.includes("entrada") || text.includes("solicitud")) return "telework-entry";
      return STATUS_VALUES.includes(value) ? value : "";
    }

  function buildTeleworkImportItem(record, defaultPeriod) {
      const original = teleworkCell(record, ["Petición original", "Peticion original", "Días solicitados", "Dias solicitados"]);
      const days = ["Martes", "Miércoles", "Jueves"].filter(day => parseTeleworkBoolean(teleworkCell(record, [day])));
      if (!days.length && original) {
        ["Martes", "Miércoles", "Jueves"].forEach(day => { if (normalizeTeleworkLookup(original).includes(normalizeTeleworkLookup(day))) days.push(day); });
      }
      const directionApproved = parseTeleworkBoolean(teleworkCell(record, ["Validación Dirección", "Validacion Direccion"]));
      const importedStatus = teleworkStatusFromImport(record);
      const resolvedAt = teleworkCell(record, ["Fecha resolución", "Fecha resolucion"]);
      return normalizeTeleworkItem({
        id: (window.crypto && typeof window.crypto.randomUUID === "function") ? window.crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        employeeNumber: teleworkCell(record, ["Nº empleado", "No empleado", "N empleado", "Numero empleado"]),
        name: teleworkCell(record, ["Solicitante", "Nombre", "Nombre y apellidos"]),
        job: teleworkCell(record, ["Puesto de trabajo", "Puesto"]),
        period: teleworkCell(record, ["Periodo", "Campaña", "Campana"]) || defaultPeriod,
        type: teleworkCell(record, ["Tipo solicitud", "Tipo"]) || "Importada",
        days,
        presenceValidation: parseTeleworkBoolean(teleworkCell(record, ["Cumplimiento condiciones presencialidad", "Cumplimiento presencialidad"])) ? "Sí" : "Pendiente",
        favorableReport: parseTeleworkBoolean(teleworkCell(record, ["Informe favorable"])) ? "Sí" : "Pendiente",
        security: parseTeleworkBoolean(teleworkCell(record, ["Seguridad informática", "Seguridad informatica"])) ? "Sí" : "Pendiente",
        prevention: parseTeleworkBoolean(teleworkCell(record, ["Prevención", "Prevencion"])) ? "Sí" : "Pendiente",
        previousYearTeleworked: parseTeleworkBoolean(teleworkCell(record, ["Año anterior teletrabajado", "Ano anterior teletrabajado"])) ? "Sí" : "No aplica",
        unitHeadRepeatValidation: parseTeleworkBoolean(teleworkCell(record, ["Validación Jefatura Unidad a repetir", "Validacion Jefatura Unidad a repetir"])) ? "Sí" : "No aplica",
        directionValidation: directionApproved ? "Aprobada" : "Pendiente",
        resolutionDate: resolvedAt || "",
        status: importedStatus || (resolvedAt || directionApproved ? "telework-approved" : "telework-entry"),
        statusManual: true,
        resolvedAt: resolvedAt || null,
        observations: teleworkCell(record, ["Observaciones", "Notas"]),
        createdAt: new Date().toISOString()
      });
    }

  function applyTeleworkDataRows(rows) {
      if (rows.length < 2) throw new Error("El fichero no contiene filas importables.");
      const { headers, records } = teleworkRowsToRecords(rows);
      const hasPeriod = headers.some(h => h === "periodo" || h === "campana");
      const defaultPeriod = hasPeriod ? "" : getTeleworkActiveCampaign();
      const imported = records.map(record => buildTeleworkImportItem(record, defaultPeriod)).filter(item => item.employeeNumber && item.name);
      const existing = getTeleworkItems();
      const existingKeys = new Set(existing.map(getTeleworkDuplicateKey).filter(Boolean));
      const seenImportKeys = new Set();
      const duplicateCount = imported.reduce((count, item) => {
        const key = getTeleworkDuplicateKey(item);
        const duplicated = key && (existingKeys.has(key) || seenImportKeys.has(key));
        if (key) seenImportKeys.add(key);
        return duplicated ? count + 1 : count;
      }, 0);
      const mode = duplicateCount ? "skip" : "append";
      const next = [...existing];
      let added = 0, updated = 0, skipped = 0;
      imported.forEach(item => {
        const key = getTeleworkDuplicateKey(item);
        const index = key ? next.findIndex(current => getTeleworkDuplicateKey(current) === key) : -1;
        if (index >= 0 && mode === "update") { next[index] = { ...next[index], ...item, id: next[index].id, createdAt: next[index].createdAt || item.createdAt, updatedAt: new Date().toISOString() }; updated += 1; return; }
        if (index >= 0) { skipped += 1; return; }
        next.unshift(item); added += 1;
      });
      setTeleworkItems(next);
      renderTelework();
      if (typeof updateQuickCounts === "function") updateQuickCounts();
      if (typeof renderHomeDashboard === "function") renderHomeDashboard();
      return { added, updated, skipped };
    }

  function isTeleworkCatalogImport(headers) {
    const catalogColumns = ["puestoorganizativo", "teletrabajosn", "teletrabajo", "direccion", "unidad", "plantilla", "presencialidadminimadepersonasporpuestoparaelnormalfuncionamientodelaunidadpuestos2omaspersonas", "presencialidadminima", "elegible", "apto", "teletrabajable"];
    const hasCatalogColumn = headers.some(h => catalogColumns.includes(h));
    const hasPersonColumn = headers.some(h => ["noempleado", "nempleado", "numeroempleado", "nombre", "nombreyapellidos", "solicitante"].includes(h));
    return hasCatalogColumn && !hasPersonColumn;
  }

  async function importTeleworkData(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        const rows = await readTeleworkImportRows(file);
        const { headers } = teleworkRowsToRecords(rows);
        if (isTeleworkCatalogImport(headers)) {
          const catalog = applyTeleworkJobCatalogRows(rows);
          alert(`Catálogo de puestos importado. Puestos: ${catalog.length}.`);
          return;
        }
        const summary = applyTeleworkDataRows(rows);
        if (summary) alert(`Importación finalizada. Añadidos: ${summary.added}. Actualizados: ${summary.updated}. Omitidos: ${summary.skipped}.`);
      } catch (error) {
        console.error("Error importando teletrabajo:", error);
        alert(`No se pudo importar el fichero. Detalle: ${error && error.message ? error.message : "error desconocido"}`);
      } finally {
        event.target.value = "";
        closeTeleworkImportModal();
      }
    }

  function teleworkXmlEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildTeleworkWorksheetXml(rows) {
    const sheetRows = rows.map((row, rowIndex) => {
      const cells = row.map((value, columnIndex) => {
        const ref = `${columnIndexToLetters(columnIndex)}${rowIndex + 1}`;
        return `<c r="${ref}" t="inlineStr"><is><t>${teleworkXmlEscape(value)}</t></is></c>`;
      }).join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`;
  }

  function teleworkCrc32(bytes) {
    let crc = -1;
    for (const byte of bytes) {
      crc ^= byte;
      for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ -1) >>> 0;
  }

  function teleworkUint16(value) {
    return [value & 255, (value >>> 8) & 255];
  }

  function teleworkUint32(value) {
    return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];
  }

  function buildTeleworkXlsxBlob(sheetName, rows) {
    const enc = new TextEncoder();
    const files = [
      ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
      ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
      ["xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${teleworkXmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
      ["xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ["xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="1"><xf xfId="0"/></cellXfs></styleSheet>`],
      ["xl/worksheets/sheet1.xml", buildTeleworkWorksheetXml(rows)]
    ].map(([name, content]) => ({ name, nameBytes: enc.encode(name), bytes: enc.encode(content) }));
    const chunks = [];
    const central = [];
    let offset = 0;
    files.forEach(file => {
      const crc = teleworkCrc32(file.bytes);
      const local = new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...teleworkUint16(20), ...teleworkUint16(0), ...teleworkUint16(0), ...teleworkUint16(0), ...teleworkUint16(0), ...teleworkUint32(crc), ...teleworkUint32(file.bytes.length), ...teleworkUint32(file.bytes.length), ...teleworkUint16(file.nameBytes.length), ...teleworkUint16(0)]);
      chunks.push(local, file.nameBytes, file.bytes);
      central.push({ ...file, crc, offset });
      offset += local.length + file.nameBytes.length + file.bytes.length;
    });
    const centralStart = offset;
    central.forEach(file => {
      const header = new Uint8Array([0x50, 0x4b, 0x01, 0x02, ...teleworkUint16(20), ...teleworkUint16(20), ...teleworkUint16(0), ...teleworkUint16(0), ...teleworkUint16(0), ...teleworkUint16(0), ...teleworkUint32(file.crc), ...teleworkUint32(file.bytes.length), ...teleworkUint32(file.bytes.length), ...teleworkUint16(file.nameBytes.length), ...teleworkUint16(0), ...teleworkUint16(0), ...teleworkUint16(0), ...teleworkUint16(0), ...teleworkUint32(0), ...teleworkUint32(file.offset)]);
      chunks.push(header, file.nameBytes);
      offset += header.length + file.nameBytes.length;
    });
    const centralSize = offset - centralStart;
    chunks.push(new Uint8Array([0x50, 0x4b, 0x05, 0x06, ...teleworkUint16(0), ...teleworkUint16(0), ...teleworkUint16(files.length), ...teleworkUint16(files.length), ...teleworkUint32(centralSize), ...teleworkUint32(centralStart), ...teleworkUint16(0)]));
    return new Blob(chunks, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }

  function downloadTeleworkTemplate(kind) {
    const templates = {
      requests: {
        sheetName: "Solicitudes Teletrabajo",
        filename: "modelo-solicitudes-teletrabajo.xlsx",
        rows: [["Nº empleado", "Nombre y apellidos", "Puesto de trabajo", "Periodo", "Tipo solicitud", "Martes", "Miércoles", "Jueves", "Cumplimiento presencialidad", "Informe favorable", "Seguridad informática", "Prevención", "Validación Dirección", "Fecha resolución", "Observaciones"], ["12345", "Nombre Apellido", "Técnico/a RRLL", "2026", "Renovación", "Sí", "Sí", "No", "Sí", "Sí", "Sí", "Sí", "Aprobado", "15/05/2026", "Sin incidencias"]]
      },
      jobs: {
        sheetName: "Puestos Teletrabajo",
        filename: "modelo-catalogo-puestos.xlsx",
        rows: [TELEWORK_JOB_CATALOG_HEADERS, ["Técnico/a Relaciones Laborales", "Capital Humano", "Relaciones Laborales", "3", "S", "2"]]
      }
    };
    const template = templates[kind];
    if (!template) return;
    const url = URL.createObjectURL(buildTeleworkXlsxBlob(template.sheetName, template.rows));
    const link = document.createElement("a");
    link.href = url;
    link.download = template.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function openTeleworkImportModal() {
    const modal = document.getElementById("teleworkImportModal");
    if (modal) {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    }
  }

  function closeTeleworkImportModal() {
    const modal = document.getElementById("teleworkImportModal");
    if (modal) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }
  }

  function teleworkImportChooseFile() {
    document.getElementById("teleworkImportFileInput")?.click();
  }



  const api = {
    getTeleworkItems,
    setTeleworkItems,
    toggleTeleworkCreateForm,
    addTelework,
    moveTeleworkToProcessing,
    setTeleworkCheck,
    executeMoveTeleworkToProcessing,
    executeResolveTelework,
    executeDeleteTelework,
    resolveTelework,
    deleteTelework,
    openTeleworkEditModal,
    closeTeleworkEditModal,
    saveEditingTelework,
    deleteEditingTelework,
    teleworkEditEmployeeNumberChanged,
    renderTelework,
    setTeleworkViewFilter,
    changeTeleworkCampaign,
    addTeleworkCampaignOption,
    getTeleworkActiveCampaign,
    getTeleworkCampaignInfo,
    getTeleworkRowsForExport,
    exportTeleworkHistoryExcel,
    importTeleworkData,
    importTeleworkJobCatalog,
    openTeleworkImportModal,
    closeTeleworkImportModal,
    teleworkImportChooseFile,
    downloadTeleworkTemplate,
    renderTeleworkEligibilityWarning,
    openTeleworkJobCatalogModal,
    closeTeleworkJobCatalogModal,
    renderTeleworkJobCatalogModal,
    addTeleworkCatalogRow,
    deleteTeleworkCatalogRow,
    saveTeleworkJobCatalogModal
  };

  window.TeletrabajoModule = api;
  window.getTeleworkItems = getTeleworkItems;
  window.setTeleworkItems = setTeleworkItems;
  window.toggleTeleworkCreateForm = toggleTeleworkCreateForm;
  window.addTelework = addTelework;
  window.executeMoveTeleworkToProcessing = executeMoveTeleworkToProcessing;
  window.moveTeleworkToProcessing = moveTeleworkToProcessing;
  window.setTeleworkCheck = setTeleworkCheck;
  window.executeResolveTelework = executeResolveTelework;
  window.resolveTelework = resolveTelework;
  window.executeDeleteTelework = executeDeleteTelework;
  window.deleteTelework = deleteTelework;
  window.openTeleworkEditModal = openTeleworkEditModal;
  window.closeTeleworkEditModal = closeTeleworkEditModal;
  window.saveEditingTelework = saveEditingTelework;
  window.deleteEditingTelework = deleteEditingTelework;
  window.teleworkEditEmployeeNumberChanged = teleworkEditEmployeeNumberChanged;
  window.renderTelework = renderTelework;
  window.setTeleworkViewFilter = setTeleworkViewFilter;
  window.changeTeleworkCampaign = changeTeleworkCampaign;
  window.addTeleworkCampaignOption = addTeleworkCampaignOption;
  window.getTeleworkActiveCampaign = getTeleworkActiveCampaign;
  window.getTeleworkCampaignInfo = getTeleworkCampaignInfo;
  window.getTeleworkRowsForExport = getTeleworkRowsForExport;
  window.exportTeleworkHistoryExcel = exportTeleworkHistoryExcel;
  window.importTeleworkData = importTeleworkData;
  window.importTeleworkJobCatalog = importTeleworkJobCatalog;
  window.openTeleworkImportModal = openTeleworkImportModal;
  window.closeTeleworkImportModal = closeTeleworkImportModal;
  window.teleworkImportChooseFile = teleworkImportChooseFile;
  window.downloadTeleworkTemplate = downloadTeleworkTemplate;
  window.renderTeleworkEligibilityWarning = renderTeleworkEligibilityWarning;
  window.teleworkEmployeeNumberChanged = teleworkEmployeeNumberChanged;
  window.teleworkNameAutocomplete = teleworkNameAutocomplete;
  window.selectTeleworkPerson = selectTeleworkPerson;
  window.hideTeleworkSuggestionsDelayed = hideTeleworkSuggestionsDelayed;
  window.openTeleworkJobCatalogModal = openTeleworkJobCatalogModal;
  window.closeTeleworkJobCatalogModal = closeTeleworkJobCatalogModal;
  window.renderTeleworkJobCatalogModal = renderTeleworkJobCatalogModal;
  window.addTeleworkCatalogRow = addTeleworkCatalogRow;
  window.deleteTeleworkCatalogRow = deleteTeleworkCatalogRow;
  window.saveTeleworkJobCatalogModal = saveTeleworkJobCatalogModal;
})();
