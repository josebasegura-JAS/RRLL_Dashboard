// Fase 3.3: Gestor de Peticiones encapsulado como módulo independiente.
// Mantiene wrappers globales por compatibilidad con los onclick existentes del HTML.
(function () {
  'use strict';

  // Fase 3: módulo extraído desde app.js sin cambiar funcionalidad.

    function getPetitions() {
      return load("rrll_petitions", []);
    }

    function setPetitions(items) {
      save("rrll_petitions", items);
    }

    function togglePetitionCreateForm(forceOpen) {
      const form = document.getElementById("petitionCreateForm");
      if (!form) return;
      const open = typeof forceOpen === "boolean" ? forceOpen : form.classList.contains("rrll-create-form-collapsed");
      form.classList.toggle("rrll-create-form-collapsed", !open);
      if (open) setTimeout(() => document.getElementById("newPetitionTitle")?.focus(), 0);
    }

    function addPetition() {
      const titleEl = document.getElementById("newPetitionTitle");
      const statusEl = document.getElementById("newPetitionStatus");
      const unionEl = document.getElementById("newPetitionUnion");
      const companyEl = document.getElementById("newPetitionCompany");
      const notesEl = document.getElementById("newPetitionNotes");
      const dueDateEl = document.getElementById("newPetitionDueDate");
      const priorityEl = document.getElementById("newPetitionPriority");

      const title = titleEl.value.trim();
      if (!title) return;

      const rawDueDate = dueDateEl ? dueDateEl.value : "";
      const dueDate = typeof normalizeDateInput === "function" ? normalizeDateInput(rawDueDate) : rawDueDate;
      if (dueDate === null) {
        alert("La fecha límite no es válida.");
        return;
      }

      const sources = [];
      if (unionEl.checked) sources.push("Sindicato");
      if (companyEl.checked) sources.push("Empresa");

      const now = new Date().toISOString();
      const items = getPetitions();
      items.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        title,
        status: "petition-pending",
        sources,
        dueDate,
        priority: priorityEl ? normalizePriority(priorityEl.value) : "normal",
        notes: notesEl.value.trim(),
        updates: [],
        createdAt: now,
        closedAt: null
      });

      setPetitions(items);
      titleEl.value = "";
      if (statusEl) statusEl.value = "petition-pending";
      unionEl.checked = false;
      companyEl.checked = false;
      if (dueDateEl) dueDateEl.value = "";
      if (priorityEl) priorityEl.value = "normal";
      notesEl.value = "";
      togglePetitionCreateForm(false);
      renderPetitions();
    }

    function executeMovePetition(id, status) {
      const now = new Date().toISOString();
      const items = getPetitions().map(item => {
        if (item.id !== id) return item;
        return {
          ...item,
          status,
          closedAt: status === "petition-closed" ? (item.closedAt || now) : null
        };
      });
      setPetitions(items);
      renderPetitions();
    }

    function movePetition(id, status) {
      if (typeof confirmDangerAction !== "function") return;
      const item = getPetitions().find(i => i.id === id);
      const title = item && item.title ? `“${item.title}”` : "esta petición";
      const nextStatus = petitionStatusLabel(status).toLowerCase();
      confirmDangerAction({
        title: "Cambiar estado de petición",
        message: `¿Quieres cambiar el estado de ${title} a ${nextStatus}?`,
        confirmLabel: "Cambiar estado",
        onConfirm: () => executeMovePetition(id, status)
      });
    }

    function executeDeletePetition(id) {
      const items = getPetitions();
      const item = items.find(i => i.id === id);
      if (item) moveToTrash("petitions", item);
      setPetitions(items.filter(i => i.id !== id));
      renderPetitions();
      renderTrash();
      restoreAlertsPanelState();
      renderAlertsPanel();
    }

    function deletePetition(id) {
      if (typeof confirmDangerAction !== "function") return;
      const item = getPetitions().find(i => i.id === id);
      const title = item && item.title ? `“${item.title}”` : "esta petición";
      confirmDangerAction({
        title: "Eliminar petición",
        message: `¿Quieres eliminar ${title}? Se enviará a la papelera.`,
        confirmLabel: "Eliminar",
        onConfirm: () => executeDeletePetition(id)
      });
    }

    let activePetitionUpdateId = null;

    function openPetitionUpdateModal(id) {
      const items = getPetitions();
      const item = items.find(i => i.id === id);
      if (!item) return;

      activePetitionUpdateId = id;
      const sources = Array.isArray(item.sources) ? item.sources : [];
      const titleEl = document.getElementById("petitionUpdateModalTitle");
      if (titleEl) titleEl.textContent = item.title || "Petición sin título";
      const titleInput = document.getElementById("petitionEditTitle");
      const dueInput = document.getElementById("petitionEditDueDate");
      const priorityInput = document.getElementById("petitionEditPriority");
      const statusInput = document.getElementById("petitionEditStatus");
      const notesInput = document.getElementById("petitionEditNotes");
      const unionInput = document.getElementById("petitionEditUnion");
      const companyInput = document.getElementById("petitionEditCompany");
      const updateInput = document.getElementById("petitionUpdateModalText");

      if (titleInput) titleInput.value = item.title || "";
      if (dueInput) dueInput.value = typeof normalizeDateInput === "function" ? (normalizeDateInput(item.dueDate) || "") : (item.dueDate || "");
      if (priorityInput) priorityInput.value = normalizePriority(item.priority);
      if (statusInput) statusInput.value = item.status || "petition-pending";
      if (notesInput) notesInput.value = item.notes || "";
      if (unionInput) unionInput.checked = sources.includes("Sindicato");
      if (companyInput) companyInput.checked = sources.includes("Empresa");
      if (updateInput) updateInput.value = "";
      renderEditableUpdates("petitionExistingUpdates", item.updates || []);

      document.getElementById("petitionUpdateModal").classList.add("open");
      setTimeout(() => (updateInput || titleInput)?.focus(), 0);
    }

    function closePetitionUpdateModal() {
      activePetitionUpdateId = null;
      const modal = document.getElementById("petitionUpdateModal");
      if (modal) modal.classList.remove("open");
      ["petitionEditTitle", "petitionEditDueDate", "petitionEditNotes", "petitionUpdateModalText"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      const unionInput = document.getElementById("petitionEditUnion");
      const companyInput = document.getElementById("petitionEditCompany");
      if (unionInput) unionInput.checked = false;
      if (companyInput) companyInput.checked = false;
    }

    function savePetitionUpdateFromModal() {
      if (!activePetitionUpdateId) return;

      const title = (document.getElementById("petitionEditTitle")?.value || "").trim();
      if (!title) {
        alert("La petición necesita un título.");
        return;
      }

      const sources = [];
      if (document.getElementById("petitionEditUnion")?.checked) sources.push("Sindicato");
      if (document.getElementById("petitionEditCompany")?.checked) sources.push("Empresa");

      const status = document.getElementById("petitionEditStatus")?.value || "petition-pending";
      const rawDueDate = document.getElementById("petitionEditDueDate")?.value || "";
      const dueDate = typeof normalizeDateInput === "function" ? normalizeDateInput(rawDueDate) : rawDueDate;
      if (dueDate === null) {
        alert("La fecha límite no es válida.");
        return;
      }
      const priority = normalizePriority(document.getElementById("petitionEditPriority")?.value || "normal");
      const notes = (document.getElementById("petitionEditNotes")?.value || "").trim();
      const updateText = (document.getElementById("petitionUpdateModalText")?.value || "").trim();
      const now = new Date().toISOString();

      const updatedItems = getPetitions().map(item => {
        if (item.id !== activePetitionUpdateId) return item;
        const editedUpdates = collectEditableUpdates("petitionExistingUpdates", item.updates || []);
        const updates = updateText
          ? [...editedUpdates, { text: updateText, createdAt: now }]
          : editedUpdates;
        return {
          ...item,
          title,
          status,
          sources,
          dueDate,
          priority,
          notes,
          closedAt: status === "petition-closed" ? (item.closedAt || now) : null,
          updatedAt: now,
          updates
        };
      });

      setPetitions(updatedItems);
      closePetitionUpdateModal();
      renderPetitions();
    }

    let petitionViewFilter = "all";
    let petitionSortField = "status";
    let petitionSortDirection = "asc";

    function setPetitionViewFilter(filter) {
      petitionViewFilter = ["all", "petition-pending", "petition-progress", "petition-closed"].includes(filter) ? filter : "all";
      renderPetitions();
    }

    function petitionStatusLabel(status) {
      const labels = {
        "petition-pending": "Pendiente",
        "petition-progress": "En curso",
        "petition-closed": "Cerrada"
      };
      return labels[status] || "Sin estado";
    }

    function petitionStatusClass(status) {
      const classes = {
        "petition-pending": "pending",
        "petition-progress": "progress",
        "petition-closed": "closed"
      };
      return classes[status] || "pending";
    }

    function lastPetitionUpdate(item) {
      const updates = Array.isArray(item.updates) ? item.updates : [];
      if (!updates.length) return "Sin avances";
      const last = updates[updates.length - 1];
      const date = last.createdAt ? new Date(last.createdAt).toLocaleDateString("es-ES") : "Sin fecha";
      return `${date}: ${last.text || "Actualización sin texto"}`;
    }

    function petitionMatchesQuery(item, query) {
      if (!query) return true;
      const updates = Array.isArray(item.updates) ? item.updates.map(update => update.text || "").join(" ") : "";
      const sources = Array.isArray(item.sources) ? item.sources.join(" ") : "";
      return itemSearchText([item.title, item.notes, item.dueDate, petitionStatusLabel(item.status), priorityLabel(item.priority), sources, updates]).includes(query);
    }

    function togglePetitionRowDetails(event, id) {
      if (event && event.target && event.target.closest && event.target.closest("button, a, input, select, textarea, label")) return;
      const row = document.getElementById(`rrll-petition-${id}`);
      if (row) row.classList.toggle("expanded");
    }


    function petitionPriorityBadgeHtml(value) {
      const raw = String(value || "normal").toLowerCase();
      const normalized = raw === "low" || raw === "baja" ? "low" : normalizePriority(value);
      const labels = { low: "Baja", baja: "Baja", normal: "Normal", high: "Alta", alta: "Alta" };
      const label = labels[raw] || priorityLabel(value).replace(/^Prioridad:\s*/i, "");
      return `<span class="priority-badge priority-${normalized}">${escapeHtml(label)}</span>`;
    }

    function petitionDueSummaryText(due, hasDueDate) {
      if (!hasDueDate) return "Sin fecha";
      if (due.diffDays < 0) return "Vencida";
      if (due.diffDays === 0) return "Hoy";
      if (due.diffDays <= 5) return "Próxima";
      return "Con fecha";
    }

    function renderPetitionRow(item) {
      const due = dueStatus(item.dueDate);
      const created = item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-ES") : "Sin fecha";
      const closed = item.closedAt ? new Date(item.closedAt).toLocaleDateString("es-ES") : "";
      const dueText = petitionDueSummaryText(due, item.dueDate);
      const dueDetail = item.dueDate ? due.text : "Sin fecha límite";
      const notes = item.notes || "Sin notas";
      const statusClass = petitionStatusClass(item.status);
      const sourceHtml = (item.sources && item.sources.length)
        ? item.sources.map(source => `<span class="petition-source rrll-pro-source">${escapeHtml(source)}</span>`).join("")
        : `<span class="petition-source rrll-pro-source">Sin clasificar</span>`;

      return `
        <tr id="rrll-petition-${item.id}" class="rrll-pro-row rrll-petition-row status-${statusClass}" onclick="togglePetitionRowDetails(event, '${item.id}')" ondblclick="event.preventDefault(); event.stopPropagation(); openPetitionUpdateModal('${item.id}')" title="Clic para desplegar detalle · Doble clic para editar">
          <td class="rrll-pro-main-cell">
            <div class="rrll-pro-title">${escapeHtml(item.title || "Sin título")}</div>
            <div class="rrll-pro-subtitle">${escapeHtml(notes)}</div>
            <div class="rrll-pro-created">Creada: ${escapeHtml(created)}${closed ? ` · Cerrada: ${escapeHtml(closed)}` : ""}</div>
            <div class="rrll-pro-due-detail">${escapeHtml(dueDetail)}</div>
          </td>
          <td>${sourceHtml}</td>
          <td>${petitionPriorityBadgeHtml(item.priority)}</td>
          <td><span class="rrll-status-pill ${statusClass}">${escapeHtml(petitionStatusLabel(item.status))}</span></td>
          <td><span class="rrll-due-pill${due.className}" title="${escapeHtml(dueDetail)}">${escapeHtml(dueText)}</span></td>
          <td class="rrll-pro-actions" onclick="event.stopPropagation()">
            ${item.status !== "petition-pending" ? `<button class="small secondary" onclick="movePetition('${item.id}', 'petition-pending')">Pendiente</button>` : ""}
            ${item.status !== "petition-progress" ? `<button class="small black" onclick="movePetition('${item.id}', 'petition-progress')">En curso</button>` : ""}
            ${item.status !== "petition-closed" ? `<button class="small" onclick="movePetition('${item.id}', 'petition-closed')">Cerrar</button>` : ""}
            <button class="small danger rrll-delete-icon-button" onclick="deletePetition('${item.id}')" title="Eliminar petición" aria-label="Eliminar petición"><span aria-hidden="true">🗑️</span></button>
          </td>
        </tr>
      `;
    }

    function petitionSourceText(item) {
      const sources = Array.isArray(item.sources) ? item.sources : [];
      return sources.join(", ") || "Sin clasificar";
    }

    function petitionSortValue(item, field) {
      if (!item) return "";
      const lastUpdate = lastPetitionUpdate(item);
      const priorityOrder = { critical: 3, high: 2, normal: 1 };
      const statusOrder = { "petition-progress": 3, "petition-pending": 2, "petition-closed": 1 };
      switch (field) {
        case "title": return String(item.title || "").toLocaleLowerCase("es-ES");
        case "source": return petitionSourceText(item).toLocaleLowerCase("es-ES");
        case "priority": return priorityOrder[normalizePriority(item.priority)] || 0;
        case "status": return statusOrder[item.status] || 0;
        case "dueDate": return item.dueDate || "9999-12-31";
        case "update": return String(lastUpdate || "").toLocaleLowerCase("es-ES");
        default: return String(item.title || "").toLocaleLowerCase("es-ES");
      }
    }

    function comparePetitionsByField(a, b, field) {
      const av = petitionSortValue(a, field);
      const bv = petitionSortValue(b, field);
      if (typeof av === "number" || typeof bv === "number") return (Number(av) || 0) - (Number(bv) || 0);
      return String(av).localeCompare(String(bv), "es-ES", { numeric: true, sensitivity: "base" });
    }

    function sortPetitions(items) {
      const direction = petitionSortDirection === "desc" ? -1 : 1;
      return [...items].sort((a, b) => {
        const byField = comparePetitionsByField(a, b, petitionSortField) * direction;
        if (byField) return byField;
        return String(a.title || "").localeCompare(String(b.title || ""), "es-ES", { numeric: true, sensitivity: "base" });
      });
    }

    function setPetitionSort(field) {
      if (!field) return;
      if (petitionSortField === field) {
        petitionSortDirection = petitionSortDirection === "asc" ? "desc" : "asc";
      } else {
        petitionSortField = field;
        petitionSortDirection = field === "dueDate" ? "asc" : "asc";
      }
      renderPetitions();
    }

    function updatePetitionSortHeaders() {
      document.querySelectorAll("#gestor-peticiones th[data-petition-sort]").forEach(th => {
        const field = th.getAttribute("data-petition-sort");
        const active = field === petitionSortField;
        th.classList.toggle("sorted", active);
        th.classList.toggle("sorted-asc", active && petitionSortDirection === "asc");
        th.classList.toggle("sorted-desc", active && petitionSortDirection === "desc");
        th.setAttribute("aria-sort", active ? (petitionSortDirection === "asc" ? "ascending" : "descending") : "none");
        const base = th.getAttribute("data-sort-label") || th.textContent.replace(/[↑↓]/g, "").trim();
        th.setAttribute("data-sort-label", base);
        th.innerHTML = `${escapeHtml(base)} <span class="rrll-sort-indicator">${active ? (petitionSortDirection === "asc" ? "↑" : "↓") : "↕"}</span>`;
      });
    }

    function getVisiblePetitions() {
      const query = (document.getElementById("petitionInlineSearch")?.value || "").trim().toLowerCase();
      const filtered = getPetitions()
        .filter(item => petitionViewFilter === "petition-closed" ? item.status === "petition-closed" : item.status !== "petition-closed")
        .filter(item => petitionViewFilter === "all" || petitionViewFilter === "petition-closed" || item.status === petitionViewFilter)
        .filter(item => petitionMatchesQuery(item, query));
      return sortPetitions(filtered);
    }

    function renderPetitions() {
      const items = getPetitions();
      const tableBody = document.getElementById("petitionsTableBody");
      const empty = document.getElementById("petitionsTableEmpty");

      const counts = {
        "petition-pending": items.filter(item => item.status === "petition-pending").length,
        "petition-progress": items.filter(item => item.status === "petition-progress").length,
        "petition-closed": items.filter(item => item.status === "petition-closed").length
      };

      const pendingEl = document.getElementById("count-petition-pending");
      const progressEl = document.getElementById("count-petition-progress");
      const closedEl = document.getElementById("count-petition-closed");
      if (pendingEl) pendingEl.textContent = counts["petition-pending"];
      if (progressEl) progressEl.textContent = counts["petition-progress"];
      if (closedEl) closedEl.textContent = counts["petition-closed"];

      document.querySelectorAll("#gestor-peticiones .rrll-pro-tabs button").forEach(button => button.classList.remove("active"));
      const activeId = petitionViewFilter === "all" ? "petition-filter-all" : `petition-filter-${petitionViewFilter.replace("petition-", "")}`;
      const activeFilter = document.getElementById(activeId);
      if (activeFilter) activeFilter.classList.add("active");

      const filtered = getVisiblePetitions();
      updatePetitionSortHeaders();

      if (tableBody) {
        tableBody.innerHTML = filtered.map(renderPetitionRow).join("");
        tableBody.querySelectorAll(".rrll-petition-row").forEach(row => {
          row.addEventListener("dblclick", event => {
            if (event.target && event.target.closest && event.target.closest("button, a, input, select, textarea, label")) return;
            event.preventDefault();
            event.stopPropagation();
            const id = row.id.replace("rrll-petition-", "");
            openPetitionUpdateModal(id);
          });
        });
      } else {
        ["petition-pending", "petition-progress", "petition-closed"].forEach(status => {
          const el = document.getElementById(status);
          if (el) el.innerHTML = "";
        });
      }
      if (empty) empty.style.display = filtered.length ? "none" : "block";

      updateQuickCounts();
      renderAlertsPanel();
    }




  // Helpers locales: evitan depender del módulo de Tareas para editar actualizaciones.
  function renderPetitionEditableUpdates(containerId, updates) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const safeUpdates = Array.isArray(updates) ? updates : [];
    if (!safeUpdates.length) {
      container.innerHTML = `<p class="muted">No hay actualizaciones anteriores.</p>`;
      return;
    }
    container.innerHTML = safeUpdates.map((update, index) => `
      <div class="existing-update-row">
        <label>${escapeHtml(datePrint(update.createdAt || ""))}</label>
        <textarea data-update-index="${index}" placeholder="Texto de la actualización">${escapeHtml(update.text || "")}</textarea>
      </div>
    `).join("");
  }

  function collectPetitionEditableUpdates(containerId, originalUpdates) {
    const container = document.getElementById(containerId);
    const originals = Array.isArray(originalUpdates) ? originalUpdates : [];
    if (!container) return originals;
    return Array.from(container.querySelectorAll("textarea[data-update-index]")).map(textarea => {
      const index = Number(textarea.getAttribute("data-update-index"));
      const original = originals[index] || {};
      return {
        ...original,
        text: textarea.value.trim(),
        editedAt: new Date().toISOString()
      };
    }).filter(update => update.text);
  }

  // Se sustituyen las llamadas genéricas por helpers propios del módulo.
  const _openPetitionUpdateModal = openPetitionUpdateModal;
  openPetitionUpdateModal = function(id) {
    const items = getPetitions();
    const item = items.find(i => i.id === id);
    if (!item) return;

    activePetitionUpdateId = id;
    const sources = Array.isArray(item.sources) ? item.sources : [];
    const titleEl = document.getElementById("petitionUpdateModalTitle");
    if (titleEl) titleEl.textContent = item.title || "Petición sin título";
    const titleInput = document.getElementById("petitionEditTitle");
    const dueInput = document.getElementById("petitionEditDueDate");
    const priorityInput = document.getElementById("petitionEditPriority");
    const statusInput = document.getElementById("petitionEditStatus");
    const notesInput = document.getElementById("petitionEditNotes");
    const unionInput = document.getElementById("petitionEditUnion");
    const companyInput = document.getElementById("petitionEditCompany");
    const updateInput = document.getElementById("petitionUpdateModalText");

    if (titleInput) titleInput.value = item.title || "";
    if (dueInput) dueInput.value = item.dueDate || "";
    if (priorityInput) priorityInput.value = normalizePriority(item.priority);
    if (statusInput) statusInput.value = item.status || "petition-pending";
    if (notesInput) notesInput.value = item.notes || "";
    if (unionInput) unionInput.checked = sources.includes("Sindicato");
    if (companyInput) companyInput.checked = sources.includes("Empresa");
    if (updateInput) updateInput.value = "";
    renderPetitionEditableUpdates("petitionExistingUpdates", item.updates || []);

    document.getElementById("petitionUpdateModal").classList.add("open");
    setTimeout(() => (updateInput || titleInput)?.focus(), 0);
  };

  const _savePetitionUpdateFromModal = savePetitionUpdateFromModal;
  savePetitionUpdateFromModal = function() {
    if (!activePetitionUpdateId) return;

    const title = (document.getElementById("petitionEditTitle")?.value || "").trim();
    if (!title) {
      alert("La petición necesita un título.");
      return;
    }

    const sources = [];
    if (document.getElementById("petitionEditUnion")?.checked) sources.push("Sindicato");
    if (document.getElementById("petitionEditCompany")?.checked) sources.push("Empresa");

    const status = document.getElementById("petitionEditStatus")?.value || "petition-pending";
    const rawDueDate = document.getElementById("petitionEditDueDate")?.value || "";
    const dueDate = typeof normalizeDateInput === "function" ? normalizeDateInput(rawDueDate) : rawDueDate;
    if (dueDate === null) {
      alert("La fecha límite no es válida.");
      return;
    }
    const priority = normalizePriority(document.getElementById("petitionEditPriority")?.value || "normal");
    const notes = (document.getElementById("petitionEditNotes")?.value || "").trim();
    const updateText = (document.getElementById("petitionUpdateModalText")?.value || "").trim();
    const now = new Date().toISOString();

    const updatedItems = getPetitions().map(item => {
      if (item.id !== activePetitionUpdateId) return item;
      const editedUpdates = collectPetitionEditableUpdates("petitionExistingUpdates", item.updates || []);
      const updates = updateText
        ? [...editedUpdates, { text: updateText, createdAt: now }]
        : editedUpdates;
      return {
        ...item,
        title,
        status,
        sources,
        dueDate,
        priority,
        notes,
        closedAt: status === "petition-closed" ? (item.closedAt || now) : null,
        updatedAt: now,
        updates
      };
    });

    setPetitions(updatedItems);
    closePetitionUpdateModal();
    renderPetitions();
  };

  const api = {
    getPetitions,
    setPetitions,
    addPetition,
    togglePetitionCreateForm,
    movePetition,
    deletePetition,
    openPetitionUpdateModal,
    closePetitionUpdateModal,
    savePetitionUpdateFromModal,
    renderPetitions,
    setPetitionViewFilter,
    togglePetitionRowDetails,
    setPetitionSort,
    getVisiblePetitions
  };

  window.PeticionesModule = api;

  // Compatibilidad temporal con HTML/app.js mientras se completa Fase 3.
  window.getPetitions = getPetitions;
  window.setPetitions = setPetitions;
  window.addPetition = addPetition;
  window.togglePetitionCreateForm = togglePetitionCreateForm;
  window.movePetition = movePetition;
  window.deletePetition = deletePetition;
  window.openPetitionUpdateModal = openPetitionUpdateModal;
  window.closePetitionUpdateModal = closePetitionUpdateModal;
  window.savePetitionUpdateFromModal = savePetitionUpdateFromModal;
  window.renderPetitions = renderPetitions;
  window.setPetitionViewFilter = setPetitionViewFilter;
  window.togglePetitionRowDetails = togglePetitionRowDetails;
  window.setPetitionSort = setPetitionSort;
  window.getVisiblePetitions = getVisiblePetitions;
})();
