// Fase 3.6: Comité de Empresa encapsulado como módulo independiente.
// Mantiene wrappers globales por compatibilidad con los onclick existentes del HTML y app.js.
(function () {
  'use strict';

// Fase 3: módulo extraído desde app.js sin cambiar funcionalidad.


    function ensureCommitteeConfirmModal() {
      let modal = document.getElementById("committeeConfirmModal");
      if (modal) return modal;

      modal = document.createElement("div");
      modal.id = "committeeConfirmModal";
      modal.className = "modal-backdrop rrll-confirm-delete-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "committeeConfirmTitle");
      modal.innerHTML = `
        <div class="modal-box rrll-confirm-delete-box" role="document">
          <div class="rrll-confirm-delete-icon" aria-hidden="true">!</div>
          <h3 id="committeeConfirmTitle">Confirmar acción</h3>
          <p id="committeeConfirmText" class="muted">Revisa la acción antes de continuar.</p>
          <div class="modal-actions rrll-confirm-delete-actions">
            <button type="button" class="secondary" data-confirm-cancel>Cancelar</button>
            <button type="button" class="danger" data-confirm-accept>Confirmar</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      return modal;
    }

    function confirmCommitteeAction(options) {
      const modal = ensureCommitteeConfirmModal();
      const titleEl = modal.querySelector("#committeeConfirmTitle");
      const textEl = modal.querySelector("#committeeConfirmText");
      const cancelButton = modal.querySelector("[data-confirm-cancel]");
      const acceptButton = modal.querySelector("[data-confirm-accept]");
      const action = options && typeof options.onConfirm === "function" ? options.onConfirm : null;

      if (titleEl) titleEl.textContent = (options && options.title) || "Confirmar acción";
      if (textEl) textEl.textContent = (options && options.message) || "Revisa la acción antes de continuar.";
      if (acceptButton) acceptButton.textContent = (options && options.confirmLabel) || "Confirmar";
      if (acceptButton) acceptButton.className = (options && options.danger === false) ? "" : "danger";

      function close() {
        modal.classList.remove("open");
        modal.removeEventListener("click", handleBackdropClick);
        document.removeEventListener("keydown", handleEscape);
        cancelButton?.removeEventListener("click", handleCancel);
        acceptButton?.removeEventListener("click", handleConfirm);
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
      acceptButton?.addEventListener("click", handleConfirm);
      modal.addEventListener("click", handleBackdropClick);
      document.addEventListener("keydown", handleEscape);
      modal.classList.add("open");
      setTimeout(() => cancelButton?.focus(), 0);
    }


    function ensureCommitteeMinutePromptModal() {
      let modal = document.getElementById("committeeMinutePromptModal");
      if (modal) return modal;

      modal = document.createElement("div");
      modal.id = "committeeMinutePromptModal";
      modal.className = "modal-backdrop committee-minute-prompt-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "committeeMinutePromptTitle");
      modal.innerHTML = `
        <div class="modal-box session-close-modal-box" role="document">
          <h3 id="committeeMinutePromptTitle">Crear registro en Actas</h3>
          <p class="muted">¿Deseas crear automáticamente un registro en Actas para esta sesión?</p>
          <div class="committee-minute-preview" id="committeeMinutePromptPreview"></div>
          <div class="modal-actions">
            <button type="button" class="secondary" data-minute-skip>No crear</button>
            <button type="button" data-minute-create>Crear acta</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      return modal;
    }

    function committeeSessionDateLabel(session) {
      if (!session || !session.date) return "Sin fecha";
      return new Date(session.date + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    function buildCommitteeMinutePayload(session) {
      const dateLabel = committeeSessionDateLabel(session);
      return {
        title: `Comité de Empresa - ${dateLabel}`,
        notes: String(session && session.code ? session.code : "").trim(),
        sourceType: "committee-session",
        sourceId: String(session && session.id ? session.id : "").trim()
      };
    }

    function createCommitteeMinuteFromSession(session) {
      if (!session) return;
      const payload = buildCommitteeMinutePayload(session);
      const creator = window.ActasModule && typeof window.ActasModule.createMinuteIfMissing === "function"
        ? window.ActasModule.createMinuteIfMissing
        : (typeof window.createMinuteIfMissing === "function" ? window.createMinuteIfMissing : null);

      if (!creator) {
        alert("No se ha podido acceder al alta segura de Actas.");
        return;
      }

      const result = creator(payload);
      if (result && result.created) {
        alert("Acta creada correctamente.");
        return;
      }
      if (result && result.reason === "duplicate") {
        alert("Ya existe un acta equivalente para esta sesión. No se ha creado un duplicado.");
        return;
      }
      alert("No se ha creado el acta porque faltan datos obligatorios.");
    }

    function promptCommitteeMinuteCreation(session) {
      if (!session) return;
      const modal = ensureCommitteeMinutePromptModal();
      const preview = modal.querySelector("#committeeMinutePromptPreview");
      const skipButton = modal.querySelector("[data-minute-skip]");
      const createButton = modal.querySelector("[data-minute-create]");
      const payload = buildCommitteeMinutePayload(session);

      if (preview) {
        preview.innerHTML = `
          <div><strong>Asunto:</strong> ${escapeHtml(payload.title)}</div>
          <div><strong>Notas:</strong> ${escapeHtml(payload.notes || "Sin código")}</div>
        `;
      }

      function close() {
        modal.classList.remove("open");
        modal.removeEventListener("click", handleBackdropClick);
        document.removeEventListener("keydown", handleEscape);
        skipButton?.removeEventListener("click", handleSkip);
        createButton?.removeEventListener("click", handleCreate);
      }

      function handleSkip() {
        close();
      }

      function handleCreate() {
        close();
        createCommitteeMinuteFromSession(session);
      }

      function handleBackdropClick(event) {
        if (event.target === modal) close();
      }

      function handleEscape(event) {
        if (event.key === "Escape" && modal.classList.contains("open")) close();
      }

      skipButton?.addEventListener("click", handleSkip);
      createButton?.addEventListener("click", handleCreate);
      modal.addEventListener("click", handleBackdropClick);
      document.addEventListener("keydown", handleEscape);
      modal.classList.add("open");
      setTimeout(() => skipButton?.focus(), 0);
    }

    function getAgendaItems() {
      return load("rrll_agenda_items", []);
    }

    function setAgendaItems(items) {
      save("rrll_agenda_items", items);
    }

    function toggleAgendaCreateForm(forceOpen) {
      const form = document.getElementById("agendaCreateForm");
      if (!form) return;
      const open = typeof forceOpen === "boolean" ? forceOpen : form.classList.contains("rrll-create-form-collapsed");
      form.classList.toggle("rrll-create-form-collapsed", !open);
      if (open) setTimeout(() => document.getElementById("newAgendaTitle")?.focus(), 0);
    }

    function toggleCommitteeSessionCreateForm(forceOpen) {
      const form = document.getElementById("committeeSessionCreateForm");
      if (!form) return;
      const open = typeof forceOpen === "boolean" ? forceOpen : form.classList.contains("rrll-create-form-collapsed");
      form.classList.toggle("rrll-create-form-collapsed", !open);
      if (open) setTimeout(() => document.getElementById("newCommitteeSessionDate")?.focus(), 0);
    }

    function addAgendaItem() {
      const petitionerEl = document.getElementById("newAgendaPetitioner");
      const titleEl = document.getElementById("newAgendaTitle");
      const requestDateEl = document.getElementById("newAgendaRequestDate");
      const notesEl = document.getElementById("newAgendaNotes");

      const title = titleEl.value.trim();
      if (!title) {
        alert("Introduce el punto del orden del día.");
        return;
      }

      const now = new Date().toISOString();
      const items = getAgendaItems();

      items.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        petitioner: petitionerEl.value.trim(),
        title,
        requestDate: requestDateEl.value,
        status: "agenda-pending",
        notes: notesEl.value.trim(),
        updates: [],
        createdAt: now,
        closedAt: null
      });

      setAgendaItems(items);

      petitionerEl.value = "";
      titleEl.value = "";
      requestDateEl.value = "";
      notesEl.value = "";

      renderAgendaItems();
      toggleAgendaCreateForm(false);
    }

    function executeMoveAgendaItem(id, status) {
      const now = new Date().toISOString();
      const items = getAgendaItems().map(item => {
        if (item.id !== id) return item;
        return {
          ...item,
          status,
          closedAt: status === "agenda-closed" ? (item.closedAt || now) : null
        };
      });
      setAgendaItems(items);
      renderAgendaItems();
    }

    function moveAgendaItem(id, status) {
      const item = getAgendaItems().find(i => i.id === id);
      const title = item && item.title ? `“${item.title}”` : "este punto";
      const nextStatus = agendaStatusLabel(status).toLowerCase();
      confirmCommitteeAction({
        title: "Cambiar estado del punto",
        message: `¿Quieres cambiar el estado de ${title} a ${nextStatus}?`,
        confirmLabel: "Cambiar estado",
        onConfirm: () => executeMoveAgendaItem(id, status)
      });
    }

    function executeDeleteAgendaItem(id) {
      const items = getAgendaItems();
      const item = items.find(i => i.id === id);
      if (item) moveToTrash("agenda", item);
      setAgendaItems(items.filter(i => i.id !== id));
      renderAgendaItems();
      renderTrash();
      restoreAlertsPanelState();
      renderAlertsPanel();
    }

    function deleteAgendaItem(id) {
      const item = getAgendaItems().find(i => i.id === id);
      const title = item && item.title ? `“${item.title}”` : "este punto";
      confirmCommitteeAction({
        title: "Eliminar punto de Comité",
        message: `¿Quieres eliminar ${title}? Se moverá a la papelera.`,
        confirmLabel: "Eliminar",
        onConfirm: () => executeDeleteAgendaItem(id)
      });
    }

    let activeAgendaUpdateId = null;

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


    function openAgendaUpdateModal(id) {
      const items = getAgendaItems();
      const item = items.find(i => i.id === id);
      if (!item) return;

      activeAgendaUpdateId = id;
      const titleEl = document.getElementById("agendaUpdateModalTitle");
      if (titleEl) titleEl.textContent = item.title || "Punto sin título";

      const titleInput = document.getElementById("agendaEditTitle");
      const petitionerInput = document.getElementById("agendaEditPetitioner");
      const requestDateInput = document.getElementById("agendaEditRequestDate");
      const statusInput = document.getElementById("agendaEditStatus");
      const notesInput = document.getElementById("agendaEditNotes");
      const updateInput = document.getElementById("agendaUpdateModalText");

      if (titleInput) titleInput.value = item.title || "";
      if (petitionerInput) petitionerInput.value = item.petitioner || "";
      if (requestDateInput) requestDateInput.value = item.requestDate || "";
      if (statusInput) statusInput.value = item.status || "agenda-pending";
      populateAgendaCommitteeSessionSelect(item);
      if (notesInput) notesInput.value = item.notes || "";
      if (updateInput) updateInput.value = "";
      renderEditableUpdates("agendaExistingUpdates", item.updates || []);

      document.getElementById("agendaUpdateModal").classList.add("open");
      setTimeout(() => (updateInput || titleInput)?.focus(), 0);
    }

    function closeAgendaUpdateModal() {
      activeAgendaUpdateId = null;
      const modal = document.getElementById("agendaUpdateModal");
      if (modal) modal.classList.remove("open");
      ["agendaEditTitle", "agendaEditPetitioner", "agendaEditRequestDate", "agendaEditCommitteeSession", "agendaEditNotes", "agendaUpdateModalText"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      const statusInput = document.getElementById("agendaEditStatus");
      if (statusInput) statusInput.value = "agenda-pending";
      const existing = document.getElementById("agendaExistingUpdates");
      if (existing) existing.innerHTML = "";
    }

    function saveAgendaUpdateFromModal() {
      if (!activeAgendaUpdateId) return;

      const title = (document.getElementById("agendaEditTitle")?.value || "").trim();
      if (!title) {
        alert("El punto necesita un título.");
        return;
      }

      const petitioner = (document.getElementById("agendaEditPetitioner")?.value || "").trim();
      const requestDate = document.getElementById("agendaEditRequestDate")?.value || "";
      const status = document.getElementById("agendaEditStatus")?.value || "agenda-pending";
      const selectedSessionId = document.getElementById("agendaEditCommitteeSession")?.value || "";
      const notes = (document.getElementById("agendaEditNotes")?.value || "").trim();
      const updateText = (document.getElementById("agendaUpdateModalText")?.value || "").trim();
      const now = new Date().toISOString();
      const originalItem = getAgendaItems().find(item => item.id === activeAgendaUpdateId);
      if (selectedSessionId && status === "agenda-closed") {
        alert("Solo los puntos abiertos o en curso pueden asignarse a sesiones abiertas de Comité.");
        return;
      }

      const sessionPatch = assignAgendaItemToCommitteeSession(activeAgendaUpdateId, selectedSessionId);
      if (!sessionPatch) {
        alert("La sesión seleccionada ya no está abierta.");
        populateAgendaCommitteeSessionSelect(originalItem);
        return;
      }

      const items = getAgendaItems().map(item => {
        if (item.id !== activeAgendaUpdateId) return item;
        const editedUpdates = collectEditableUpdates("agendaExistingUpdates", item.updates || []);
        const updates = updateText
          ? [...editedUpdates, { text: updateText, createdAt: now }]
          : editedUpdates;
        return {
          ...item,
          ...sessionPatch,
          title,
          petitioner,
          requestDate,
          status,
          notes,
          closedAt: status === "agenda-closed" ? (item.closedAt || now) : null,
          updatedAt: now,
          updates
        };
      });

      setAgendaItems(items);
      closeAgendaUpdateModal();
      renderAgendaItems();
    }


    function getCommitteeSessions() {
      const sessions = load("rrll_committee_sessions", []);
      return Array.isArray(sessions) ? sessions : [];
    }

    function setCommitteeSessions(sessions) {
      save("rrll_committee_sessions", Array.isArray(sessions) ? sessions : []);
    }


    function committeeSessionItemTitle(raw, agendaById) {
      if (!raw) return "";
      if (typeof raw === "string") {
        const linked = agendaById && agendaById[raw];
        return linked ? (linked.title || "") : raw;
      }
      if (typeof raw === "object") return raw.title || raw.text || raw.name || "";
      return String(raw);
    }

    function committeeSessionItemMeta(raw, agendaById) {
      if (!raw) return "";
      if (typeof raw === "string") {
        const linked = agendaById && agendaById[raw];
        return linked ? `Peticionario: ${linked.petitioner || "Sin indicar"} · Estado: ${statusLabel(linked.status)}` : "Histórico importado";
      }
      if (typeof raw === "object") return raw.source || "Histórico importado";
      return "Histórico importado";
    }

    function committeeSessionItemId(raw) {
      if (!raw) return "";
      if (typeof raw === "string") return raw;
      if (typeof raw === "object") return raw.id || raw.title || JSON.stringify(raw);
      return String(raw);
    }

    function getCommitteeSessionDisplayItems(session) {
      const agendaItems = getAgendaItems();
      const agendaById = Object.fromEntries(agendaItems.map(item => [item.id, item]));
      const rawItems = Array.isArray(session.items) ? [...session.items] : [];
      const seenIds = new Set(rawItems.map(raw => committeeSessionItemId(raw)).filter(Boolean));

      agendaItems
        .filter(item => agendaMatchesCommitteeSession(item, session))
        .sort((a, b) => (Number(a.committeeSessionOrder) || Number.MAX_SAFE_INTEGER) - (Number(b.committeeSessionOrder) || Number.MAX_SAFE_INTEGER))
        .forEach(item => {
          if (!seenIds.has(item.id)) {
            rawItems.push(item.id);
            seenIds.add(item.id);
          }
        });

      return rawItems.map((raw, index) => ({
        raw,
        key: committeeSessionItemId(raw),
        title: committeeSessionItemTitle(raw, agendaById),
        meta: committeeSessionItemMeta(raw, agendaById),
        linked: typeof raw === "string" && !!agendaById[raw],
        index
      })).filter(item => item.title);
    }

    async function importCommitteeHistoryFromWord() {
      if (!window.rrllDB || typeof window.rrllDB.importCommitteeHistoryDocx !== "function") {
        alert("El importador de histórico Word solo está disponible en la aplicación Electron.");
        return;
      }
      try {
        const result = await window.rrllDB.importCommitteeHistoryDocx();
        if (!result) return;
        if (!result.sessions || !result.sessions.length) {
          alert("No se han detectado sesiones importables en el documento.");
          return;
        }
        confirmCommitteeAction({
          title: "Importar histórico Word",
          message: `Se han detectado ${result.sessionCount} sesiones y ${result.pointCount} puntos del orden del día en ${result.fileName}. Se importarán solo como sesiones históricas de Comité, sin crear puntos en el gestor de puntos.`,
          confirmLabel: "Importar",
          danger: false,
          onConfirm: () => {
            const existing = getCommitteeSessions();
            const existingKeys = new Set(existing.map(s => `${String(s.code || "").trim().toLowerCase()}|${String(s.date || s.rawDate || "").trim().toLowerCase()}`));
            const incoming = result.sessions.filter(s => {
              const key = `${String(s.code || "").trim().toLowerCase()}|${String(s.date || s.rawDate || "").trim().toLowerCase()}`;
              return !existingKeys.has(key);
            });
            if (!incoming.length) {
              alert("Todas las sesiones detectadas ya existen en la app. No se ha importado nada.");
              return;
            }
            setCommitteeSessions([...incoming, ...existing]);
            renderCommitteeSessions();
            updateQuickCounts();
            alert(`Importación completada.\nSesiones importadas: ${incoming.length}\nSesiones omitidas por posible duplicado: ${result.sessions.length - incoming.length}`);
          }
        });
      } catch (error) {
        alert(`No se pudo importar el histórico.\nDetalle: ${error && error.message ? error.message : error}`);
      }
    }

    function addCommitteeSession() {
      const dateEl = document.getElementById("newCommitteeSessionDate");
      const codeEl = document.getElementById("newCommitteeSessionCode");
      const titleEl = document.getElementById("newCommitteeSessionTitle");
      const notesEl = document.getElementById("newCommitteeSessionNotes");

      const date = dateEl ? dateEl.value : "";
      const code = codeEl ? codeEl.value.trim() : "";
      const title = titleEl ? titleEl.value.trim() : "";
      const notes = notesEl ? notesEl.value.trim() : "";

      if (!date || !code) {
        alert("Indica al menos fecha y código documental de la sesión.");
        return;
      }

      const sessions = getCommitteeSessions();
      sessions.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        date,
        code,
        title: title || `Comité ${date}`,
        notes,
        status: "open",
        items: [],
        createdAt: new Date().toISOString(),
        closedAt: null
      });

      setCommitteeSessions(sessions);
      if (dateEl) dateEl.value = "";
      if (codeEl) codeEl.value = "";
      if (titleEl) titleEl.value = "";
      if (notesEl) notesEl.value = "";
      renderCommitteeSessions();
      updateQuickCounts();
      toggleCommitteeSessionCreateForm(false);
    }

    function sessionLabel(session) {
      if (!session) return "Sin sesión";
      const date = session.date ? new Date(session.date + "T00:00:00").toLocaleDateString("es-ES") : "Sin fecha";
      return `${session.code || "Sin código"} · ${date}`;
    }

    function committeeDraftDateLabel(session) {
      if (!session) return "Sin fecha";
      if (session.date) return new Date(session.date + "T00:00:00").toLocaleDateString("es-ES");
      return session.rawDate || "Sin fecha";
    }

    function buildCommitteeDraftPayload(session) {
      const items = getCommitteeSessionDisplayItems(session);
      const ordenDia = items.length
        ? items.map((item, index) => `${index + 1}. ${item.title || "Sin título"}`).join("\n")
        : "Sin puntos en el orden del día";
      const puntosTratados = items.length
        ? items.map((item, index) => {
          const meta = item.meta ? `\n   ${item.meta}` : "";
          return `${index + 1}. ${item.title || "Sin título"}${meta}`;
        }).join("\n\n")
        : "Sin puntos tratados";

      return {
        numeroDocumento: String(session && session.code ? session.code : "Sin número de documento").trim(),
        fechaComite: committeeDraftDateLabel(session),
        ordenDia,
        puntosTratados
      };
    }

    async function generateCommitteeMinutesDraft(sessionId) {
      const session = getCommitteeSessions().find(s => s.id === sessionId);
      if (!session) {
        alert("No se ha encontrado la sesión de Comité para generar el borrador del acta.");
        return;
      }
      if (!window.rrllDB || typeof window.rrllDB.generateCommitteeMinutesDraft !== "function") {
        alert("La generación de borradores Word solo está disponible en la aplicación Electron.");
        return;
      }

      try {
        const result = await window.rrllDB.generateCommitteeMinutesDraft(buildCommitteeDraftPayload(session));
        if (!result) return;
        if (result.canceled) {
          alert(result.message || "No se ha seleccionado ninguna plantilla Word (.docx). Selecciona una plantilla local para generar el borrador del acta.");
          return;
        }
        if (result.message) alert(result.message);
      } catch (error) {
        alert(`No se pudo generar el borrador del acta.\nDetalle: ${error && error.message ? error.message : error}`);
      }
    }

    function isOpenCommitteeSession(session) {
      return !!session && session.status !== "closed";
    }

    function getOpenCommitteeSessions() {
      return getCommitteeSessions()
        .filter(isOpenCommitteeSession)
        .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.code || "").localeCompare(String(b.code || ""), "es"));
    }

    function committeeSessionSelectLabel(session) {
      const code = String(session && session.code ? session.code : "Sin código").trim();
      const date = session && session.date
        ? new Date(session.date + "T00:00:00").toLocaleDateString("es-ES")
        : "Sin fecha";
      return `${code} - ${date}`;
    }

    function agendaMatchesCommitteeSession(item, session) {
      if (!item || !session) return false;
      const sessionId = String(session.id || "");
      const sessionCode = String(session.code || "");
      return (sessionId && item.committeeSessionId === sessionId) || (sessionCode && item.committeeSessionCode === sessionCode);
    }

    function populateAgendaCommitteeSessionSelect(item) {
      const select = document.getElementById("agendaEditCommitteeSession");
      if (!select) return;
      const currentSessionId = item && item.committeeSessionId ? String(item.committeeSessionId) : "";
      const openSessions = getOpenCommitteeSessions();
      select.innerHTML = `<option value="">Sin sesión</option>` + openSessions.map(session => `
        <option value="${escapeHtml(session.id)}">${escapeHtml(committeeSessionSelectLabel(session))}</option>
      `).join("");
      const currentOpenSession = openSessions.find(session => session.id === currentSessionId || agendaMatchesCommitteeSession(item, session));
      select.value = currentOpenSession ? currentOpenSession.id : "";
    }

    function assignAgendaItemToCommitteeSession(agendaId, targetSessionId) {
      const sessions = getCommitteeSessions();
      const targetSession = targetSessionId ? sessions.find(session => session.id === targetSessionId && isOpenCommitteeSession(session)) : null;
      if (targetSessionId && !targetSession) return null;

      sessions.forEach(session => {
        if (!isOpenCommitteeSession(session) && session.id !== targetSessionId) return;
        const items = Array.isArray(session.items) ? session.items : [];
        session.items = items.filter(raw => committeeSessionItemId(raw) !== agendaId);
      });

      if (targetSession) {
        targetSession.items = Array.isArray(targetSession.items) ? targetSession.items : [];
        if (!targetSession.items.some(raw => committeeSessionItemId(raw) === agendaId)) targetSession.items.push(agendaId);
      }

      setCommitteeSessions(sessions);
      const order = targetSession ? targetSession.items.findIndex(raw => committeeSessionItemId(raw) === agendaId) : -1;
      return targetSession ? {
        committeeSessionId: targetSession.id,
        committeeSessionCode: targetSession.code,
        committeeSessionDate: targetSession.date,
        committeeSessionOrder: order >= 0 ? order + 1 : null,
        closedByCommittee: false
      } : {
        committeeSessionId: "",
        committeeSessionCode: "",
        committeeSessionDate: "",
        committeeSessionOrder: null,
        closedByCommittee: false
      };
    }

    let activeAgendaAddToSessionId = null;
    let activeCommitteeOrderSessionId = null;
    let activeCommitteeCloseSessionId = null;
    let committeeOrderDraft = [];
    let draggedCommitteeAgendaId = null;

    function openAddAgendaToCommitteeModal(agendaId) {
      const agenda = getAgendaItems();
      const item = agenda.find(i => i.id === agendaId);
      if (!item || item.status !== "agenda-progress") return;

      activeAgendaAddToSessionId = agendaId;
      const titleEl = document.getElementById("committeeSessionSelectAgendaTitle");
      const listEl = document.getElementById("committeeSessionSelectList");
      const modal = document.getElementById("committeeSessionSelectModal");
      if (!titleEl || !listEl || !modal) {
        alert("No se ha encontrado la ventana de selección de sesión.");
        return;
      }

      titleEl.textContent = item.title || "Punto sin título";
      const openSessions = getCommitteeSessions()
        .filter(s => s.status !== "closed")
        .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

      listEl.innerHTML = openSessions.length
        ? openSessions.map(session => `
          <div class="session-select-option" onclick="confirmAddAgendaToCommitteeSession('${session.id}')">
            <div class="session-title">${escapeHtml(session.title || "Sesión de Comité")}</div>
            <div class="session-meta">Código: ${escapeHtml(session.code || "Sin código")}<br>Fecha: ${escapeHtml(session.date ? new Date(session.date + "T00:00:00").toLocaleDateString("es-ES") : "Sin fecha")}<br>Puntos actuales: ${escapeHtml((session.items || []).length)}</div>
          </div>
        `).join("")
        : `<p class="muted">No hay sesiones abiertas. Crea primero una sesión en el gestor de Sesiones de Comité.</p>`;

      modal.classList.add("open");
    }

    function closeAddAgendaToCommitteeModal() {
      activeAgendaAddToSessionId = null;
      const modal = document.getElementById("committeeSessionSelectModal");
      if (modal) modal.classList.remove("open");
    }

    function confirmAddAgendaToCommitteeSession(sessionId) {
      const agendaId = activeAgendaAddToSessionId;
      if (!agendaId || !sessionId) return;

      const agenda = getAgendaItems();
      const item = agenda.find(i => i.id === agendaId);
      if (!item || item.status !== "agenda-progress") return;

      const sessions = getCommitteeSessions();
      const session = sessions.find(s => s.id === sessionId && s.status !== "closed");
      if (!session) {
        alert("La sesión seleccionada no está abierta.");
        return;
      }

      const sessionPatch = assignAgendaItemToCommitteeSession(agendaId, session.id);
      if (!sessionPatch) {
        alert("La sesión seleccionada no está abierta.");
        return;
      }

      const updatedAgenda = agenda.map(i => i.id === agendaId ? {
        ...i,
        ...sessionPatch
      } : i);

      setAgendaItems(updatedAgenda);
      closeAddAgendaToCommitteeModal();
      renderCommitteeSessions();
      renderAgendaItems();
    }

    function addAgendaItemToCommitteeSession(agendaId) {
      openAddAgendaToCommitteeModal(agendaId);
    }

    function getCommitteeSessionAssignedIds(session) {
      return new Set((Array.isArray(session && session.items) ? session.items : [])
        .map(raw => committeeSessionItemId(raw))
        .filter(Boolean));
    }

    function getAvailableCommitteePointsForSession(session) {
      if (!session) return [];
      const assignedToCurrentSession = getCommitteeSessionAssignedIds(session);
      return getAgendaItems()
        .filter(item => item && item.status !== "agenda-closed")
        .filter(item => !assignedToCurrentSession.has(item.id))
        .filter(item => !item.committeeSessionId || item.committeeSessionId === session.id)
        .sort((a, b) => {
          const aDate = a.requestDate || "9999-12-31";
          const bDate = b.requestDate || "9999-12-31";
          return aDate.localeCompare(bDate) || String(a.title || "").localeCompare(String(b.title || ""), "es");
        });
    }

    function openCommitteeSessionAddPointModal() {
      if (!activeCommitteeOrderSessionId) return;
      applyCommitteeOrderTextEdits();

      const session = getCommitteeSessions().find(s => s.id === activeCommitteeOrderSessionId);
      if (!session || session.status === "closed") {
        alert("Solo se pueden añadir puntos a sesiones abiertas de Comité.");
        return;
      }

      const titleEl = document.getElementById("committeeSessionAddPointTitle");
      const listEl = document.getElementById("committeeSessionAddPointList");
      const modal = document.getElementById("committeeSessionAddPointModal");
      if (!titleEl || !listEl || !modal) {
        alert("No se ha encontrado la ventana para añadir puntos.");
        return;
      }

      titleEl.textContent = `${session.title || "Sesión de Comité"} · ${sessionLabel(session)}`;
      const available = getAvailableCommitteePointsForSession(session);
      listEl.innerHTML = available.length ? available.map(item => `
        <label class="committee-session-add-point-row">
          <input type="checkbox" data-committee-add-point value="${escapeHtml(item.id)}" />
          <span class="committee-session-add-point-content">
            <strong>${escapeHtml(item.title || "Sin título")}</strong>
            <small>
              <span>Peticionario: ${escapeHtml(item.petitioner || "Sin indicar")}</span>
              <span>Fecha solicitud: ${escapeHtml(item.requestDate ? new Date(item.requestDate + "T00:00:00").toLocaleDateString("es-ES") : "Sin fecha")}</span>
              <span>Estado: ${escapeHtml(agendaStatusLabel(item.status))}</span>
            </small>
          </span>
        </label>
      `).join("") : `<p class="muted">No hay puntos abiertos o en curso disponibles para añadir.</p>`;

      modal.classList.add("open");
      setTimeout(() => modal.querySelector("[data-committee-add-point]")?.focus(), 0);
    }

    function closeCommitteeSessionAddPointModal() {
      const modal = document.getElementById("committeeSessionAddPointModal");
      if (modal) modal.classList.remove("open");
    }

    function confirmAddSelectedCommitteePoints() {
      if (!activeCommitteeOrderSessionId) return;
      const modal = document.getElementById("committeeSessionAddPointModal");
      const selectedIds = Array.from(modal?.querySelectorAll("[data-committee-add-point]:checked") || []).map(input => input.value);
      if (!selectedIds.length) {
        alert("Selecciona al menos un punto abierto o en curso para añadir.");
        return;
      }

      applyCommitteeOrderTextEdits();
      const sessions = getCommitteeSessions();
      const session = sessions.find(s => s.id === activeCommitteeOrderSessionId);
      if (!session || session.status === "closed") {
        alert("La sesión ya no está abierta.");
        closeCommitteeSessionAddPointModal();
        return;
      }

      const availableIds = new Set(getAvailableCommitteePointsForSession(session).map(item => item.id));
      const idsToAdd = selectedIds.filter(id => availableIds.has(id));
      if (!idsToAdd.length) {
        alert("No hay puntos abiertos o en curso disponibles para añadir.");
        closeCommitteeSessionAddPointModal();
        return;
      }

      session.items = Array.isArray(session.items) ? session.items : [];
      const existingIds = getCommitteeSessionAssignedIds(session);
      idsToAdd.forEach(id => {
        if (!existingIds.has(id)) {
          session.items.push(id);
          committeeOrderDraft.push(id);
          existingIds.add(id);
        }
      });

      setCommitteeSessions(sessions);
      syncAgendaSessionOrder(session.id);
      const agenda = getAgendaItems().map(item => idsToAdd.includes(item.id) ? {
        ...item,
        committeeSessionId: session.id,
        committeeSessionCode: session.code,
        committeeSessionDate: session.date,
        committeeSessionOrder: session.items.indexOf(item.id) + 1,
        closedByCommittee: false
      } : item);
      setAgendaItems(agenda);
      closeCommitteeSessionAddPointModal();
      renderCommitteeSessionOrderDraft();
      renderCommitteeSessions();
      renderAgendaItems();
    }

    function moveCommitteeSessionItem(sessionId, agendaId, direction) {
      const sessions = getCommitteeSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (!session || session.status === "closed") return;
      session.items = Array.isArray(session.items) ? session.items : [];
      const idx = session.items.indexOf(agendaId);
      const newIdx = idx + direction;
      if (idx < 0 || newIdx < 0 || newIdx >= session.items.length) return;
      [session.items[idx], session.items[newIdx]] = [session.items[newIdx], session.items[idx]];
      setCommitteeSessions(sessions);
      syncAgendaSessionOrder(sessionId);
      renderCommitteeSessions();
      renderAgendaItems();
    }

    function removeCommitteeSessionItem(sessionId, agendaId) {
      const sessions = getCommitteeSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (!session || session.status === "closed") return;
      session.items = (session.items || []).filter(id => id !== agendaId);
      setCommitteeSessions(sessions);
      const agenda = getAgendaItems().map(item => item.id === agendaId ? {
        ...item,
        committeeSessionId: "",
        committeeSessionCode: "",
        committeeSessionDate: "",
        committeeSessionOrder: null
      } : item);
      setAgendaItems(agenda);
      syncAgendaSessionOrder(sessionId);
      renderCommitteeSessions();
      renderAgendaItems();
    }

    function syncAgendaSessionOrder(sessionId) {
      const session = getCommitteeSessions().find(s => s.id === sessionId);
      if (!session) return;
      const agenda = getAgendaItems().map(item => {
        const idx = (session.items || []).indexOf(item.id);
        if (idx < 0) return item;
        return {
          ...item,
          committeeSessionId: session.id,
          committeeSessionCode: session.code,
          committeeSessionDate: session.date,
          committeeSessionOrder: idx + 1
        };
      });
      setAgendaItems(agenda);
    }

    function openCommitteeSessionCloseModal(sessionId) {
      const session = getCommitteeSessions().find(s => s.id === sessionId);
      if (!session || session.status === "closed") return;
      activeCommitteeCloseSessionId = sessionId;

      const titleEl = document.getElementById("committeeSessionCloseTitle");
      const listEl = document.getElementById("committeeSessionCloseList");
      const modal = document.getElementById("committeeSessionCloseModal");
      if (!titleEl || !listEl || !modal) {
        alert("No se ha encontrado la ventana de cierre de sesión.");
        return;
      }

      titleEl.textContent = `${session.title || "Sesión de Comité"} · ${sessionLabel(session)}`;
      const items = getCommitteeSessionDisplayItems(session);
      listEl.innerHTML = items.length ? items.map((item, index) => {
        const linked = typeof item.raw === "string" ? getAgendaItems().find(agendaItem => agendaItem.id === item.raw) : null;
        const currentStatus = linked ? agendaStatusLabel(linked.status) : "Histórico importado";
        const petitioner = linked && linked.petitioner ? linked.petitioner : "Sin indicar";
        return `
          <label class="session-close-row">
            <input type="checkbox" data-session-close-point value="${escapeHtml(item.key)}" checked />
            <span class="session-close-content">
              <strong><span class="session-close-number">${index + 1}.</span> ${escapeHtml(item.title || "Sin título")}</strong>
              <small><span>Estado actual: ${escapeHtml(currentStatus)}</span><span>Peticionario: ${escapeHtml(petitioner)}</span></small>
            </span>
          </label>
        `;
      }).join("") : `<p class="muted">Esta sesión no tiene puntos asignados. Puedes cerrarla sin modificar puntos.</p>`;

      modal.classList.add("open");
      setTimeout(() => modal.querySelector("[data-session-close-point]")?.focus(), 0);
    }

    function closeCommitteeSessionCloseModal() {
      activeCommitteeCloseSessionId = null;
      const modal = document.getElementById("committeeSessionCloseModal");
      if (modal) modal.classList.remove("open");
    }

    function confirmCommitteeSessionCloseFromModal() {
      const sessionId = activeCommitteeCloseSessionId;
      if (!sessionId) return;
      const modal = document.getElementById("committeeSessionCloseModal");
      const treatedIds = new Set(Array.from(modal?.querySelectorAll("[data-session-close-point]:checked") || []).map(input => input.value));

      const sessions = getCommitteeSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (!session || session.status === "closed") {
        closeCommitteeSessionCloseModal();
        return;
      }

      const now = new Date().toISOString();
      const originalItems = Array.isArray(session.items) ? [...session.items] : [];
      const displayedItems = getCommitteeSessionDisplayItems(session);
      const linkedDisplayedIds = new Set(displayedItems.filter(item => item.linked).map(item => item.key));
      session.items = displayedItems.filter(item => treatedIds.has(item.key)).map(item => item.raw);
      session.status = "closed";
      session.closedAt = now;

      const agenda = getAgendaItems().map(item => {
        const wasInSession = originalItems.includes(item.id) || linkedDisplayedIds.has(item.id);
        if (!wasInSession) return item;
        const order = session.items.indexOf(item.id);
        if (order >= 0) {
          return {
            ...item,
            status: "agenda-closed",
            closedAt: item.closedAt || now,
            committeeSessionId: session.id,
            committeeSessionCode: session.code,
            committeeSessionDate: session.date,
            committeeSessionOrder: order + 1,
            closedByCommittee: true
          };
        }
        return {
          ...item,
          status: item.status === "agenda-closed" ? "agenda-progress" : item.status,
          closedAt: item.status === "agenda-closed" ? null : item.closedAt,
          committeeSessionId: "",
          committeeSessionCode: "",
          committeeSessionDate: "",
          committeeSessionOrder: null,
          closedByCommittee: false
        };
      });

      setCommitteeSessions(sessions);
      setAgendaItems(agenda);
      closeCommitteeSessionCloseModal();
      renderCommitteeSessions();
      renderAgendaItems();
      promptCommitteeMinuteCreation({ ...session });
    }

    function closeCommitteeSession(sessionId) {
      openCommitteeSessionCloseModal(sessionId);
    }

    function closeCommitteeSessionFromOrderModal() {
      const sessionId = activeCommitteeOrderSessionId;
      if (!sessionId) return;
      closeCommitteeSessionOrderModal();
      openCommitteeSessionCloseModal(sessionId);
    }

    function executeReopenCommitteeSession(sessionId) {
      const sessions = getCommitteeSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (!session || session.status !== "closed") return;
      session.status = "open";
      session.closedAt = null;
      setCommitteeSessions(sessions);
      renderCommitteeSessions();
      updateQuickCounts();
    }

    function reopenCommitteeSession(sessionId) {
      confirmCommitteeAction({
        title: "Reabrir sesión",
        message: "¿Quieres reabrir esta sesión? Los puntos seguirán cerrados salvo que los reabras manualmente.",
        confirmLabel: "Reabrir",
        danger: false,
        onConfirm: () => executeReopenCommitteeSession(sessionId)
      });
    }

    function executeDeleteCommitteeSession(sessionId) {
      const sessions = getCommitteeSessions();
      setCommitteeSessions(sessions.filter(s => s.id !== sessionId));
      const agenda = getAgendaItems().map(item => item.committeeSessionId === sessionId ? {
        ...item,
        committeeSessionId: "",
        committeeSessionCode: "",
        committeeSessionDate: "",
        committeeSessionOrder: null,
        closedByCommittee: false
      } : item);
      setAgendaItems(agenda);
      renderCommitteeSessions();
      renderAgendaItems();
    }

    function deleteCommitteeSession(sessionId) {
      const session = getCommitteeSessions().find(s => s.id === sessionId);
      if (!session) return;
      confirmCommitteeAction({
        title: "Eliminar sesión de Comité",
        message: `¿Quieres eliminar la sesión ${sessionLabel(session)}? No eliminará los puntos, solo la agrupación de sesión.`,
        confirmLabel: "Eliminar",
        onConfirm: () => executeDeleteCommitteeSession(sessionId)
      });
    }

    function getCommitteeSessionView() {
      return "stacked";
    }

    function committeeSessionPanelCollapsed(panel) {
      const key = panel === "history" ? "rrll_committee_sessions_history_collapsed" : "rrll_committee_sessions_open_collapsed";
      const fallback = panel === "history" ? true : false;
      const raw = load(key, fallback ? "true" : "false");
      return raw === true || raw === "true";
    }

    function setCommitteeSessionPanelCollapsed(panel, collapsed) {
      const key = panel === "history" ? "rrll_committee_sessions_history_collapsed" : "rrll_committee_sessions_open_collapsed";
      save(key, collapsed ? "true" : "false");
    }

    function toggleCommitteeSessionPanel(panel) {
      const normalized = panel === "history" ? "history" : "open";
      setCommitteeSessionPanelCollapsed(normalized, !committeeSessionPanelCollapsed(normalized));
      applyCommitteeSessionView();
    }

    function getCommitteeSessionCardState() {
      const state = load("rrll_committee_session_card_collapsed", {});
      return state && typeof state === "object" ? state : {};
    }

    function toggleCommitteeSessionCard(sessionId) {
      const state = getCommitteeSessionCardState();
      state[sessionId] = !state[sessionId];
      save("rrll_committee_session_card_collapsed", state);
      const card = document.getElementById(`rrll-session-${sessionId}`);
      if (card) {
        card.classList.toggle("rrll-session-card-collapsed", !!state[sessionId]);
        const btn = card.querySelector(".rrll-session-card-toggle");
        if (btn) {
          btn.textContent = state[sessionId] ? "▸" : "▾";
          btn.setAttribute("aria-expanded", state[sessionId] ? "false" : "true");
        }
      }
    }

    function setCommitteeSessionView(view) {
      if (view === "history") {
        setCommitteeSessionPanelCollapsed("open", true);
        setCommitteeSessionPanelCollapsed("history", false);
      } else if (view === "open") {
        setCommitteeSessionPanelCollapsed("open", false);
        setCommitteeSessionPanelCollapsed("history", true);
      }
      applyCommitteeSessionView();
    }

    function applyCommitteeSessionView() {
      const columns = document.getElementById("committee-session-columns");
      const openPanel = document.getElementById("committee-sessions-open-panel");
      const closedPanel = document.getElementById("committee-sessions-closed-panel");
      if (!columns || !openPanel || !closedPanel) return;

      const openCollapsed = committeeSessionPanelCollapsed("open");
      const historyCollapsed = committeeSessionPanelCollapsed("history");
      columns.classList.add("rrll-session-stack");
      openPanel.classList.toggle("rrll-session-panel-collapsed-full", openCollapsed);
      closedPanel.classList.toggle("rrll-session-panel-collapsed-full", historyCollapsed);

      const openToggle = document.getElementById("toggle-committee-sessions-open");
      const historyToggle = document.getElementById("toggle-committee-sessions-closed");
      if (openToggle) {
        openToggle.textContent = openCollapsed ? "▸" : "▾";
        openToggle.setAttribute("aria-expanded", openCollapsed ? "false" : "true");
      }
      if (historyToggle) {
        historyToggle.textContent = historyCollapsed ? "▸" : "▾";
        historyToggle.setAttribute("aria-expanded", historyCollapsed ? "false" : "true");
      }
    }

    function committeeSessionYear(session) {
      const date = session.date || session.rawDate || "";
      const isoYear = String(date).match(/^(\d{4})/);
      if (isoYear) return isoYear[1];
      const trailingYear = String(date).match(/(\d{4})/);
      if (trailingYear) return trailingYear[1];
      const codeYear = String(session.code || "").match(/(^|\D)(\d{2})(?=\D)/);
      if (codeYear) {
        const yy = Number(codeYear[2]);
        return String(yy >= 80 ? 1900 + yy : 2000 + yy);
      }
      return "Sin año";
    }

    function committeeSessionSortTime(session) {
      if (session.date && /^\d{4}-\d{2}-\d{2}$/.test(session.date)) {
        const time = new Date(session.date + "T00:00:00").getTime();
        return Number.isFinite(time) ? time : 0;
      }
      const raw = String(session.rawDate || session.date || "").trim();
      const dmY = raw.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2,4})/);
      if (dmY) {
        const day = Number(dmY[1]);
        const month = Number(dmY[2]);
        let year = Number(dmY[3]);
        if (year < 100) year += year >= 80 ? 1900 : 2000;
        const time = new Date(year, month - 1, day).getTime();
        return Number.isFinite(time) ? time : 0;
      }
      return session.createdAt ? new Date(session.createdAt).getTime() || 0 : 0;
    }

    function toggleCommitteeSessionYear(year) {
      const block = document.getElementById(`committee-session-year-${String(year).replace(/[^a-zA-Z0-9_-]/g, "-")}`);
      if (block) block.classList.toggle("year-open");
    }

    function buildCommitteeSessionCard(session, isClosed) {
      const card = document.createElement("div");
      card.className = "session-card clickable-order";
      card.id = `rrll-session-${session.id}`;
      card.title = isClosed ? "Doble clic para editar el histórico" : "Doble clic para ordenar el orden del día";
      card.addEventListener("dblclick", () => openCommitteeSessionOrderModal(session.id));
      const items = getCommitteeSessionDisplayItems(session);
      const itemsHtml = items.length ? items.map((item, index) => `
        <div class="session-item">
          <div class="session-item-title">${index + 1}. ${escapeHtml(item.title || "Sin título")}</div>
          <div class="session-item-meta">${escapeHtml(item.meta || "")}</div>
          <div class="task-actions" onclick="event.stopPropagation()">
            ${!isClosed && item.linked ? `<button class="small danger" onclick="removeCommitteeSessionItem('${session.id}', '${item.key}')">Quitar</button>` : ""}
          </div>
        </div>
      `).join("") : `<p class="muted">Sin puntos asignados todavía.</p>`;

      const cardState = getCommitteeSessionCardState();
      const collapsed = !!cardState[session.id];
      card.classList.toggle("rrll-session-card-collapsed", collapsed);
      card.innerHTML = `
        <div class="session-card-toolbar" onclick="event.stopPropagation()">
          <button class="session-card-icon" type="button" onclick="printCommitteeSession('${session.id}')" title="Imprimir esta sesión">🖨️</button>
          <button class="session-card-icon" type="button" onclick="generateCommitteeMinutesDraft('${session.id}')" title="Generar borrador acta">📄</button>
          <button class="session-card-icon excel-icon" type="button" onclick="exportCommitteeSessionExcel('${session.id}')" title="Exportar esta sesión a Excel" aria-label="Exportar esta sesión a Excel">X</button>
        </div>
        <div class="rrll-session-card-head">
          <button class="rrll-session-card-toggle" type="button" onclick="event.stopPropagation(); toggleCommitteeSessionCard('${session.id}')" aria-expanded="${collapsed ? "false" : "true"}" title="Plegar/desplegar sesión">${collapsed ? "▸" : "▾"}</button>
          <div>
            <div class="session-title">${escapeHtml(session.title || "Sesión de Comité")}</div>
            <div class="session-meta rrll-session-card-summary">
              Código: ${escapeHtml(session.code || "Sin código")} · Fecha: ${escapeHtml(session.date ? new Date(session.date + "T00:00:00").toLocaleDateString("es-ES") : (session.rawDate || "Sin fecha"))} · Estado: ${isClosed ? "Histórico" : "Abierta"}
            </div>
          </div>
        </div>
        <div class="rrll-session-card-body">
          <div class="session-meta">
            ${session.closedAt ? `Cerrada: ${escapeHtml(datePrint(session.closedAt))}<br>` : ""}
            ${escapeHtml(session.notes || "Sin notas")}
          </div>
          <div class="session-items">${itemsHtml}</div>
          <div class="task-actions section-gap" onclick="event.stopPropagation()">
            ${!isClosed ? `<button class="small secondary" onclick="openCommitteeSessionOrderModal('${session.id}')">Ordenar puntos</button><button class="small" onclick="closeCommitteeSession('${session.id}')">Cerrar sesión</button>` : `<button class="small secondary" onclick="openCommitteeSessionOrderModal('${session.id}')">Editar histórico</button><button class="small secondary" onclick="reopenCommitteeSession('${session.id}')">Reabrir</button>`}
            <button class="small danger rrll-delete-icon-button" onclick="deleteCommitteeSession('${session.id}')" title="Eliminar sesión" aria-label="Eliminar sesión"><span aria-hidden="true">🗑️</span></button>
          </div>
        </div>
      `;
      return card;
    }

    function renderCommitteeSessions() {
      const openEl = document.getElementById("committee-sessions-open");
      const closedEl = document.getElementById("committee-sessions-closed");
      if (!openEl || !closedEl) return;

      openEl.innerHTML = "";
      closedEl.innerHTML = "";
      const sessions = getCommitteeSessions();
      const openSessions = sessions
        .filter(session => session.status !== "closed")
        .sort((a, b) => committeeSessionSortTime(b) - committeeSessionSortTime(a));
      const closedSessions = sessions
        .filter(session => session.status === "closed")
        .sort((a, b) => committeeSessionSortTime(b) - committeeSessionSortTime(a));

      openSessions.forEach(session => openEl.appendChild(buildCommitteeSessionCard(session, false)));

      const grouped = closedSessions.reduce((acc, session) => {
        const year = committeeSessionYear(session);
        if (!acc[year]) acc[year] = [];
        acc[year].push(session);
        return acc;
      }, {});

      const years = Object.keys(grouped).sort((a, b) => {
        if (a === "Sin año") return 1;
        if (b === "Sin año") return -1;
        return Number(b) - Number(a);
      });

      years.forEach((year, index) => {
        const safeYear = String(year).replace(/[^a-zA-Z0-9_-]/g, "-");
        const block = document.createElement("div");
        block.className = "session-year-block" + (index === 0 ? " year-open" : "");
        block.id = `committee-session-year-${safeYear}`;
        const header = document.createElement("button");
        header.type = "button";
        header.className = "session-year-header";
        header.onclick = () => toggleCommitteeSessionYear(year);
        header.innerHTML = `<span class="session-year-title">${escapeHtml(year)}</span><span class="session-year-count">${grouped[year].length}</span>`;
        const content = document.createElement("div");
        content.className = "session-year-content";
        grouped[year].forEach(session => content.appendChild(buildCommitteeSessionCard(session, true)));
        block.appendChild(header);
        block.appendChild(content);
        closedEl.appendChild(block);
      });

      if (!openSessions.length) openEl.innerHTML = `<p class="muted">No hay sesiones abiertas.</p>`;
      if (!closedSessions.length) closedEl.innerHTML = `<p class="muted">No hay sesiones históricas.</p>`;
      const openCountEl = document.getElementById("count-committee-sessions-open");
      const closedCountEl = document.getElementById("count-committee-sessions-closed");
      if (openCountEl) openCountEl.textContent = openSessions.length;
      if (closedCountEl) closedCountEl.textContent = closedSessions.length;
      applyCommitteeSessionView(getCommitteeSessionView());
      updateQuickCounts();
    }

    function openCommitteeSessionOrderModal(sessionId) {
      const session = getCommitteeSessions().find(s => s.id === sessionId);
      if (!session) return;

      activeCommitteeOrderSessionId = sessionId;
      committeeOrderDraft = Array.isArray(session.items) ? [...session.items] : [];
      draggedCommitteeAgendaId = null;

      const titleEl = document.getElementById("committeeSessionOrderTitle");
      const addPointButton = document.getElementById("committeeSessionAddPointButton");
      const closeSessionButton = document.getElementById("committeeSessionCloseButton");
      const modal = document.getElementById("committeeSessionOrderModal");
      if (titleEl) titleEl.textContent = `${session.title || "Sesión de Comité"} · ${sessionLabel(session)}`;
      if (addPointButton) addPointButton.style.display = session.status === "closed" ? "none" : "inline-flex";
      if (closeSessionButton) closeSessionButton.style.display = session.status === "closed" ? "none" : "inline-flex";
      renderCommitteeSessionOrderDraft();
      if (modal) modal.classList.add("open");
    }

    function closeCommitteeSessionOrderModal() {
      closeCommitteeSessionAddPointModal();
      activeCommitteeOrderSessionId = null;
      committeeOrderDraft = [];
      draggedCommitteeAgendaId = null;
      const modal = document.getElementById("committeeSessionOrderModal");
      if (modal) modal.classList.remove("open");
    }

    function renderCommitteeSessionOrderDraft() {
      const listEl = document.getElementById("committeeSessionOrderList");
      if (!listEl) return;

      const agendaById = Object.fromEntries(getAgendaItems().map(item => [item.id, item]));
      const visibleItems = committeeOrderDraft.map(raw => ({
        raw,
        key: committeeSessionItemId(raw),
        title: committeeSessionItemTitle(raw, agendaById),
        meta: committeeSessionItemMeta(raw, agendaById),
        linked: typeof raw === "string" && !!agendaById[raw]
      })).filter(item => item.title);

      if (!visibleItems.length) {
        listEl.innerHTML = `<p class="muted">Esta sesión todavía no tiene puntos asignados.</p>`;
        return;
      }

      listEl.innerHTML = visibleItems.map((item, index) => `
        <div class="session-order-row" draggable="true" data-agenda-id="${escapeHtml(item.key)}"
          ondragstart="handleCommitteeOrderDragStart(event, '${escapeHtml(item.key)}')"
          ondragover="handleCommitteeOrderDragOver(event)"
          ondrop="handleCommitteeOrderDrop(event, '${escapeHtml(item.key)}')"
          ondragend="handleCommitteeOrderDragEnd(event)">
          <div class="session-order-number">${index + 1}</div>
          <div class="session-order-content">
            <textarea class="session-order-edit" aria-label="Título del punto ${index + 1}" data-order-key="${escapeHtml(item.key)}" ${item.linked ? "readonly title='Los puntos vinculados se editan desde el gestor de puntos'" : ""}>${escapeHtml(item.title || "Sin título")}</textarea>
            <div class="session-item-meta">${escapeHtml(item.meta || "")}${item.linked ? " · Editar texto desde el gestor de puntos" : ""}</div>
          </div>
          <div class="session-order-handle" title="Arrastra para ordenar">☰</div>
        </div>
      `).join("");
    }

    function handleCommitteeOrderDragStart(event, agendaId) {
      draggedCommitteeAgendaId = agendaId;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", agendaId);
      }
      event.currentTarget.classList.add("dragging");
    }

    function handleCommitteeOrderDragOver(event) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    }

    function handleCommitteeOrderDrop(event, targetAgendaId) {
      event.preventDefault();
      const sourceId = draggedCommitteeAgendaId || (event.dataTransfer ? event.dataTransfer.getData("text/plain") : "");
      if (!sourceId || sourceId === targetAgendaId) return;

      const sourceIndex = committeeOrderDraft.findIndex(raw => committeeSessionItemId(raw) === sourceId);
      const targetIndex = committeeOrderDraft.findIndex(raw => committeeSessionItemId(raw) === targetAgendaId);
      if (sourceIndex < 0 || targetIndex < 0) return;

      committeeOrderDraft.splice(sourceIndex, 1);
      committeeOrderDraft.splice(targetIndex, 0, sourceId);
      renderCommitteeSessionOrderDraft();
    }

    function handleCommitteeOrderDragEnd(event) {
      event.currentTarget.classList.remove("dragging");
      draggedCommitteeAgendaId = null;
    }

    function applyCommitteeOrderTextEdits() {
      const listEl = document.getElementById("committeeSessionOrderList");
      if (!listEl) return;
      const edits = new Map(Array.from(listEl.querySelectorAll("textarea[data-order-key]")).map(textarea => [textarea.getAttribute("data-order-key"), textarea.value.trim()]));
      const agendaById = Object.fromEntries(getAgendaItems().map(item => [item.id, item]));
      committeeOrderDraft = committeeOrderDraft.map(raw => {
        const key = committeeSessionItemId(raw);
        const text = edits.get(key);
        if (!text) return raw;
        if (typeof raw === "object" && raw) return { ...raw, title: text, text, editedAt: new Date().toISOString() };
        if (typeof raw === "string" && agendaById[raw]) return raw;
        if (typeof raw === "string") return { id: raw, title: text, source: "Histórico editado", editedAt: new Date().toISOString() };
        return raw;
      });
    }

    function saveCommitteeSessionOrderFromModal() {
      if (!activeCommitteeOrderSessionId) return;

      const sessions = getCommitteeSessions();
      const session = sessions.find(s => s.id === activeCommitteeOrderSessionId);
      if (!session) return;

      applyCommitteeOrderTextEdits();
      session.items = [...committeeOrderDraft];
      setCommitteeSessions(sessions);
      syncAgendaSessionOrder(session.id);
      closeCommitteeSessionOrderModal();
      renderCommitteeSessions();
      renderAgendaItems();
    }


    let agendaViewFilter = "all";

    function setAgendaViewFilter(filter) {
      agendaViewFilter = ["all", "agenda-pending", "agenda-progress", "agenda-closed"].includes(filter) ? filter : "all";
      renderAgendaItems();
    }

    function agendaStatusLabel(status) {
      const labels = {
        "agenda-pending": "Pendiente",
        "agenda-progress": "En curso",
        "agenda-closed": "Cerrado"
      };
      return labels[status] || "Sin estado";
    }

    function agendaStatusClass(status) {
      const classes = {
        "agenda-pending": "pending",
        "agenda-progress": "progress",
        "agenda-closed": "closed"
      };
      return classes[status] || "pending";
    }

    function lastAgendaUpdate(item) {
      const updates = Array.isArray(item.updates) ? item.updates : [];
      if (!updates.length) return "Sin avances";
      const last = updates[updates.length - 1];
      const date = last.createdAt ? new Date(last.createdAt).toLocaleDateString("es-ES") : "Sin fecha";
      return `${date}: ${last.text || "Actualización sin texto"}`;
    }

    function agendaMatchesQuery(item, query) {
      if (!query) return true;
      const updates = Array.isArray(item.updates) ? item.updates.map(update => update.text || "").join(" ") : "";
      return itemSearchText([item.title, item.petitioner, item.notes, item.requestDate, agendaStatusLabel(item.status), item.committeeSessionCode, item.committeeSessionDate, updates]).includes(query);
    }

    let agendaRowClickTimer = null;

    function isAgendaInteractiveTarget(event) {
      return !!(event && event.target && event.target.closest && event.target.closest("button, a, input, select, textarea, label"));
    }

    function getAgendaRowFromEvent(event) {
      return event?.target?.closest?.("tr.rrll-agenda-row[data-agenda-id]");
    }

    function toggleAgendaRowDetails(event, id) {
      if (isAgendaInteractiveTarget(event)) return;
      const row = document.getElementById(`rrll-agenda-${id}`);
      if (row) row.classList.toggle("expanded");
    }

    function handleAgendaRowClick(event, id) {
      if (isAgendaInteractiveTarget(event)) return;
      const row = id ? null : getAgendaRowFromEvent(event);
      const rowId = id || row?.getAttribute("data-agenda-id");
      if (!rowId) return;
      if (agendaRowClickTimer) {
        clearTimeout(agendaRowClickTimer);
        agendaRowClickTimer = null;
      }
      agendaRowClickTimer = setTimeout(() => {
        toggleAgendaRowDetails(event, rowId);
        agendaRowClickTimer = null;
      }, 220);
    }

    function handleAgendaRowDoubleClick(event, id) {
      if (isAgendaInteractiveTarget(event)) return;
      const row = id ? null : getAgendaRowFromEvent(event);
      const rowId = id || row?.getAttribute("data-agenda-id");
      if (!rowId) return;
      if (agendaRowClickTimer) {
        clearTimeout(agendaRowClickTimer);
        agendaRowClickTimer = null;
      }
      if (event && typeof event.preventDefault === "function") event.preventDefault();
      if (event && typeof event.stopPropagation === "function") event.stopPropagation();
      openAgendaUpdateModal(rowId);
    }

    function ensureAgendaDoubleClickBinding() {
      const tableBody = document.getElementById("agendaTableBody");
      if (!tableBody) return;
      if (tableBody.dataset.clickBound !== "true") {
        tableBody.dataset.clickBound = "true";
        tableBody.addEventListener("click", handleAgendaRowClick);
      }
      if (tableBody.dataset.dblclickBound !== "true") {
        tableBody.dataset.dblclickBound = "true";
      }
    }

    function renderAgendaRow(item, index) {
      const created = item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-ES") : "Sin fecha";
      const closed = item.closedAt ? new Date(item.closedAt).toLocaleDateString("es-ES") : "";
      const requestDate = item.requestDate ? new Date(item.requestDate + "T00:00:00").toLocaleDateString("es-ES") : "Sin fecha";
      const statusClass = agendaStatusClass(item.status);
      const sessionInfo = item.committeeSessionId
        ? `${item.committeeSessionCode || "sin código"}${item.committeeSessionDate ? " · " + new Date(item.committeeSessionDate + "T00:00:00").toLocaleDateString("es-ES") : ""}${item.committeeSessionOrder ? " · punto " + item.committeeSessionOrder : ""}`
        : "Sin sesión";
      const notes = item.notes || "Sin notas";
      return `
        <tr id="rrll-agenda-${item.id}" data-agenda-id="${escapeHtml(item.id)}" class="rrll-pro-row rrll-agenda-row status-${statusClass}" title="Clic para desplegar detalle">
          <td class="rrll-pro-main-cell">
            <div class="rrll-pro-title">${index + 1}. ${escapeHtml(item.title || "Sin título")}</div>
            <div class="rrll-pro-subtitle">${escapeHtml(notes)}</div>
            <div class="rrll-pro-created">Creado: ${escapeHtml(created)}${closed ? ` · Cerrado: ${escapeHtml(closed)}` : ""}</div>
          </td>
          <td>${escapeHtml(item.petitioner || "Sin indicar")}</td>
          <td><span class="rrll-status-pill ${statusClass}">${escapeHtml(agendaStatusLabel(item.status))}</span></td>
          <td>${escapeHtml(requestDate)}</td>
          <td><span class="committee-badge rrll-pro-source">${escapeHtml(sessionInfo)}</span></td>
          <td class="rrll-pro-update">${escapeHtml(lastAgendaUpdate(item))}</td>
          <td class="rrll-pro-actions" onclick="event.stopPropagation()">
            <button class="small secondary" onclick="event.stopPropagation(); openAgendaUpdateModal('${item.id}')">Editar</button>
            ${item.status !== "agenda-pending" ? `<button class="small secondary" onclick="event.stopPropagation(); moveAgendaItem('${item.id}', 'agenda-pending')">Pendiente</button>` : ""}
            ${item.status !== "agenda-progress" ? `<button class="small black" onclick="event.stopPropagation(); moveAgendaItem('${item.id}', 'agenda-progress')">En curso</button>` : ""}
            ${item.status === "agenda-progress" ? `<button class="small" onclick="event.stopPropagation(); addAgendaItemToCommitteeSession('${item.id}')">Añadir a Comité</button>` : ""}
            ${item.status !== "agenda-closed" ? `<button class="small" onclick="event.stopPropagation(); moveAgendaItem('${item.id}', 'agenda-closed')">Cerrar</button>` : ""}
            <button class="small danger rrll-delete-icon-button" onclick="event.stopPropagation(); deleteAgendaItem('${item.id}')" title="Eliminar punto" aria-label="Eliminar punto"><span aria-hidden="true">🗑️</span></button>
          </td>
        </tr>
      `;
    }

    function renderAgendaItems() {
      const items = getAgendaItems();
      const counts = { "agenda-pending": 0, "agenda-progress": 0, "agenda-closed": 0 };
      items.forEach(item => { counts[item.status] = (counts[item.status] || 0) + 1; });

      const allEl = document.getElementById("count-agenda-all");
      const pendingEl = document.getElementById("count-agenda-pending");
      const progressEl = document.getElementById("count-agenda-progress");
      const closedEl = document.getElementById("count-agenda-closed");
      if (allEl) allEl.textContent = items.length;
      if (pendingEl) pendingEl.textContent = counts["agenda-pending"];
      if (progressEl) progressEl.textContent = counts["agenda-progress"];
      if (closedEl) closedEl.textContent = counts["agenda-closed"];

      document.querySelectorAll("#gestor-puntos-comite .rrll-pro-tabs button").forEach(button => button.classList.remove("active"));
      const activeId = agendaViewFilter === "all" ? "agenda-filter-all" : `agenda-filter-${agendaViewFilter.replace("agenda-", "")}`;
      const activeFilter = document.getElementById(activeId);
      if (activeFilter) activeFilter.classList.add("active");

      const query = (document.getElementById("agendaInlineSearch")?.value || "").trim().toLowerCase();
      const filtered = items
        .filter(item => agendaViewFilter === "all" || item.status === agendaViewFilter)
        .filter(item => agendaMatchesQuery(item, query));

      const statusOrder = { "agenda-progress": 0, "agenda-pending": 1, "agenda-closed": 2 };
      filtered.sort((a, b) => {
        const byStatus = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
        if (agendaViewFilter === "all" && byStatus) return byStatus;
        const aDate = a.requestDate || "9999-12-31";
        const bDate = b.requestDate || "9999-12-31";
        return aDate.localeCompare(bDate);
      });

      const tableBody = document.getElementById("agendaTableBody");
      const empty = document.getElementById("agendaTableEmpty");
      if (tableBody) {
        tableBody.innerHTML = filtered.map(renderAgendaRow).join("");
        ensureAgendaDoubleClickBinding();
      } else {
        ["agenda-pending", "agenda-progress", "agenda-closed"].forEach(status => {
          const el = document.getElementById(status);
          if (el) el.innerHTML = "";
        });
      }
      if (empty) empty.style.display = filtered.length ? "none" : "block";

      updateQuickCounts();
      renderCommitteeSessions();
      renderAlertsPanel();
    }





  const api = {
    getAgendaItems,
    setAgendaItems,
    addAgendaItem,
    toggleAgendaCreateForm,
    toggleCommitteeSessionCreateForm,
    moveAgendaItem,
    deleteAgendaItem,
    openAgendaUpdateModal,
    closeAgendaUpdateModal,
    saveAgendaUpdateFromModal,
    getCommitteeSessions,
    setCommitteeSessions,
    getCommitteeSessionDisplayItems,
    importCommitteeHistoryFromWord,
    addCommitteeSession,
    sessionLabel,
    generateCommitteeMinutesDraft,
    openAddAgendaToCommitteeModal,
    closeAddAgendaToCommitteeModal,
    confirmAddAgendaToCommitteeSession,
    addAgendaItemToCommitteeSession,
    closeCommitteeSessionCloseModal,
    confirmCommitteeSessionCloseFromModal,
    moveCommitteeSessionItem,
    removeCommitteeSessionItem,
    syncAgendaSessionOrder,
    closeCommitteeSession,
    closeCommitteeSessionFromOrderModal,
    reopenCommitteeSession,
    deleteCommitteeSession,
    getCommitteeSessionView,
    setCommitteeSessionView,
    applyCommitteeSessionView,
    toggleCommitteeSessionPanel,
    toggleCommitteeSessionCard,
    toggleCommitteeSessionYear,
    renderCommitteeSessions,
    openCommitteeSessionOrderModal,
    closeCommitteeSessionOrderModal,
    openCommitteeSessionAddPointModal,
    closeCommitteeSessionAddPointModal,
    confirmAddSelectedCommitteePoints,
    handleCommitteeOrderDragStart,
    handleCommitteeOrderDragOver,
    handleCommitteeOrderDrop,
    handleCommitteeOrderDragEnd,
    saveCommitteeSessionOrderFromModal,
    renderAgendaItems,
    setAgendaViewFilter,
    toggleAgendaRowDetails,
    handleAgendaRowClick,
    handleAgendaRowDoubleClick,
    ensureAgendaDoubleClickBinding
  };

  window.ComiteModule = api;

  // Compatibilidad temporal con HTML/app.js mientras se completa Fase 3.
  Object.assign(window, api);
})();
