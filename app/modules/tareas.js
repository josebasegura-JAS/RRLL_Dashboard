// Fase 3.2: Gestor de Tareas encapsulado como módulo independiente.
// Mantiene wrappers globales por compatibilidad con los onclick existentes del HTML.
(function () {
  'use strict';

  // Fase 3: módulo extraído desde app.js sin cambiar funcionalidad.


      function ensureDangerConfirmModal() {
        let modal = document.getElementById("dangerConfirmModal");
        if (modal) return modal;

        modal = document.createElement("div");
        modal.id = "dangerConfirmModal";
        modal.className = "modal-backdrop rrll-confirm-delete-modal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "dangerConfirmTitle");
        modal.innerHTML = `
          <div class="modal-box rrll-confirm-delete-box" role="document">
            <div class="rrll-confirm-delete-icon" aria-hidden="true">!</div>
            <h3 id="dangerConfirmTitle">Confirmar eliminación</h3>
            <p id="dangerConfirmText" class="muted">Esta acción enviará el elemento a la papelera.</p>
            <div class="modal-actions rrll-confirm-delete-actions">
              <button type="button" class="secondary" data-confirm-cancel>Cancelar</button>
              <button type="button" class="danger" data-confirm-delete>Eliminar</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        return modal;
      }

      function confirmDangerAction(options) {
        const modal = ensureDangerConfirmModal();
        const titleEl = modal.querySelector("#dangerConfirmTitle");
        const textEl = modal.querySelector("#dangerConfirmText");
        const cancelButton = modal.querySelector("[data-confirm-cancel]");
        const deleteButton = modal.querySelector("[data-confirm-delete]");
        const action = options && typeof options.onConfirm === "function" ? options.onConfirm : null;

        if (titleEl) titleEl.textContent = (options && options.title) || "Confirmar eliminación";
        if (textEl) textEl.textContent = (options && options.message) || "Esta acción enviará el elemento a la papelera.";
        if (deleteButton) deleteButton.textContent = (options && options.confirmLabel) || "Eliminar";

        function close() {
          modal.classList.remove("open");
          modal.removeEventListener("click", handleBackdropClick);
          document.removeEventListener("keydown", handleEscape);
          cancelButton?.removeEventListener("click", handleCancel);
          deleteButton?.removeEventListener("click", handleConfirm);
        }

        function handleCancel() {
          close();
        }

        function handleConfirm() {
          close();
          if (action) action();
        }

        function handleBackdropClick(event) {
          if (event.target === modal) close();
        }

        function handleEscape(event) {
          if (event.key === "Escape" && modal.classList.contains("open")) close();
        }

        cancelButton?.addEventListener("click", handleCancel);
        deleteButton?.addEventListener("click", handleConfirm);
        modal.addEventListener("click", handleBackdropClick);
        document.addEventListener("keydown", handleEscape);
        modal.classList.add("open");
        setTimeout(() => cancelButton?.focus(), 0);
      }


      function taskOriginValue(task) {
        if (typeof petitionOriginValue === "function") return petitionOriginValue(task);
        return String((task && task.origin) || "").trim().toUpperCase();
      }

      function taskOriginOptionsHtml(selectedValue, includeEmpty) {
        if (typeof petitionOriginOptionsHtml === "function") return petitionOriginOptionsHtml(selectedValue, includeEmpty);
        const selected = taskOriginValue({ origin: selectedValue });
        return `${includeEmpty ? `<option value="">Sin origen</option>` : ""}${selected ? `<option value="${escapeHtml(selected)}" selected>${escapeHtml(selected)}</option>` : ""}`;
      }

      function populateTaskOriginSelect(selectId, selectedValue, includeEmpty) {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = taskOriginOptionsHtml(selectedValue, includeEmpty);
        select.value = taskOriginValue({ origin: selectedValue }) || "";
      }

      function taskOriginBadgeHtml(value) {
        if (typeof petitionOriginBadgeHtml === "function") return petitionOriginBadgeHtml(value, "task-origin-badge");
        const origin = taskOriginValue({ origin: value });
        return `<span class="task-origin-badge${origin ? "" : " is-empty"}">${escapeHtml(origin || "Sin origen")}</span>`;
      }

      function closeLinkedPetitionIfNeeded(task, status) {
        if (status !== "closed" || !task || !task.petitionId || typeof getPetitions !== "function" || typeof setPetitions !== "function") return;
        const now = new Date().toISOString();
        const petitions = getPetitions().map(petition => petition.id === task.petitionId
          ? { ...petition, status: "petition-closed", closedAt: petition.closedAt || now, updatedAt: now }
          : petition);
        setPetitions(petitions);
        if (typeof renderPetitions === "function") renderPetitions();
      }

      function getTasks() {
        return load("rrll_tasks", []);
      }

      function setTasks(tasks) {
        save("rrll_tasks", tasks);
      }

      function toggleTaskCreateForm(forceOpen) {
        const form = document.getElementById("taskCreateForm");
        if (!form) return;
        const open = typeof forceOpen === "boolean" ? forceOpen : form.classList.contains("rrll-create-form-collapsed");
        form.classList.toggle("rrll-create-form-collapsed", !open);
        if (open) setTimeout(() => document.getElementById("newTaskTitle")?.focus(), 0);
      }

      function addTask() {
        const titleEl = document.getElementById("newTaskTitle");
        const notesEl = document.getElementById("newTaskNotes");
        const statusEl = document.getElementById("newTaskStatus");
        const dueDateEl = document.getElementById("newTaskDueDate");
        const priorityEl = document.getElementById("newTaskPriority");
        const originEl = document.getElementById("newTaskOrigin");

        const title = titleEl.value.trim();
        if (!title) return;

        const rawDueDate = dueDateEl ? dueDateEl.value : "";
        const dueDate = typeof normalizeDateInput === "function" ? normalizeDateInput(rawDueDate) : rawDueDate;
        if (dueDate === null) {
          alert("La fecha límite no es válida.");
          return;
        }

        const now = new Date().toISOString();
        const status = statusEl.value;
        const attachments = Array.isArray(window.__taskDraftAttachments) ? window.__taskDraftAttachments : [];

        const tasks = getTasks();
        tasks.unshift({
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          title,
          notes: notesEl.value.trim(),
          status,
          dueDate,
          priority: priorityEl ? normalizePriority(priorityEl.value) : "normal",
          origin: taskOriginValue({ origin: originEl ? originEl.value : "" }),
          petitionId: null,
          createdAt: now,
          closedAt: status === "closed" ? now : null,
          updates: [],
          attachments
        });

        setTasks(tasks);
        titleEl.value = "";
        notesEl.value = "";
        statusEl.value = "pending";
        if (dueDateEl) dueDateEl.value = "";
        if (priorityEl) priorityEl.value = "normal";
        populateTaskOriginSelect("newTaskOrigin", "", true);
        window.__taskDraftAttachments = [];
        if (typeof renderTaskAttachments === "function") renderTaskAttachments("newTaskAttachmentsList", []);
        toggleTaskCreateForm(false);
        renderTasks();
      }

      function executeMoveTask(id, status) {
        const now = new Date().toISOString();
        const tasks = getTasks().map(task => {
          if (task.id !== id) return task;
          return {
            ...task,
            status,
            closedAt: status === "closed" ? (task.closedAt || now) : null
          };
        });
        const movedTask = tasks.find(task => task.id === id);
        setTasks(tasks);
        closeLinkedPetitionIfNeeded(movedTask, status);
        renderTasks();
      }

      function moveTask(id, status) {
        const item = getTasks().find(task => task.id === id);
        const title = item && item.title ? `“${item.title}”` : "esta tarea";
        const nextStatus = taskStatusLabel(status).toLowerCase();
        confirmDangerAction({
          title: "Cambiar estado de tarea",
          message: `¿Quieres cambiar el estado de ${title} a ${nextStatus}?`,
          confirmLabel: "Cambiar estado",
          onConfirm: () => executeMoveTask(id, status)
        });
      }

      function executeDeleteTask(id) {
        try { window.clearEditingLock?.("tareas", id); } catch (error) { console.warn("No se pudo liberar lock al eliminar tarea:", error); }
        const tasks = getTasks();
        const item = tasks.find(task => task.id === id);
        if (item) moveToTrash("tasks", item);
        setTasks(tasks.filter(task => task.id !== id));
        renderTasks();
        renderTrash();
        restoreAlertsPanelState();
        renderAlertsPanel();
      }

      function deleteTask(id) {
        const item = getTasks().find(task => task.id === id);
        const title = item && item.title ? `“${item.title}”` : "esta tarea";
        confirmDangerAction({
          title: "Eliminar tarea",
          message: `¿Quieres eliminar ${title}? Se enviará a la papelera.`,
          confirmLabel: "Eliminar",
          onConfirm: () => executeDeleteTask(id)
        });
      }

      function isClosedWithinLastMonth(task) {
        if (task.status !== "closed") return false;
        const closed = new Date(task.closedAt || task.createdAt);
        const limit = new Date();
        limit.setDate(limit.getDate() - 30);
        return closed >= limit;
      }

      function executeDeleteVisibleClosedTasks() {
        const tasks = getTasks();
        const visibleClosed = tasks.filter(task => isClosedWithinLastMonth(task));
        visibleClosed.forEach(task => moveToTrash("tasks", task));
        setTasks(tasks.filter(task => !isClosedWithinLastMonth(task)));
        renderTasks();
        renderTrash();
        restoreAlertsPanelState();
        renderAlertsPanel();
      }

      function deleteVisibleClosedTasks() {
        const count = getTasks().filter(task => isClosedWithinLastMonth(task)).length;
        confirmDangerAction({
          title: "Eliminar tareas cerradas",
          message: `¿Quieres eliminar ${count} tareas cerradas visibles? Se enviarán a la papelera.`,
          confirmLabel: "Eliminar",
          onConfirm: executeDeleteVisibleClosedTasks
        });
      }

      let activeTaskUpdateId = null;

      function renderEditableUpdates(containerId, updates) {
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

      function collectEditableUpdates(containerId, originalUpdates) {
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

      async function openTaskUpdateModal(id) {
        try {
          const lock = await window.acquireEditingLock?.("tareas", id);
          if (lock && lock.allowed === false) { window.showEditingLockBlockedMessage?.(lock.lock); return; }
        } catch (error) {
          console.warn("Fallo al validar lock de tarea. Se permite edición por seguridad:", error);
        }
        const tasks = getTasks();
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        activeTaskUpdateId = id;
        window.startEditingLockHeartbeat?.("tareas", id);
        const titleEl = document.getElementById("taskUpdateModalTitle");
        const titleInput = document.getElementById("taskEditTitle");
        const dueInput = document.getElementById("taskEditDueDate");
        const priorityInput = document.getElementById("taskEditPriority");
        const statusInput = document.getElementById("taskEditStatus");
        const notesInput = document.getElementById("taskEditNotes");
        const originInput = document.getElementById("taskEditOrigin");
        const updateInput = document.getElementById("taskUpdateModalText");

        if (titleEl) titleEl.textContent = task.title || "Tarea sin título";
        if (titleInput) titleInput.value = task.title || "";
        if (dueInput) dueInput.value = typeof normalizeDateInput === "function" ? (normalizeDateInput(task.dueDate) || "") : (task.dueDate || "");
        if (priorityInput) priorityInput.value = normalizePriority(task.priority);
        if (statusInput) statusInput.value = task.status || "pending";
        if (notesInput) notesInput.value = task.notes || "";
        populateTaskOriginSelect("taskEditOrigin", taskOriginValue(task), true);
        if (updateInput) updateInput.value = "";
        renderEditableUpdates("taskExistingUpdates", task.updates || []);
        window.__taskDraftAttachments = Array.isArray(task.attachments) ? [...task.attachments] : [];
        if (typeof renderTaskAttachments === "function") renderTaskAttachments("taskAttachmentsList", window.__taskDraftAttachments);

        document.getElementById("taskUpdateModal").classList.add("open");
        setTimeout(() => (updateInput || titleInput)?.focus(), 0);
      }

      async function closeTaskUpdateModal() {
        const closingId = activeTaskUpdateId;
        activeTaskUpdateId = null;
        if (closingId) {
          window.clearEditingLockHeartbeat?.("tareas", closingId);
          try { window.clearEditingLock?.("tareas", closingId); } catch (error) { console.warn("No se pudo liberar lock al cerrar modal:", error); }
        }
        const modal = document.getElementById("taskUpdateModal");
        if (modal) modal.classList.remove("open");
        ["taskEditTitle", "taskEditDueDate", "taskEditNotes", "taskUpdateModalText", "taskEditOrigin"].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = "";
        });
        await window.runPendingRemoteRefreshIfNeeded?.();
      }

      async function saveTaskUpdateFromModal() {
        if (!activeTaskUpdateId) return;

        const title = (document.getElementById("taskEditTitle")?.value || "").trim();
        if (!title) {
          alert("La tarea necesita un título.");
          return;
        }

        const status = document.getElementById("taskEditStatus")?.value || "pending";
        const rawDueDate = document.getElementById("taskEditDueDate")?.value || "";
        const dueDate = typeof normalizeDateInput === "function" ? normalizeDateInput(rawDueDate) : rawDueDate;
        if (dueDate === null) {
          alert("La fecha límite no es válida.");
          return;
        }
        const priority = normalizePriority(document.getElementById("taskEditPriority")?.value || "normal");
        const origin = taskOriginValue({ origin: document.getElementById("taskEditOrigin")?.value || "" });
        const notes = (document.getElementById("taskEditNotes")?.value || "").trim();
        const updateText = (document.getElementById("taskUpdateModalText")?.value || "").trim();
        const now = new Date().toISOString();

        const updated = getTasks().map(task => {
          if (task.id !== activeTaskUpdateId) return task;
          const editedUpdates = collectEditableUpdates("taskExistingUpdates", task.updates || []);
          const updates = updateText
            ? [...editedUpdates, { text: updateText, createdAt: now }]
            : editedUpdates;
          return {
            ...task,
            title,
            notes,
            status,
            dueDate,
            priority,
            origin,
            closedAt: status === "closed" ? (task.closedAt || now) : null,
            updatedAt: now,
            updates,
            attachments: Array.isArray(window.__taskDraftAttachments) ? window.__taskDraftAttachments : []
          };
        });

        const updatedTask = updated.find(task => task.id === activeTaskUpdateId);
        setTasks(updated);
        if (activeTaskUpdateId) {
          window.clearEditingLockHeartbeat?.("tareas", activeTaskUpdateId);
          try { window.clearEditingLock?.("tareas", activeTaskUpdateId); } catch (error) { console.warn("No se pudo liberar lock al guardar tarea:", error); }
        }
        closeLinkedPetitionIfNeeded(updatedTask, status);
        await closeTaskUpdateModal();
        renderTasks();
      }


      function setPie(id, first, second) {
        const el = document.getElementById(id);
        if (!el) return;
        const total = first + second;
        const degrees = total ? Math.round((first / total) * 360) : 0;
        el.style.background = `conic-gradient(var(--red) 0deg ${degrees}deg, var(--chart-gray) ${degrees}deg 360deg)`;
      }


      const CLOSED_COLUMN_KEYS = {
        tasks: "rrll_closed_column_tasks_open",
        agenda: "rrll_closed_column_agenda_open",
        paritaria: "rrll_closed_column_paritaria_open",
        petitions: "rrll_closed_column_petitions_open"
      };

      function isClosedColumnOpen(module) {
        return load(CLOSED_COLUMN_KEYS[module], false) === true;
      }

      function setClosedColumnOpen(module, isOpen) {
        save(CLOSED_COLUMN_KEYS[module], !!isOpen);
        applyClosedColumnState(module);
      }

      function toggleClosedColumn(module) {
        setClosedColumnOpen(module, !isClosedColumnOpen(module));
      }

      function applyClosedColumnState(module) {
        const columns = document.getElementById(`${module}-columns`);
        const toggle = document.getElementById(`toggle-closed-${module}`);
        if (!columns) return;

        const isOpen = isClosedColumnOpen(module);
        columns.classList.toggle("closed-open", isOpen);
        if (toggle) {
          toggle.textContent = isOpen ? "‹" : "›";
          toggle.title = isOpen ? "Ocultar cerradas" : "Mostrar cerradas";
        }
      }

      function applyAllClosedColumnStates() {
        Object.keys(CLOSED_COLUMN_KEYS).forEach(applyClosedColumnState);
      }

      function updateQuickCounts() {
        const tasks = getTasks();
        const taskPending = tasks.filter(t => t.status === "pending").length;
        const taskProgress = tasks.filter(t => t.status === "progress").length;
        const agenda = getAgendaItems();
        const agendaPending = agenda.filter(t => t.status === "agenda-pending").length;
        const agendaProgress = agenda.filter(t => t.status === "agenda-progress").length;
        const paritaria = getParitariaItems();
        const paritariaPending = paritaria.filter(t => t.status === "paritaria-pending").length;
        const paritariaProgress = paritaria.filter(t => t.status === "paritaria-progress").length;
        const petitions = getPetitions();
        const petitionPending = petitions.filter(t => t.status === "petition-pending").length;
        const petitionProgress = petitions.filter(t => t.status === "petition-progress").length;
        const minutes = getMinutes();
        const minutesTodo = minutes.filter(t => t.status === "todo").length;
        const minutesDirection = minutes.filter(t => t.status === "direction").length;
        const minutesAllegations = minutes.filter(t => t.status === "allegations").length;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isDashboardSessionActive = session => {
          if (!session || session.status === "closed") return false;
          if (!session.date) return true;
          const date = new Date(`${session.date}T00:00:00`);
          return Number.isNaN(date.getTime()) || date >= today;
        };
        const sessions = getCommitteeSessions();
        const sessionsOpen = sessions.filter(isDashboardSessionActive).length;
        const sessionsClosed = sessions.filter(s => s.status === "closed").length;
        const paritariaSessions = getParitariaSessions();
        const paritariaSessionsOpen = paritariaSessions.filter(isDashboardSessionActive).length;
        const paritariaSessionsClosed = paritariaSessions.filter(s => s.status === "closed").length;
        const teleworkActivePeriod = typeof getTeleworkActiveCampaign === "function" ? getTeleworkActiveCampaign() : null;
        const telework = getTeleworkItems().filter(t => !teleworkActivePeriod || t.period === teleworkActivePeriod);
        const teleworkEntry = telework.filter(t => t.status === "telework-entry").length;
        const teleworkProcessing = telework.filter(t => t.status === "telework-processing").length;
        const teleworkDirection = telework.filter(t => t.status === "telework-direction").length;
        const vinculogramas = typeof getVinculogramas === "function" ? getVinculogramas() : [];
        const vincExpired = typeof isVinculogramaExpired === "function" ? vinculogramas.filter(isVinculogramaExpired).length : 0;
        const vincActive = vinculogramas.length - vincExpired;

        const taskEl = document.getElementById("quick-count-tasks");
        if (taskEl) taskEl.textContent = `(${taskPending}/${taskProgress})`;
        const agendaEl = document.getElementById("quick-count-agenda");
        if (agendaEl) agendaEl.textContent = `(${agendaPending}/${agendaProgress})`;
        const petitionEl = document.getElementById("quick-count-petitions");
        if (petitionEl) petitionEl.textContent = `(${petitionPending}/${petitionProgress})`;
        const sessionsEl = document.getElementById("quick-count-sessions");
        if (sessionsEl) sessionsEl.textContent = `(${sessionsOpen})`;
        const paritariaEl = document.getElementById("quick-count-paritaria");
        if (paritariaEl) paritariaEl.textContent = `(${paritariaPending}/${paritariaProgress})`;
        const paritariaSessionsEl = document.getElementById("quick-count-paritaria-sessions");
        if (paritariaSessionsEl) paritariaSessionsEl.textContent = `(${paritariaSessionsOpen})`;

        const summaryUpdates = [
          ["summary-count-tasks", `${taskPending} pendientes · ${taskProgress} en curso`],
          ["summary-count-petitions", `${petitionPending} pendientes · ${petitionProgress} en curso`],
          ["summary-count-committee", `${agenda.length} puntos · ${sessionsOpen} sesiones abiertas`],
          ["summary-count-agenda", `${agendaPending} pendientes · ${agendaProgress} en curso`],
          ["summary-count-committee-sessions", `${sessionsOpen} abiertas · ${sessionsClosed} histórico`],
          ["summary-count-paritaria-main", `${paritaria.length} puntos · ${paritariaSessionsOpen} sesiones abiertas`],
          ["summary-count-paritaria", `${paritariaPending} pendientes · ${paritariaProgress} en curso`],
          ["summary-count-paritaria-sessions", `${paritariaSessionsOpen} abiertas · ${paritariaSessionsClosed} histórico`],
          ["summary-count-minutes", `${minutesTodo} pendientes · ${minutesDirection} dirección · ${minutesAllegations} alegaciones`],
          ["summary-count-telework", `${teleworkEntry} recibidas · ${teleworkProcessing} validaciones · ${teleworkDirection} dirección`],
          ["summary-count-vinculograma", `${vincActive} vigentes · ${vincExpired} vencidos`]
        ];
        summaryUpdates.forEach(([id, text]) => { const el = document.getElementById(id); if (el) el.textContent = text; });

        [["chart-tasks-pending",taskPending],["chart-tasks-progress",taskProgress],["chart-agenda-pending",agendaPending],["chart-agenda-progress",agendaProgress],["chart-paritaria-pending",paritariaPending],["chart-paritaria-progress",paritariaProgress],["chart-petitions-pending",petitionPending],["chart-petitions-progress",petitionProgress],["chart-minutes-todo",minutesTodo],["chart-minutes-direction",minutesDirection],["chart-minutes-allegations",minutesAllegations],["chart-telework-entry",teleworkEntry],["chart-telework-processing",teleworkProcessing + teleworkDirection]].forEach(([id,value])=>{const el=document.getElementById(id); if(el) el.textContent=value;});
        setPie("pie-tasks", taskPending, taskProgress);
        setPie("pie-agenda", agendaPending, agendaProgress);
        setPie("pie-paritaria", paritariaPending, paritariaProgress);
        setPie("pie-petitions", petitionPending, petitionProgress);
        setPie("pie-minutes", minutesTodo, minutesDirection + minutesAllegations);
        setPie("pie-telework", teleworkEntry, teleworkProcessing + teleworkDirection);
        if (typeof window.renderHomeDashboard === "function") window.renderHomeDashboard();
      }

      let taskViewFilter = "all";
      let taskSortField = "status";
      let taskSortDirection = "asc";

      function setTaskViewFilter(filter) {
        taskViewFilter = ["all", "pending", "progress", "closed"].includes(filter) ? filter : "all";
        renderTasks();
      }

      function taskStatusLabel(status) {
        const labels = { pending: "Pendiente", progress: "En curso", closed: "Cerrada" };
        return labels[status] || "Sin estado";
      }

      function taskStatusClass(status) {
        const classes = { pending: "pending", progress: "progress", closed: "closed" };
        return classes[status] || "pending";
      }

      function lastTaskUpdate(task) {
        const updates = Array.isArray(task.updates) ? task.updates : [];
        if (!updates.length) return "Sin avances";
        const last = updates[updates.length - 1];
        const date = last.createdAt ? new Date(last.createdAt).toLocaleDateString("es-ES") : "Sin fecha";
        return `${date}: ${last.text || "Actualización sin texto"}`;
      }

      function taskMatchesQuery(task, query) {
        if (!query) return true;
        const updates = Array.isArray(task.updates) ? task.updates.map(update => update.text || "").join(" ") : "";
        return itemSearchText([task.title, task.notes, task.dueDate, taskStatusLabel(task.status), priorityLabel(task.priority), taskOriginValue(task), updates]).includes(query);
      }

      function toggleTaskRowDetails(event, id) {
        if (event && event.target && event.target.closest && event.target.closest("button, a, input, select, textarea, label")) return;
        const row = document.getElementById(`rrll-task-${id}`);
        if (row) row.classList.toggle("expanded");
      }


      function taskPriorityBadgeHtml(value) {
        const raw = String(value || "normal").toLowerCase();
        const normalized = raw === "low" || raw === "baja" ? "low" : normalizePriority(value);
        const labels = { low: "Baja", baja: "Baja", normal: "Normal", high: "Alta", alta: "Alta" };
        const label = labels[raw] || priorityLabel(value).replace(/^Prioridad:\s*/i, "");
        return `<span class="priority-badge priority-${normalized}">${escapeHtml(label)}</span>`;
      }

      function taskDueSummaryText(due, hasDueDate) {
        if (!hasDueDate) return "Sin fecha";
        if (due.diffDays < 0) return "Vencida";
        if (due.diffDays === 0) return "Hoy";
        if (due.diffDays <= 5) return "Próxima";
        return "Con fecha";
      }

      function renderTaskRow(task) {
        const due = dueStatus(task.dueDate);
        const created = task.createdAt ? new Date(task.createdAt).toLocaleDateString("es-ES") : "Sin fecha";
        const closed = task.closedAt ? new Date(task.closedAt).toLocaleDateString("es-ES") : "";
        const dueText = taskDueSummaryText(due, task.dueDate);
        const dueDetail = task.dueDate ? due.text : "Sin fecha límite";
        const notes = task.notes || "Sin notas";
        const statusClass = taskStatusClass(task.status);
        const originHtml = taskOriginBadgeHtml(taskOriginValue(task));

        return `
          <tr id="rrll-task-${task.id}" class="rrll-pro-row rrll-task-row status-${statusClass}" onclick="toggleTaskRowDetails(event, '${task.id}')" ondblclick="event.preventDefault(); event.stopPropagation(); openTaskUpdateModal('${task.id}')" title="Clic para desplegar detalle · Doble clic para editar">
            <td class="rrll-pro-main-cell">
              <div class="rrll-pro-title">${escapeHtml(task.title || "Sin título")}</div>
              <div class="rrll-pro-subtitle">${escapeHtml(notes)}</div>
              <div class="rrll-pro-created">Creada: ${escapeHtml(created)}${closed ? ` · Cerrada: ${escapeHtml(closed)}` : ""}</div>
              <div class="rrll-pro-update">Última actualización: ${escapeHtml(lastTaskUpdate(task))}</div>
            </td>
            <td class="rrll-origin-cell">${originHtml}</td>
            <td>${taskPriorityBadgeHtml(task.priority)}</td>
            <td><span class="rrll-status-pill ${statusClass}">${escapeHtml(taskStatusLabel(task.status))}</span></td>
            <td><span class="rrll-due-pill${due.className}" title="${escapeHtml(dueDetail)}">${escapeHtml(dueText)}</span></td>
            <td class="rrll-pro-actions" onclick="event.stopPropagation()">
              ${task.status !== "pending" ? `<button class="small secondary" onclick="moveTask('${task.id}', 'pending')">Pendiente</button>` : ""}
              ${task.status !== "progress" ? `<button class="small black" onclick="moveTask('${task.id}', 'progress')">En curso</button>` : ""}
              ${task.status !== "closed" ? `<button class="small" onclick="moveTask('${task.id}', 'closed')">Cerrar</button>` : ""}
              <button class="small danger rrll-delete-icon-button" onclick="deleteTask('${task.id}')" title="Eliminar tarea" aria-label="Eliminar tarea"><span aria-hidden="true">🗑️</span></button>
            </td>
          </tr>
        `;
      }

      function taskSortValue(task, field) {
        if (!task) return "";
        const priorityOrder = { critical: 3, high: 2, normal: 1 };
        const statusOrder = { progress: 3, pending: 2, closed: 1 };
        switch (field) {
          case "title": return String(task.title || "").toLocaleLowerCase("es-ES");
          case "origin": return taskOriginValue(task).toLocaleLowerCase("es-ES");
          case "priority": return priorityOrder[normalizePriority(task.priority)] || 0;
          case "status": return statusOrder[task.status] || 0;
          case "dueDate": return task.dueDate || "9999-12-31";
          case "update": return String(lastTaskUpdate(task) || "").toLocaleLowerCase("es-ES");
          default: return String(task.title || "").toLocaleLowerCase("es-ES");
        }
      }

      function compareTasksByField(a, b, field) {
        const av = taskSortValue(a, field);
        const bv = taskSortValue(b, field);
        if (typeof av === "number" || typeof bv === "number") return (Number(av) || 0) - (Number(bv) || 0);
        return String(av).localeCompare(String(bv), "es-ES", { numeric: true, sensitivity: "base" });
      }

      function sortTasks(items) {
        const direction = taskSortDirection === "desc" ? -1 : 1;
        return [...items].sort((a, b) => {
          const byField = compareTasksByField(a, b, taskSortField) * direction;
          if (byField) return byField;
          return String(a.title || "").localeCompare(String(b.title || ""), "es-ES", { numeric: true, sensitivity: "base" });
        });
      }

      function setTaskSort(field) {
        if (!field) return;
        if (taskSortField === field) {
          taskSortDirection = taskSortDirection === "asc" ? "desc" : "asc";
        } else {
          taskSortField = field;
          taskSortDirection = "asc";
        }
        renderTasks();
      }

      function updateTaskSortHeaders() {
        document.querySelectorAll("#gestor-tareas th[data-task-sort]").forEach(th => {
          const field = th.getAttribute("data-task-sort");
          const active = field === taskSortField;
          th.classList.toggle("sorted", active);
          th.classList.toggle("sorted-asc", active && taskSortDirection === "asc");
          th.classList.toggle("sorted-desc", active && taskSortDirection === "desc");
          th.setAttribute("aria-sort", active ? (taskSortDirection === "asc" ? "ascending" : "descending") : "none");
          const base = th.getAttribute("data-sort-label") || th.textContent.replace(/[↑↓↕]/g, "").trim();
          th.setAttribute("data-sort-label", base);
          th.innerHTML = `${escapeHtml(base)} <span class="rrll-sort-indicator">${active ? (taskSortDirection === "asc" ? "↑" : "↓") : "↕"}</span>`;
        });
      }

      function getVisibleTasks() {
        const query = (document.getElementById("taskInlineSearch")?.value || "").trim().toLowerCase();
        const filtered = getTasks()
          .filter(task => taskViewFilter === "closed" ? task.status === "closed" : task.status !== "closed")
          .filter(task => taskViewFilter === "all" || taskViewFilter === "closed" || task.status === taskViewFilter)
          .filter(task => taskMatchesQuery(task, query));
        return sortTasks(filtered);
      }

      function renderTasks() {
        populateTaskOriginSelect("newTaskOrigin", document.getElementById("newTaskOrigin")?.value || "", true);
        const tasks = getTasks();
        const tableBody = document.getElementById("tasksTableBody");
        const empty = document.getElementById("tasksTableEmpty");

        const counts = {
          pending: tasks.filter(task => task.status === "pending").length,
          progress: tasks.filter(task => task.status === "progress").length,
          closed: tasks.filter(task => task.status === "closed" && isClosedWithinLastMonth(task)).length
        };

        const pendingEl = document.getElementById("count-pending");
        const progressEl = document.getElementById("count-progress");
        const closedEl = document.getElementById("count-closed");
        if (pendingEl) pendingEl.textContent = counts.pending;
        if (progressEl) progressEl.textContent = counts.progress;
        if (closedEl) closedEl.textContent = counts.closed;

        document.querySelectorAll(".rrll-pro-tabs button").forEach(button => button.classList.remove("active"));
        const activeFilter = document.getElementById(`task-filter-${taskViewFilter}`);
        if (activeFilter) activeFilter.classList.add("active");

        const filtered = getVisibleTasks();
        updateTaskSortHeaders();

        if (tableBody) {
          tableBody.innerHTML = filtered.map(renderTaskRow).join("");
          tableBody.querySelectorAll(".rrll-task-row").forEach(row => {
            row.addEventListener("dblclick", event => {
              if (event.target && event.target.closest && event.target.closest("button, a, input, select, textarea, label")) return;
              event.preventDefault();
              event.stopPropagation();
              const id = row.id.replace("rrll-task-", "");
              openTaskUpdateModal(id);
            });
          });
        }
        if (empty) empty.style.display = filtered.length ? "none" : "block";

        updateQuickCounts();
        renderAlertsPanel();
      }




  const api = {
    getTasks,
    setTasks,
    addTask,
    toggleTaskCreateForm,
    moveTask,
    deleteTask,
    deleteVisibleClosedTasks,
    openTaskUpdateModal,
    closeTaskUpdateModal,
    saveTaskUpdateFromModal,
    renderTasks,
    setTaskViewFilter,
    setTaskSort,
    getVisibleTasks,
    toggleTaskRowDetails,
    isClosedWithinLastMonth
  };

  window.TareasModule = api;
  window.confirmDangerAction = confirmDangerAction;

  // Compatibilidad temporal con HTML/app.js mientras se completa Fase 3.
  window.getTasks = getTasks;
  window.setTasks = setTasks;
  window.addTask = addTask;
  window.toggleTaskCreateForm = toggleTaskCreateForm;
  window.moveTask = moveTask;
  window.deleteTask = deleteTask;
  window.deleteVisibleClosedTasks = deleteVisibleClosedTasks;
  window.openTaskUpdateModal = openTaskUpdateModal;
  window.closeTaskUpdateModal = closeTaskUpdateModal;
  window.saveTaskUpdateFromModal = saveTaskUpdateFromModal;
  window.renderTasks = renderTasks;
  window.setTaskViewFilter = setTaskViewFilter;
  window.setTaskSort = setTaskSort;
  window.getVisibleTasks = getVisibleTasks;
  window.toggleTaskRowDetails = toggleTaskRowDetails;
  window.isClosedWithinLastMonth = isClosedWithinLastMonth;
  window.updateQuickCounts = updateQuickCounts;
  window.applyAllClosedColumnStates = applyAllClosedColumnStates;
  window.toggleClosedColumn = toggleClosedColumn;
  window.isClosedColumnOpen = isClosedColumnOpen;
})();
