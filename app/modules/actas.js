// Fase 3.4: Gestor de Actas encapsulado como módulo independiente.
// Mantiene wrappers globales por compatibilidad con los onclick existentes del HTML.
(function () {
  'use strict';

// Fase 3: módulo extraído desde app.js sin cambiar funcionalidad.

    function getMinutes() {
      return load("rrll_minutes", []);
    }

    function setMinutes(minutes) {
      save("rrll_minutes", minutes);
    }

    function getAllegationUnions() {
      const unions = load("rrll_allegation_unions", DEFAULT_ALLEGATION_UNIONS);
      return Array.isArray(unions) && unions.length ? unions : DEFAULT_ALLEGATION_UNIONS;
    }

    function setAllegationUnions(unions) {
      const cleaned = String(unions || "")
        .split(/[\n,;]+/)
        .map(item => item.trim())
        .filter(Boolean);
      save("rrll_allegation_unions", cleaned.length ? cleaned : DEFAULT_ALLEGATION_UNIONS);
    }

    function normalizeMinuteAllegations(minute) {
      if (!minute || !minute.allegations || typeof minute.allegations !== "object") return {};
      return minute.allegations;
    }

    function toggleMinuteCreateForm(forceOpen) {
      const form = document.getElementById("minuteCreateForm");
      if (!form) return;
      const open = typeof forceOpen === "boolean" ? forceOpen : form.classList.contains("rrll-create-form-collapsed");
      form.classList.toggle("rrll-create-form-collapsed", !open);
      if (open) setTimeout(() => document.getElementById("newMinuteTitle")?.focus(), 0);
    }

    let activeMinuteAllegationsId = null;

    function openMinuteAllegationsModal(id) {
      const minute = getMinutes().find(item => item.id === id);
      if (!minute) return;
      activeMinuteAllegationsId = id;
      const titleEl = document.getElementById("minuteAllegationsModalTitle");
      const unionsText = document.getElementById("minuteAllegationsUnionsText");
      const listEl = document.getElementById("minuteAllegationsList");
      if (titleEl) titleEl.textContent = minute.title || "Acta pendiente de alegaciones";
      if (unionsText) unionsText.value = getAllegationUnions().join("\n");
      renderMinuteAllegationsChecklist(minute);
      const modal = document.getElementById("minuteAllegationsModal");
      if (modal) modal.classList.add("open");
      setTimeout(() => listEl?.focus?.(), 0);
    }

    function renderMinuteAllegationsChecklist(minute) {
      const listEl = document.getElementById("minuteAllegationsList");
      if (!listEl) return;
      const unions = getAllegationUnions();
      const allegations = normalizeMinuteAllegations(minute);
      listEl.innerHTML = unions.map((name, index) => `
        <label class="check-option allegation-check">
          <input type="checkbox" data-union-index="${index}" ${allegations[name] ? "checked" : ""} />
          ${escapeHtml(name)}
        </label>
      `).join("");
    }

    function closeMinuteAllegationsModal() {
      activeMinuteAllegationsId = null;
      const modal = document.getElementById("minuteAllegationsModal");
      if (modal) modal.classList.remove("open");
    }

    function saveMinuteAllegationsFromModal() {
      if (!activeMinuteAllegationsId) return;
      const unionsText = document.getElementById("minuteAllegationsUnionsText")?.value || "";
      setAllegationUnions(unionsText);
      const unions = getAllegationUnions();
      const checks = Array.from(document.querySelectorAll("#minuteAllegationsList input[type='checkbox']"));
      const allegations = {};
      checks.forEach(input => {
        const index = Number(input.getAttribute("data-union-index"));
        const name = unions[index];
        if (name) allegations[name] = !!input.checked;
      });
      const now = new Date().toISOString();
      setMinutes(getMinutes().map(minute => minute.id === activeMinuteAllegationsId ? {
        ...minute,
        allegations,
        updatedAt: now
      } : minute));
      closeMinuteAllegationsModal();
      renderMinutes();
    }

    function minuteAllegationsSummary(minute) {
      const allegations = normalizeMinuteAllegations(minute);
      const marked = Object.keys(allegations).filter(name => allegations[name]);
      if (!marked.length) return "Aportaciones: ninguna marcada";
      return `Aportaciones: ${marked.join(", ")}`;
    }

    function addMinute() {
      const titleEl = document.getElementById("newMinuteTitle");
      const notesEl = document.getElementById("newMinuteNotes");

      const title = titleEl.value.trim();
      if (!title) {
        alert("Introduce el título o asunto del acta.");
        return;
      }

      const minutes = getMinutes();
      minutes.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        title,
        status: "todo",
        dueDate: "",
        notes: notesEl.value.trim(),
        createdAt: new Date().toISOString()
      });

      setMinutes(minutes);
      titleEl.value = "";
      notesEl.value = "";
      toggleMinuteCreateForm(false);
      renderMinutes();
    }

    function executeMoveMinuteStatus(id, status) {
      const minutes = getMinutes().map(minute => {
        if (minute.id !== id) return minute;
        return {
          ...minute,
          status,
          dueDate: status === "signature" || status === "todo" ? "" : minute.dueDate
        };
      });

      setMinutes(minutes);
      renderMinutes();
    }

    function moveMinuteStatus(id, status) {
      const item = getMinutes().find(minute => minute.id === id);
      const title = item && item.title ? `“${item.title}”` : "esta acta";
      const nextStatus = minuteStatusTableLabel(status).toLowerCase();
      if (typeof confirmDangerAction === "function") {
        confirmDangerAction({
          title: "Cambiar estado de acta",
          message: `¿Quieres cambiar el estado de ${title} a ${nextStatus}?`,
          confirmLabel: "Cambiar estado",
          onConfirm: () => executeMoveMinuteStatus(id, status)
        });
        return;
      }
      executeMoveMinuteStatus(id, status);
    }

    let activeMinuteDueDateId = null;

    function openMinuteDueDateModal(id) {
      const current = getMinutes().find(minute => minute.id === id);
      if (!current || current.status !== "allegations") return;

      activeMinuteDueDateId = id;
      document.getElementById("minuteDueDateModalTitle").textContent = current.title;
      document.getElementById("minuteDueDateInput").value = current.dueDate || "";
      document.getElementById("minuteDueDateModal").classList.add("open");
      setTimeout(() => document.getElementById("minuteDueDateInput").focus(), 0);
    }

    function closeMinuteDueDateModal() {
      activeMinuteDueDateId = null;
      const modal = document.getElementById("minuteDueDateModal");
      if (modal) modal.classList.remove("open");
      const input = document.getElementById("minuteDueDateInput");
      if (input) input.value = "";
    }

    function saveMinuteDueDateFromModal() {
      const input = document.getElementById("minuteDueDateInput");
      const due = input.value;

      if (!activeMinuteDueDateId) return;

      const minutes = getMinutes().map(minute => {
        if (minute.id !== activeMinuteDueDateId) return minute;
        return { ...minute, dueDate: due };
      });

      setMinutes(minutes);
      closeMinuteDueDateModal();
      renderMinutes();
    }



    let editingMinuteId = null;

    function ensureMinuteEditModal() {
      let modal = document.getElementById("minuteEditModal");
      if (modal) return modal;
      modal = document.createElement("div");
      modal.id = "minuteEditModal";
      modal.className = "modal-backdrop";
      modal.innerHTML = `
        <div class="modal-box rrll-pro-modal-box">
          <div class="modal-header">
            <h3>Editar acta</h3>
            <button type="button" class="icon-button" onclick="closeMinuteEditModal()">×</button>
          </div>
          <div class="rrll-pro-task-form rrll-pro-edit-form">
            <label class="rrll-pro-field">
              <span>Título / asunto</span>
              <input id="editMinuteTitle" placeholder="Título o asunto del acta" />
            </label>
            <label class="rrll-pro-field">
              <span>Estado</span>
              <select id="editMinuteStatus">
                <option value="todo">Pendiente de hacer</option>
                <option value="direction">Enviada a Dirección</option>
                <option value="allegations">Pendiente de alegaciones</option>
                <option value="signature">Pendiente de firma</option>
              </select>
            </label>
            <label class="rrll-pro-field">
              <span>Fecha límite alegaciones</span>
              <input id="editMinuteDueDate" type="date" />
            </label>
            <label class="rrll-pro-field rrll-pro-field-full">
              <span>Notas</span>
              <textarea id="editMinuteNotes" rows="5" placeholder="Notas del acta"></textarea>
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary" onclick="closeMinuteEditModal()">Cancelar</button>
            <button type="button" class="danger" onclick="deleteEditingMinute()">Eliminar</button>
            <button type="button" class="primary" onclick="saveEditingMinute()">Guardar cambios</button>
          </div>
        </div>`;
      modal.addEventListener("click", event => {
        if (event.target === modal) closeMinuteEditModal();
      });
      document.body.appendChild(modal);
      return modal;
    }

    function openMinuteEditModal(id) {
      const minute = getMinutes().find(item => item.id === id);
      if (!minute) return;
      editingMinuteId = id;
      const modal = ensureMinuteEditModal();
      const titleEl = document.getElementById("editMinuteTitle");
      const statusEl = document.getElementById("editMinuteStatus");
      const dueEl = document.getElementById("editMinuteDueDate");
      const notesEl = document.getElementById("editMinuteNotes");
      if (titleEl) titleEl.value = minute.title || "";
      if (statusEl) statusEl.value = ["todo", "direction", "allegations", "signature"].includes(minute.status) ? minute.status : "direction";
      if (dueEl) dueEl.value = minute.dueDate || "";
      if (notesEl) notesEl.value = minute.notes || "";
      modal.classList.add("open");
      setTimeout(() => titleEl?.focus(), 0);
    }

    function closeMinuteEditModal() {
      const modal = document.getElementById("minuteEditModal");
      if (modal) modal.classList.remove("open");
      editingMinuteId = null;
    }

    function saveEditingMinute() {
      if (!editingMinuteId) return;
      const title = (document.getElementById("editMinuteTitle")?.value || "").trim();
      const status = document.getElementById("editMinuteStatus")?.value || "direction";
      const dueDate = document.getElementById("editMinuteDueDate")?.value || "";
      const notes = (document.getElementById("editMinuteNotes")?.value || "").trim();
      if (!title) {
        alert("Introduce el título o asunto del acta.");
        return;
      }
      setMinutes(getMinutes().map(minute => minute.id === editingMinuteId ? {
        ...minute,
        title,
        status: ["todo", "direction", "allegations", "signature"].includes(status) ? status : "direction",
        dueDate: status === "allegations" ? dueDate : "",
        notes,
        updatedAt: new Date().toISOString()
      } : minute));
      closeMinuteEditModal();
      renderMinutes();
      if (typeof updateQuickCounts === "function") updateQuickCounts();
      if (typeof renderHomeDashboard === "function") renderHomeDashboard();
    }

    function deleteEditingMinute() {
      if (!editingMinuteId) return;
      const id = editingMinuteId;
      closeMinuteEditModal();
      deleteMinute(id);
    }

    function executeDeleteMinute(id) {
      const minutes = getMinutes();
      const item = minutes.find(minute => minute.id === id);
      if (item) moveToTrash("minutes", item);
      setMinutes(minutes.filter(minute => minute.id !== id));
      renderMinutes();
      renderTrash();
      restoreAlertsPanelState();
      renderAlertsPanel();
    }

    function deleteMinute(id) {
      const item = getMinutes().find(minute => minute.id === id);
      const title = item && item.title ? `“${item.title}”` : "esta acta";
      if (typeof confirmDangerAction === "function") {
        confirmDangerAction({
          title: "Eliminar acta",
          message: `¿Quieres eliminar ${title}? Se enviará a la papelera.`,
          confirmLabel: "Eliminar",
          onConfirm: () => executeDeleteMinute(id)
        });
        return;
      }
      executeDeleteMinute(id);
    }

    function dueClass(dueDate) {
      if (!dueDate) return "";
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const due = new Date(dueDate + "T00:00:00");
      const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return " expired";
      if (diffDays <= 3) return " due-soon";
      return "";
    }

    function dueText(dueDate) {
      if (!dueDate) return "Sin fecha límite";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDate + "T00:00:00");
      const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

      const readable = due.toLocaleDateString("es-ES");
      if (diffDays < 0) return `Fecha límite: ${readable} · Vencida`;
      if (diffDays === 0) return `Fecha límite: ${readable} · Hoy`;
      if (diffDays <= 3) return `Fecha límite: ${readable} · Quedan ${diffDays} días`;
      return `Fecha límite: ${readable}`;
    }

    let minuteViewFilter = "all";

    function setMinuteViewFilter(filter) {
      minuteViewFilter = ["all", "todo", "direction", "allegations", "signature"].includes(filter) ? filter : "all";
      renderMinutes();
    }

    function minuteStatusClass(status) {
      const classes = {
        todo: "pending",
        direction: "progress",
        allegations: "warning",
        signature: "closed"
      };
      return classes[status] || "pending";
    }

    function minuteStatusTableLabel(status) {
      const labels = {
        todo: "Pend. hacer",
        direction: "Dirección",
        allegations: "Alegaciones",
        signature: "Firma"
      };
      return labels[status] || MINUTE_STATUS_LABELS[status] || status;
    }

    function minuteMatchesQuery(minute, query) {
      if (!query) return true;
      return itemSearchText([
        minute.title,
        minute.notes,
        minute.dueDate,
        MINUTE_STATUS_LABELS[minute.status] || minute.status,
        minuteAllegationsSummary(minute)
      ]).includes(query);
    }

    function minuteDueTextShort(minute) {
      if (minute.status !== "allegations") return "No aplica";
      return dueText(minute.dueDate).replace("Fecha límite: ", "");
    }

    function renderMinuteRow(minute) {
      const created = minute.createdAt ? new Date(minute.createdAt).toLocaleDateString("es-ES") : "Sin fecha";
      const statusClass = minuteStatusClass(minute.status);
      const dueClassName = minute.status === "allegations" ? dueClass(minute.dueDate) : "";
      const notes = minute.notes || "Sin notas";

      return `
        <tr id="rrll-minute-${minute.id}" class="rrll-pro-row rrll-minute-row status-${statusClass}" ondblclick="event.preventDefault(); event.stopPropagation(); openMinuteEditModal('${minute.id}')" title="Doble clic para editar · Acta: ${escapeHtml(minute.title || "Sin título")}">
          <td class="rrll-pro-main-cell minute-col-title">
            <div class="rrll-pro-title">${escapeHtml(minute.title || "Sin título")}</div>
            <div class="rrll-pro-subtitle">${escapeHtml(notes)}</div>
          </td>
          <td class="minute-col-status"><span class="rrll-status-pill ${statusClass}">${escapeHtml(minuteStatusTableLabel(minute.status))}</span></td>
          <td class="minute-col-due"><span class="rrll-due-pill${dueClassName}">${escapeHtml(minuteDueTextShort(minute))}</span></td>
          <td class="minute-col-created"><span class="rrll-pro-created">${escapeHtml(created)}</span></td>
          <td class="rrll-pro-actions minute-col-actions" onclick="event.stopPropagation()">
            ${minute.status === "todo" ? `<button type="button" class="small black" onclick="moveMinuteStatus('${minute.id}', 'direction')">Dirección</button>` : ""}
            ${minute.status === "direction" ? `<button type="button" class="small secondary" onclick="moveMinuteStatus('${minute.id}', 'todo')">Pend. hacer</button><button type="button" class="small black" onclick="moveMinuteStatus('${minute.id}', 'allegations')">Alegaciones</button>` : ""}
            ${minute.status === "allegations" ? `<button type="button" class="small secondary" onclick="openMinuteAllegationsModal('${minute.id}')">Aportaciones</button><button type="button" class="small secondary" onclick="openMinuteDueDateModal('${minute.id}')">Fecha límite</button><button type="button" class="small secondary" onclick="moveMinuteStatus('${minute.id}', 'direction')">Dirección</button><button type="button" class="small" onclick="moveMinuteStatus('${minute.id}', 'signature')">Firma</button>` : ""}
            ${minute.status === "signature" ? `<button type="button" class="small secondary" onclick="moveMinuteStatus('${minute.id}', 'allegations')">Alegaciones</button>` : ""}
            <button type="button" class="small danger rrll-delete-icon-button" onclick="deleteMinute('${minute.id}')" title="Eliminar acta" aria-label="Eliminar acta"><span aria-hidden="true">🗑️</span></button>
          </td>
        </tr>
      `;
    }

    function renderMinutes() {
      const minutes = getMinutes().map(minute => {
        if (!["todo", "direction", "allegations", "signature"].includes(minute.status)) {
          return { ...minute, status: "direction" };
        }
        return minute;
      });

      const counts = { todo: 0, direction: 0, allegations: 0, signature: 0 };
      minutes.forEach(minute => {
        counts[minute.status] = (counts[minute.status] || 0) + 1;
      });

      const countAll = document.getElementById("count-minute-all");
      const todoCount = document.getElementById("count-minute-todo");
      const directionCount = document.getElementById("count-direction");
      const allegationsCount = document.getElementById("count-allegations");
      const signatureCount = document.getElementById("count-signature");
      if (countAll) countAll.textContent = minutes.length;
      if (todoCount) todoCount.textContent = counts.todo;
      if (directionCount) directionCount.textContent = counts.direction;
      if (allegationsCount) allegationsCount.textContent = counts.allegations;
      if (signatureCount) signatureCount.textContent = counts.signature;

      document.querySelectorAll("#gestor-actas .rrll-pro-tabs button").forEach(button => button.classList.remove("active"));
      const activeId = minuteViewFilter === "all" ? "minute-filter-all" : `minute-filter-${minuteViewFilter}`;
      const activeFilter = document.getElementById(activeId);
      if (activeFilter) activeFilter.classList.add("active");

      const query = (document.getElementById("minuteInlineSearch")?.value || "").trim().toLowerCase();
      const statusOrder = { allegations: 0, direction: 1, todo: 2, signature: 3 };
      const filtered = minutes
        .filter(minute => minuteViewFilter === "all" || minute.status === minuteViewFilter)
        .filter(minute => minuteMatchesQuery(minute, query))
        .sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const tableBody = document.getElementById("minutesTableBody");
      const empty = document.getElementById("minutesTableEmpty");
      if (tableBody) tableBody.innerHTML = filtered.map(renderMinuteRow).join("");
      if (empty) empty.style.display = filtered.length ? "none" : "block";

      updateQuickCounts();
      renderAlertsPanel();
    }

  const api = {
    getMinutes,
    setMinutes,
    getAllegationUnions,
    setAllegationUnions,
    normalizeMinuteAllegations,
    openMinuteAllegationsModal,
    renderMinuteAllegationsChecklist,
    closeMinuteAllegationsModal,
    saveMinuteAllegationsFromModal,
    minuteAllegationsSummary,
    toggleMinuteCreateForm,
    addMinute,
    executeMoveMinuteStatus,
    moveMinuteStatus,
    openMinuteDueDateModal,
    closeMinuteDueDateModal,
    saveMinuteDueDateFromModal,
    executeDeleteMinute,
    deleteMinute,
    openMinuteEditModal,
    closeMinuteEditModal,
    saveEditingMinute,
    deleteEditingMinute,
    dueClass,
    dueText,
    renderMinutes,
    setMinuteViewFilter
  };

  window.ActasModule = api;

  // Compatibilidad temporal con HTML/app.js mientras se completa Fase 3.
  window.getMinutes = getMinutes;
  window.setMinutes = setMinutes;
  window.getAllegationUnions = getAllegationUnions;
  window.setAllegationUnions = setAllegationUnions;
  window.normalizeMinuteAllegations = normalizeMinuteAllegations;
  window.openMinuteAllegationsModal = openMinuteAllegationsModal;
  window.renderMinuteAllegationsChecklist = renderMinuteAllegationsChecklist;
  window.closeMinuteAllegationsModal = closeMinuteAllegationsModal;
  window.saveMinuteAllegationsFromModal = saveMinuteAllegationsFromModal;
  window.minuteAllegationsSummary = minuteAllegationsSummary;
  window.toggleMinuteCreateForm = toggleMinuteCreateForm;
  window.addMinute = addMinute;
  window.executeMoveMinuteStatus = executeMoveMinuteStatus;
  window.moveMinuteStatus = moveMinuteStatus;
  window.openMinuteDueDateModal = openMinuteDueDateModal;
  window.closeMinuteDueDateModal = closeMinuteDueDateModal;
  window.saveMinuteDueDateFromModal = saveMinuteDueDateFromModal;
  window.executeDeleteMinute = executeDeleteMinute;
  window.deleteMinute = deleteMinute;
  window.openMinuteEditModal = openMinuteEditModal;
  window.closeMinuteEditModal = closeMinuteEditModal;
  window.saveEditingMinute = saveEditingMinute;
  window.deleteEditingMinute = deleteEditingMinute;
  window.dueClass = dueClass;
  window.dueText = dueText;
  window.renderMinutes = renderMinutes;
  window.setMinuteViewFilter = setMinuteViewFilter;
})();
