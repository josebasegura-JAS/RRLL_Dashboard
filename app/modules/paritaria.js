// Fase 3.7: Comisión Paritaria encapsulada como módulo independiente.
// Mantiene wrappers globales por compatibilidad con los onclick existentes del HTML y app.js.
(function () {
  'use strict';

// Fase 3: módulo extraído desde app.js sin cambiar funcionalidad.

    function getParitariaItems() {
      return load("rrll_paritaria_items", []);
    }

    function setParitariaItems(items) {
      save("rrll_paritaria_items", items);
    }

    function toggleParitariaCreateForm(forceOpen) {
      const form = document.getElementById("paritariaCreateForm");
      if (!form) return;
      const open = typeof forceOpen === "boolean" ? forceOpen : form.classList.contains("rrll-create-form-collapsed");
      form.classList.toggle("rrll-create-form-collapsed", !open);
      if (open) setTimeout(() => document.getElementById("newParitariaTitle")?.focus(), 0);
    }

    function toggleParitariaSessionCreateForm(forceOpen) {
      const form = document.getElementById("paritariaSessionCreateForm");
      if (!form) return;
      const open = typeof forceOpen === "boolean" ? forceOpen : form.classList.contains("rrll-create-form-collapsed");
      form.classList.toggle("rrll-create-form-collapsed", !open);
      if (open) setTimeout(() => document.getElementById("newParitariaSessionDate")?.focus(), 0);
    }

    function addParitariaItem() {
      const petitionerEl = document.getElementById("newParitariaPetitioner");
      const titleEl = document.getElementById("newParitariaTitle");
      const requestDateEl = document.getElementById("newParitariaRequestDate");
      const notesEl = document.getElementById("newParitariaNotes");

      const title = titleEl.value.trim();
      if (!title) {
        alert("Introduce el punto del orden del día.");
        return;
      }

      const now = new Date().toISOString();
      const items = getParitariaItems();

      items.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        petitioner: petitionerEl.value.trim(),
        title,
        requestDate: requestDateEl.value,
        status: "paritaria-pending",
        notes: notesEl.value.trim(),
        updates: [],
        createdAt: now,
        closedAt: null
      });

      setParitariaItems(items);

      petitionerEl.value = "";
      titleEl.value = "";
      requestDateEl.value = "";
      notesEl.value = "";

      renderParitariaItems();
      toggleParitariaCreateForm(false);
    }

    function moveParitariaItem(id, status) {
      const now = new Date().toISOString();
      const items = getParitariaItems().map(item => {
        if (item.id !== id) return item;
        return {
          ...item,
          status,
          closedAt: status === "paritaria-closed" ? (item.closedAt || now) : null
        };
      });
      setParitariaItems(items);
      renderParitariaItems();
    }

    function deleteParitariaItem(id) {
      const items = getParitariaItems();
      const item = items.find(i => i.id === id);
      if (item) moveToTrash("paritaria", item);
      setParitariaItems(items.filter(i => i.id !== id));
      renderParitariaItems();
      renderTrash();
      restoreAlertsPanelState();
      renderAlertsPanel();
    }

    let activeParitariaUpdateId = null;

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


    function openParitariaUpdateModal(id) {
      const items = getParitariaItems();
      const item = items.find(i => i.id === id);
      if (!item) return;

      activeParitariaUpdateId = id;
      const titleEl = document.getElementById("paritariaUpdateModalTitle");
      if (titleEl) titleEl.textContent = item.title || "Punto sin título";

      const titleInput = document.getElementById("paritariaEditTitle");
      const petitionerInput = document.getElementById("paritariaEditPetitioner");
      const requestDateInput = document.getElementById("paritariaEditRequestDate");
      const statusInput = document.getElementById("paritariaEditStatus");
      const notesInput = document.getElementById("paritariaEditNotes");
      const updateInput = document.getElementById("paritariaUpdateModalText");

      if (titleInput) titleInput.value = item.title || "";
      if (petitionerInput) petitionerInput.value = item.petitioner || "";
      if (requestDateInput) requestDateInput.value = item.requestDate || "";
      if (statusInput) statusInput.value = item.status || "paritaria-pending";
      if (notesInput) notesInput.value = item.notes || "";
      if (updateInput) updateInput.value = "";
      renderEditableUpdates("paritariaExistingUpdates", item.updates || []);

      document.getElementById("paritariaUpdateModal").classList.add("open");
      setTimeout(() => (updateInput || titleInput)?.focus(), 0);
    }

    function closeParitariaUpdateModal() {
      activeParitariaUpdateId = null;
      const modal = document.getElementById("paritariaUpdateModal");
      if (modal) modal.classList.remove("open");
      ["paritariaEditTitle", "paritariaEditPetitioner", "paritariaEditRequestDate", "paritariaEditNotes", "paritariaUpdateModalText"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      const statusInput = document.getElementById("paritariaEditStatus");
      if (statusInput) statusInput.value = "paritaria-pending";
      const existing = document.getElementById("paritariaExistingUpdates");
      if (existing) existing.innerHTML = "";
    }

    function saveParitariaUpdateFromModal() {
      if (!activeParitariaUpdateId) return;

      const title = (document.getElementById("paritariaEditTitle")?.value || "").trim();
      if (!title) {
        alert("El punto necesita un título.");
        return;
      }

      const petitioner = (document.getElementById("paritariaEditPetitioner")?.value || "").trim();
      const requestDate = document.getElementById("paritariaEditRequestDate")?.value || "";
      const status = document.getElementById("paritariaEditStatus")?.value || "paritaria-pending";
      const notes = (document.getElementById("paritariaEditNotes")?.value || "").trim();
      const updateText = (document.getElementById("paritariaUpdateModalText")?.value || "").trim();
      const now = new Date().toISOString();

      const items = getParitariaItems().map(item => {
        if (item.id !== activeParitariaUpdateId) return item;
        const editedUpdates = collectEditableUpdates("paritariaExistingUpdates", item.updates || []);
        const updates = updateText
          ? [...editedUpdates, { text: updateText, createdAt: now }]
          : editedUpdates;
        return {
          ...item,
          title,
          petitioner,
          requestDate,
          status,
          notes,
          closedAt: status === "paritaria-closed" ? (item.closedAt || now) : null,
          updatedAt: now,
          updates
        };
      });

      setParitariaItems(items);
      closeParitariaUpdateModal();
      renderParitariaItems();
    }


    function getParitariaSessions() {
      const sessions = load("rrll_paritaria_sessions", []);
      return Array.isArray(sessions) ? sessions : [];
    }

    function setParitariaSessions(sessions) {
      save("rrll_paritaria_sessions", Array.isArray(sessions) ? sessions : []);
    }


    function paritariaSessionItemTitle(raw, paritariaById) {
      if (!raw) return "";
      if (typeof raw === "string") {
        const linked = paritariaById && paritariaById[raw];
        return linked ? (linked.title || "") : raw;
      }
      if (typeof raw === "object") return raw.title || raw.text || raw.name || "";
      return String(raw);
    }

    function paritariaSessionItemMeta(raw, paritariaById) {
      if (!raw) return "";
      if (typeof raw === "string") {
        const linked = paritariaById && paritariaById[raw];
        return linked ? `Peticionario: ${linked.petitioner || "Sin indicar"} · Estado: ${statusLabel(linked.status)}` : "Histórico importado";
      }
      if (typeof raw === "object") return raw.source || "Histórico importado";
      return "Histórico importado";
    }

    function paritariaSessionItemId(raw) {
      if (!raw) return "";
      if (typeof raw === "string") return raw;
      if (typeof raw === "object") return raw.id || raw.title || JSON.stringify(raw);
      return String(raw);
    }

    function getParitariaSessionDisplayItems(session) {
      const paritariaById = Object.fromEntries(getParitariaItems().map(item => [item.id, item]));
      return (Array.isArray(session.items) ? session.items : []).map((raw, index) => ({
        raw,
        key: paritariaSessionItemId(raw),
        title: paritariaSessionItemTitle(raw, paritariaById),
        meta: paritariaSessionItemMeta(raw, paritariaById),
        linked: typeof raw === "string" && !!paritariaById[raw],
        index
      })).filter(item => item.title);
    }

    async function importParitariaHistoryFromWord() {
      if (!window.rrllDB || typeof window.rrllDB.importParitariaHistoryDocx !== "function") {
        alert("El importador de histórico Word solo está disponible en la aplicación Electron.");
        return;
      }
      try {
        const result = await window.rrllDB.importParitariaHistoryDocx();
        if (!result) return;
        if (!result.sessions || !result.sessions.length) {
          alert("No se han detectado sesiones importables en el documento.");
          return;
        }
        const confirmed = confirm(`Se han detectado ${result.sessionCount} sesiones y ${result.pointCount} puntos del orden del día en ${result.fileName}.\n\nSe importarán solo como sesiones históricas de Paritaria, sin crear puntos en el gestor de puntos.\n\n¿Continuar?`);
        if (!confirmed) return;
        const existing = getParitariaSessions();
        const existingKeys = new Set(existing.map(s => `${String(s.code || "").trim().toLowerCase()}|${String(s.date || s.rawDate || "").trim().toLowerCase()}`));
        const incoming = result.sessions.filter(s => {
          const key = `${String(s.code || "").trim().toLowerCase()}|${String(s.date || s.rawDate || "").trim().toLowerCase()}`;
          return !existingKeys.has(key);
        });
        if (!incoming.length) {
          alert("Todas las sesiones detectadas ya existen en la app. No se ha importado nada.");
          return;
        }
        setParitariaSessions([...incoming, ...existing]);
        renderParitariaSessions();
        updateQuickCounts();
        alert(`Importación completada.\nSesiones importadas: ${incoming.length}\nSesiones omitidas por posible duplicado: ${result.sessions.length - incoming.length}`);
      } catch (error) {
        alert(`No se pudo importar el histórico.\nDetalle: ${error && error.message ? error.message : error}`);
      }
    }

    function addParitariaSession() {
      const dateEl = document.getElementById("newParitariaSessionDate");
      const codeEl = document.getElementById("newParitariaSessionCode");
      const titleEl = document.getElementById("newParitariaSessionTitle");
      const notesEl = document.getElementById("newParitariaSessionNotes");

      const date = dateEl ? dateEl.value : "";
      const code = codeEl ? codeEl.value.trim() : "";
      const title = titleEl ? titleEl.value.trim() : "";
      const notes = notesEl ? notesEl.value.trim() : "";

      if (!date || !code) {
        alert("Indica al menos fecha y código documental de la sesión.");
        return;
      }

      const sessions = getParitariaSessions();
      sessions.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        date,
        code,
        title: title || `Paritaria ${date}`,
        notes,
        status: "open",
        items: [],
        createdAt: new Date().toISOString(),
        closedAt: null
      });

      setParitariaSessions(sessions);
      if (dateEl) dateEl.value = "";
      if (codeEl) codeEl.value = "";
      if (titleEl) titleEl.value = "";
      if (notesEl) notesEl.value = "";
      renderParitariaSessions();
      updateQuickCounts();
      toggleParitariaSessionCreateForm(false);
    }

    function sessionLabel(session) {
      if (!session) return "Sin sesión";
      const date = session.date ? new Date(session.date + "T00:00:00").toLocaleDateString("es-ES") : "Sin fecha";
      return `${session.code || "Sin código"} · ${date}`;
    }

    let activeParitariaAddToSessionId = null;
    let activeParitariaOrderSessionId = null;
    let paritariaOrderDraft = [];
    let draggedParitariaParitariaId = null;

    function openAddParitariaToParitariaModal(paritariaId) {
      const paritaria = getParitariaItems();
      const item = paritaria.find(i => i.id === paritariaId);
      if (!item || item.status !== "paritaria-progress") return;

      activeParitariaAddToSessionId = paritariaId;
      const titleEl = document.getElementById("paritariaSessionSelectParitariaTitle");
      const listEl = document.getElementById("paritariaSessionSelectList");
      const modal = document.getElementById("paritariaSessionSelectModal");
      if (!titleEl || !listEl || !modal) {
        alert("No se ha encontrado la ventana de selección de sesión.");
        return;
      }

      titleEl.textContent = item.title || "Punto sin título";
      const openSessions = getParitariaSessions()
        .filter(s => s.status !== "closed")
        .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

      listEl.innerHTML = openSessions.length
        ? openSessions.map(session => `
          <div class="session-select-option" onclick="confirmAddParitariaToParitariaSession('${session.id}')">
            <div class="session-title">${escapeHtml(session.title || "Sesión de Paritaria")}</div>
            <div class="session-meta">Código: ${escapeHtml(session.code || "Sin código")}<br>Fecha: ${escapeHtml(session.date ? new Date(session.date + "T00:00:00").toLocaleDateString("es-ES") : "Sin fecha")}<br>Puntos actuales: ${escapeHtml((session.items || []).length)}</div>
          </div>
        `).join("")
        : `<p class="muted">No hay sesiones abiertas. Crea primero una sesión en el gestor de Sesiones de Paritaria.</p>`;

      modal.classList.add("open");
    }

    function closeAddParitariaToParitariaModal() {
      activeParitariaAddToSessionId = null;
      const modal = document.getElementById("paritariaSessionSelectModal");
      if (modal) modal.classList.remove("open");
    }

    function confirmAddParitariaToParitariaSession(sessionId) {
      const paritariaId = activeParitariaAddToSessionId;
      if (!paritariaId || !sessionId) return;

      const paritaria = getParitariaItems();
      const item = paritaria.find(i => i.id === paritariaId);
      if (!item || item.status !== "paritaria-progress") return;

      const sessions = getParitariaSessions();
      const session = sessions.find(s => s.id === sessionId && s.status !== "closed");
      if (!session) {
        alert("La sesión seleccionada no está abierta.");
        return;
      }

      session.items = Array.isArray(session.items) ? session.items : [];
      if (!session.items.includes(paritariaId)) session.items.push(paritariaId);

      const updatedParitaria = paritaria.map(i => i.id === paritariaId ? {
        ...i,
        paritariaSessionId: session.id,
        paritariaSessionCode: session.code,
        paritariaSessionDate: session.date,
        paritariaSessionOrder: session.items.indexOf(paritariaId) + 1
      } : i);

      setParitariaSessions(sessions);
      setParitariaItems(updatedParitaria);
      closeAddParitariaToParitariaModal();
      renderParitariaSessions();
      renderParitariaItems();
    }

    function addParitariaItemToParitariaSession(paritariaId) {
      openAddParitariaToParitariaModal(paritariaId);
    }

    function moveParitariaSessionItem(sessionId, paritariaId, direction) {
      const sessions = getParitariaSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (!session || session.status === "closed") return;
      session.items = Array.isArray(session.items) ? session.items : [];
      const idx = session.items.indexOf(paritariaId);
      const newIdx = idx + direction;
      if (idx < 0 || newIdx < 0 || newIdx >= session.items.length) return;
      [session.items[idx], session.items[newIdx]] = [session.items[newIdx], session.items[idx]];
      setParitariaSessions(sessions);
      syncParitariaSessionOrder(sessionId);
      renderParitariaSessions();
      renderParitariaItems();
    }

    function removeParitariaSessionItem(sessionId, paritariaId) {
      const sessions = getParitariaSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (!session || session.status === "closed") return;
      session.items = (session.items || []).filter(id => id !== paritariaId);
      setParitariaSessions(sessions);
      const paritaria = getParitariaItems().map(item => item.id === paritariaId ? {
        ...item,
        paritariaSessionId: "",
        paritariaSessionCode: "",
        paritariaSessionDate: "",
        paritariaSessionOrder: null
      } : item);
      setParitariaItems(paritaria);
      syncParitariaSessionOrder(sessionId);
      renderParitariaSessions();
      renderParitariaItems();
    }

    function syncParitariaSessionOrder(sessionId) {
      const session = getParitariaSessions().find(s => s.id === sessionId);
      if (!session) return;
      const paritaria = getParitariaItems().map(item => {
        const idx = (session.items || []).indexOf(item.id);
        if (idx < 0) return item;
        return {
          ...item,
          paritariaSessionId: session.id,
          paritariaSessionCode: session.code,
          paritariaSessionDate: session.date,
          paritariaSessionOrder: idx + 1
        };
      });
      setParitariaItems(paritaria);
    }

    function closeParitariaSession(sessionId) {
      const sessions = getParitariaSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (!session || session.status === "closed") return;
      const confirmed = confirm(`Cerrar la sesión ${sessionLabel(session)} y pasar sus puntos al histórico de Paritaria?`);
      if (!confirmed) return;

      const now = new Date().toISOString();
      session.status = "closed";
      session.closedAt = now;
      session.items = Array.isArray(session.items) ? session.items : [];

      const paritaria = getParitariaItems().map(item => {
        const order = session.items.indexOf(item.id);
        if (order < 0) return item;
        return {
          ...item,
          status: "paritaria-closed",
          closedAt: item.closedAt || now,
          paritariaSessionId: session.id,
          paritariaSessionCode: session.code,
          paritariaSessionDate: session.date,
          paritariaSessionOrder: order + 1,
          closedByParitaria: true
        };
      });

      setParitariaSessions(sessions);
      setParitariaItems(paritaria);
      renderParitariaSessions();
      renderParitariaItems();
    }

    function reopenParitariaSession(sessionId) {
      const sessions = getParitariaSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (!session || session.status !== "closed") return;
      const confirmed = confirm("Reabrir esta sesión? Los puntos seguirán cerrados salvo que los reabras manualmente.");
      if (!confirmed) return;
      session.status = "open";
      session.closedAt = null;
      setParitariaSessions(sessions);
      renderParitariaSessions();
      updateQuickCounts();
    }

    function deleteParitariaSession(sessionId) {
      const sessions = getParitariaSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;
      const confirmed = confirm("Eliminar esta sesión? No eliminará los puntos, solo la agrupación de sesión.");
      if (!confirmed) return;
      setParitariaSessions(sessions.filter(s => s.id !== sessionId));
      const paritaria = getParitariaItems().map(item => item.paritariaSessionId === sessionId ? {
        ...item,
        paritariaSessionId: "",
        paritariaSessionCode: "",
        paritariaSessionDate: "",
        paritariaSessionOrder: null,
        closedByParitaria: false
      } : item);
      setParitariaItems(paritaria);
      renderParitariaSessions();
      renderParitariaItems();
    }

    function getParitariaSessionView() {
      return "stacked";
    }

    function paritariaSessionPanelCollapsed(panel) {
      const key = panel === "history" ? "rrll_paritaria_sessions_history_collapsed" : "rrll_paritaria_sessions_open_collapsed";
      const fallback = panel === "history" ? true : false;
      const raw = load(key, fallback ? "true" : "false");
      return raw === true || raw === "true";
    }

    function setParitariaSessionPanelCollapsed(panel, collapsed) {
      const key = panel === "history" ? "rrll_paritaria_sessions_history_collapsed" : "rrll_paritaria_sessions_open_collapsed";
      save(key, collapsed ? "true" : "false");
    }

    function toggleParitariaSessionPanel(panel) {
      const normalized = panel === "history" ? "history" : "open";
      setParitariaSessionPanelCollapsed(normalized, !paritariaSessionPanelCollapsed(normalized));
      applyParitariaSessionView();
    }

    function getParitariaSessionCardState() {
      const state = load("rrll_paritaria_session_card_collapsed", {});
      return state && typeof state === "object" ? state : {};
    }

    function toggleParitariaSessionCard(sessionId) {
      const state = getParitariaSessionCardState();
      state[sessionId] = !state[sessionId];
      save("rrll_paritaria_session_card_collapsed", state);
      const card = document.getElementById(`rrll-paritaria-session-${sessionId}`);
      if (card) {
        card.classList.toggle("rrll-session-card-collapsed", !!state[sessionId]);
        const btn = card.querySelector(".rrll-session-card-toggle");
        if (btn) {
          btn.textContent = state[sessionId] ? "▸" : "▾";
          btn.setAttribute("aria-expanded", state[sessionId] ? "false" : "true");
        }
      }
    }

    function setParitariaSessionView(view) {
      if (view === "history") {
        setParitariaSessionPanelCollapsed("open", true);
        setParitariaSessionPanelCollapsed("history", false);
      } else if (view === "open") {
        setParitariaSessionPanelCollapsed("open", false);
        setParitariaSessionPanelCollapsed("history", true);
      }
      applyParitariaSessionView();
    }

    function applyParitariaSessionView() {
      const columns = document.getElementById("paritaria-session-columns");
      const openPanel = document.getElementById("paritaria-sessions-open-panel");
      const closedPanel = document.getElementById("paritaria-sessions-closed-panel");
      if (!columns || !openPanel || !closedPanel) return;

      const openCollapsed = paritariaSessionPanelCollapsed("open");
      const historyCollapsed = paritariaSessionPanelCollapsed("history");
      columns.classList.add("rrll-session-stack");
      openPanel.classList.toggle("rrll-session-panel-collapsed-full", openCollapsed);
      closedPanel.classList.toggle("rrll-session-panel-collapsed-full", historyCollapsed);

      const openToggle = document.getElementById("toggle-paritaria-sessions-open");
      const historyToggle = document.getElementById("toggle-paritaria-sessions-closed");
      if (openToggle) {
        openToggle.textContent = openCollapsed ? "▸" : "▾";
        openToggle.setAttribute("aria-expanded", openCollapsed ? "false" : "true");
      }
      if (historyToggle) {
        historyToggle.textContent = historyCollapsed ? "▸" : "▾";
        historyToggle.setAttribute("aria-expanded", historyCollapsed ? "false" : "true");
      }
    }

    function paritariaSessionYear(session) {
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

    function paritariaSessionSortTime(session) {
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

    function toggleParitariaSessionYear(year) {
      const block = document.getElementById(`paritaria-session-year-${String(year).replace(/[^a-zA-Z0-9_-]/g, "-")}`);
      if (block) block.classList.toggle("year-open");
    }

    function buildParitariaSessionCard(session, isClosed) {
      const card = document.createElement("div");
      card.className = "session-card clickable-order";
      card.id = `rrll-paritaria-session-${session.id}`;
      card.title = isClosed ? "Doble clic para editar el histórico" : "Doble clic para ordenar el orden del día";
      card.addEventListener("dblclick", () => openParitariaSessionOrderModal(session.id));
      const items = getParitariaSessionDisplayItems(session);
      const itemsHtml = items.length ? items.map((item, index) => `
        <div class="session-item">
          <div class="session-item-title">${index + 1}. ${escapeHtml(item.title || "Sin título")}</div>
          <div class="session-item-meta">${escapeHtml(item.meta || "")}</div>
          <div class="task-actions" onclick="event.stopPropagation()">
            ${!isClosed && item.linked ? `<button class="small danger" onclick="removeParitariaSessionItem('${session.id}', '${item.key}')">Quitar</button>` : ""}
          </div>
        </div>
      `).join("") : `<p class="muted">Sin puntos asignados todavía.</p>`;

      const cardState = getParitariaSessionCardState();
      const collapsed = !!cardState[session.id];
      card.classList.toggle("rrll-session-card-collapsed", collapsed);
      card.innerHTML = `
        <div class="session-card-toolbar" onclick="event.stopPropagation()">
          <button class="session-card-icon" type="button" onclick="printParitariaSession('${session.id}')" title="Imprimir esta sesión">🖨️</button>
          <button class="session-card-icon excel-icon" type="button" onclick="exportParitariaSessionExcel('${session.id}')" title="Exportar esta sesión a Excel">X</button>
        </div>
        <div class="rrll-session-card-head">
          <button class="rrll-session-card-toggle" type="button" onclick="event.stopPropagation(); toggleParitariaSessionCard('${session.id}')" aria-expanded="${collapsed ? "false" : "true"}" title="Plegar/desplegar sesión">${collapsed ? "▸" : "▾"}</button>
          <div>
            <div class="session-title">${escapeHtml(session.title || "Sesión de Paritaria")}</div>
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
            ${!isClosed ? `<button class="small secondary" onclick="openParitariaSessionOrderModal('${session.id}')">Ordenar puntos</button><button class="small" onclick="closeParitariaSession('${session.id}')">Cerrar sesión</button>` : `<button class="small secondary" onclick="openParitariaSessionOrderModal('${session.id}')">Editar histórico</button><button class="small secondary" onclick="reopenParitariaSession('${session.id}')">Reabrir</button>`}
            <button class="small danger" onclick="deleteParitariaSession('${session.id}')">Eliminar sesión</button>
          </div>
        </div>
      `;
      return card;
    }

    function renderParitariaSessions() {
      const openEl = document.getElementById("paritaria-sessions-open");
      const closedEl = document.getElementById("paritaria-sessions-closed");
      if (!openEl || !closedEl) return;

      openEl.innerHTML = "";
      closedEl.innerHTML = "";
      const sessions = getParitariaSessions();
      const openSessions = sessions
        .filter(session => session.status !== "closed")
        .sort((a, b) => paritariaSessionSortTime(b) - paritariaSessionSortTime(a));
      const closedSessions = sessions
        .filter(session => session.status === "closed")
        .sort((a, b) => paritariaSessionSortTime(b) - paritariaSessionSortTime(a));

      openSessions.forEach(session => openEl.appendChild(buildParitariaSessionCard(session, false)));

      const grouped = closedSessions.reduce((acc, session) => {
        const year = paritariaSessionYear(session);
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
        block.id = `paritaria-session-year-${safeYear}`;
        const header = document.createElement("button");
        header.type = "button";
        header.className = "session-year-header";
        header.onclick = () => toggleParitariaSessionYear(year);
        header.innerHTML = `<span class="session-year-title">${escapeHtml(year)}</span><span class="session-year-count">${grouped[year].length}</span>`;
        const content = document.createElement("div");
        content.className = "session-year-content";
        grouped[year].forEach(session => content.appendChild(buildParitariaSessionCard(session, true)));
        block.appendChild(header);
        block.appendChild(content);
        closedEl.appendChild(block);
      });

      if (!openSessions.length) openEl.innerHTML = `<p class="muted">No hay sesiones abiertas.</p>`;
      if (!closedSessions.length) closedEl.innerHTML = `<p class="muted">No hay sesiones históricas.</p>`;
      const openCountEl = document.getElementById("count-paritaria-sessions-open");
      const closedCountEl = document.getElementById("count-paritaria-sessions-closed");
      if (openCountEl) openCountEl.textContent = openSessions.length;
      if (closedCountEl) closedCountEl.textContent = closedSessions.length;
      applyParitariaSessionView(getParitariaSessionView());
      updateQuickCounts();
    }

    function openParitariaSessionOrderModal(sessionId) {
      const session = getParitariaSessions().find(s => s.id === sessionId);
      if (!session) return;

      activeParitariaOrderSessionId = sessionId;
      paritariaOrderDraft = Array.isArray(session.items) ? [...session.items] : [];
      draggedParitariaParitariaId = null;

      const titleEl = document.getElementById("paritariaSessionOrderTitle");
      const modal = document.getElementById("paritariaSessionOrderModal");
      if (titleEl) titleEl.textContent = `${session.title || "Sesión de Paritaria"} · ${sessionLabel(session)}`;
      renderParitariaSessionOrderDraft();
      if (modal) modal.classList.add("open");
    }

    function closeParitariaSessionOrderModal() {
      activeParitariaOrderSessionId = null;
      paritariaOrderDraft = [];
      draggedParitariaParitariaId = null;
      const modal = document.getElementById("paritariaSessionOrderModal");
      if (modal) modal.classList.remove("open");
    }

    function renderParitariaSessionOrderDraft() {
      const listEl = document.getElementById("paritariaSessionOrderList");
      if (!listEl) return;

      const paritariaById = Object.fromEntries(getParitariaItems().map(item => [item.id, item]));
      const visibleItems = paritariaOrderDraft.map(raw => ({
        raw,
        key: paritariaSessionItemId(raw),
        title: paritariaSessionItemTitle(raw, paritariaById),
        meta: paritariaSessionItemMeta(raw, paritariaById),
        linked: typeof raw === "string" && !!paritariaById[raw]
      })).filter(item => item.title);

      if (!visibleItems.length) {
        listEl.innerHTML = `<p class="muted">Esta sesión todavía no tiene puntos asignados.</p>`;
        return;
      }

      listEl.innerHTML = visibleItems.map((item, index) => `
        <div class="session-order-row" draggable="true" data-paritaria-id="${escapeHtml(item.key)}"
          ondragstart="handleParitariaOrderDragStart(event, '${escapeHtml(item.key)}')"
          ondragover="handleParitariaOrderDragOver(event)"
          ondrop="handleParitariaOrderDrop(event, '${escapeHtml(item.key)}')"
          ondragend="handleParitariaOrderDragEnd(event)">
          <div class="session-order-number">${index + 1}</div>
          <div>
            <textarea class="session-order-edit" data-order-key="${escapeHtml(item.key)}" ${item.linked ? "readonly title='Los puntos vinculados se editan desde el gestor de puntos'" : ""}>${escapeHtml(item.title || "Sin título")}</textarea>
            <div class="session-item-meta">${escapeHtml(item.meta || "")}${item.linked ? " · Editar texto desde el gestor de puntos" : ""}</div>
          </div>
          <div class="session-order-handle" title="Arrastra para ordenar">☰</div>
        </div>
      `).join("");
    }

    function handleParitariaOrderDragStart(event, paritariaId) {
      draggedParitariaParitariaId = paritariaId;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", paritariaId);
      }
      event.currentTarget.classList.add("dragging");
    }

    function handleParitariaOrderDragOver(event) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    }

    function handleParitariaOrderDrop(event, targetParitariaId) {
      event.preventDefault();
      const sourceId = draggedParitariaParitariaId || (event.dataTransfer ? event.dataTransfer.getData("text/plain") : "");
      if (!sourceId || sourceId === targetParitariaId) return;

      const sourceIndex = paritariaOrderDraft.findIndex(raw => paritariaSessionItemId(raw) === sourceId);
      const targetIndex = paritariaOrderDraft.findIndex(raw => paritariaSessionItemId(raw) === targetParitariaId);
      if (sourceIndex < 0 || targetIndex < 0) return;

      paritariaOrderDraft.splice(sourceIndex, 1);
      paritariaOrderDraft.splice(targetIndex, 0, sourceId);
      renderParitariaSessionOrderDraft();
    }

    function handleParitariaOrderDragEnd(event) {
      event.currentTarget.classList.remove("dragging");
      draggedParitariaParitariaId = null;
    }

    function applyParitariaOrderTextEdits() {
      const listEl = document.getElementById("paritariaSessionOrderList");
      if (!listEl) return;
      const edits = new Map(Array.from(listEl.querySelectorAll("textarea[data-order-key]")).map(textarea => [textarea.getAttribute("data-order-key"), textarea.value.trim()]));
      const paritariaById = Object.fromEntries(getParitariaItems().map(item => [item.id, item]));
      paritariaOrderDraft = paritariaOrderDraft.map(raw => {
        const key = paritariaSessionItemId(raw);
        const text = edits.get(key);
        if (!text) return raw;
        if (typeof raw === "object" && raw) return { ...raw, title: text, text, editedAt: new Date().toISOString() };
        if (typeof raw === "string" && paritariaById[raw]) return raw;
        if (typeof raw === "string") return { id: raw, title: text, source: "Histórico paritaria editado", editedAt: new Date().toISOString() };
        return raw;
      });
    }

    function saveParitariaSessionOrderFromModal() {
      if (!activeParitariaOrderSessionId) return;

      const sessions = getParitariaSessions();
      const session = sessions.find(s => s.id === activeParitariaOrderSessionId);
      if (!session) return;

      applyParitariaOrderTextEdits();
      session.items = [...paritariaOrderDraft];
      setParitariaSessions(sessions);
      syncParitariaSessionOrder(session.id);
      closeParitariaSessionOrderModal();
      renderParitariaSessions();
      renderParitariaItems();
    }

    let paritariaViewFilter = "all";

    function setParitariaViewFilter(filter) {
      paritariaViewFilter = ["all", "paritaria-pending", "paritaria-progress", "paritaria-closed"].includes(filter) ? filter : "all";
      renderParitariaItems();
    }

    function paritariaStatusLabel(status) {
      const labels = {
        "paritaria-pending": "Pendiente",
        "paritaria-progress": "En curso",
        "paritaria-closed": "Cerrado"
      };
      return labels[status] || "Sin estado";
    }

    function paritariaStatusClass(status) {
      const classes = {
        "paritaria-pending": "pending",
        "paritaria-progress": "progress",
        "paritaria-closed": "closed"
      };
      return classes[status] || "pending";
    }

    function lastParitariaUpdate(item) {
      const updates = Array.isArray(item.updates) ? item.updates : [];
      if (!updates.length) return "Sin avances";
      const last = updates[updates.length - 1];
      const date = last.createdAt ? new Date(last.createdAt).toLocaleDateString("es-ES") : "Sin fecha";
      return `${date}: ${last.text || "Actualización sin texto"}`;
    }

    function paritariaMatchesQuery(item, query) {
      if (!query) return true;
      const updates = Array.isArray(item.updates) ? item.updates.map(update => update.text || "").join(" ") : "";
      return itemSearchText([item.title, item.petitioner, item.notes, item.requestDate, paritariaStatusLabel(item.status), item.paritariaSessionCode, item.paritariaSessionDate, updates]).includes(query);
    }

    let paritariaRowClickTimer = null;

    function isParitariaInteractiveTarget(event) {
      return !!(event && event.target && event.target.closest && event.target.closest("button, a, input, select, textarea, label"));
    }

    function getParitariaRowFromEvent(event) {
      return event?.target?.closest?.("tr.rrll-paritaria-row[data-paritaria-id]");
    }

    function toggleParitariaRowDetails(event, id) {
      if (isParitariaInteractiveTarget(event)) return;
      const row = document.getElementById(`rrll-paritaria-${id}`);
      if (row) row.classList.toggle("expanded");
    }

    function handleParitariaRowClick(event, id) {
      if (isParitariaInteractiveTarget(event)) return;
      const row = id ? null : getParitariaRowFromEvent(event);
      const rowId = id || row?.getAttribute("data-paritaria-id");
      if (!rowId) return;
      if (paritariaRowClickTimer) {
        clearTimeout(paritariaRowClickTimer);
        paritariaRowClickTimer = null;
      }
      paritariaRowClickTimer = setTimeout(() => {
        toggleParitariaRowDetails(event, rowId);
        paritariaRowClickTimer = null;
      }, 220);
    }

    function handleParitariaRowDoubleClick(event, id) {
      if (isParitariaInteractiveTarget(event)) return;
      const row = id ? null : getParitariaRowFromEvent(event);
      const rowId = id || row?.getAttribute("data-paritaria-id");
      if (!rowId) return;
      if (paritariaRowClickTimer) {
        clearTimeout(paritariaRowClickTimer);
        paritariaRowClickTimer = null;
      }
      if (event && typeof event.preventDefault === "function") event.preventDefault();
      if (event && typeof event.stopPropagation === "function") event.stopPropagation();
      openParitariaUpdateModal(rowId);
    }

    function ensureParitariaDoubleClickBinding() {
      const tableBody = document.getElementById("paritariaTableBody");
      if (!tableBody) return;
      if (tableBody.dataset.clickBound !== "true") {
        tableBody.dataset.clickBound = "true";
        tableBody.addEventListener("click", handleParitariaRowClick);
      }
      if (tableBody.dataset.dblclickBound !== "true") {
        tableBody.dataset.dblclickBound = "true";
      }
    }

    function renderParitariaRow(item, index) {
      const created = item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-ES") : "Sin fecha";
      const closed = item.closedAt ? new Date(item.closedAt).toLocaleDateString("es-ES") : "";
      const requestDate = item.requestDate ? new Date(item.requestDate + "T00:00:00").toLocaleDateString("es-ES") : "Sin fecha";
      const statusClass = paritariaStatusClass(item.status);
      const sessionInfo = item.paritariaSessionId
        ? `${item.paritariaSessionCode || "sin código"}${item.paritariaSessionDate ? " · " + new Date(item.paritariaSessionDate + "T00:00:00").toLocaleDateString("es-ES") : ""}${item.paritariaSessionOrder ? " · punto " + item.paritariaSessionOrder : ""}`
        : "Sin sesión";
      const notes = item.notes || "Sin notas";
      return `
        <tr id="rrll-paritaria-${item.id}" data-paritaria-id="${escapeHtml(item.id)}" class="rrll-pro-row rrll-paritaria-row status-${statusClass}" title="Clic para desplegar detalle">
          <td class="rrll-pro-main-cell">
            <div class="rrll-pro-title">${index + 1}. ${escapeHtml(item.title || "Sin título")}</div>
            <div class="rrll-pro-subtitle">${escapeHtml(notes)}</div>
            <div class="rrll-pro-created">Creado: ${escapeHtml(created)}${closed ? ` · Cerrado: ${escapeHtml(closed)}` : ""}</div>
          </td>
          <td>${escapeHtml(item.petitioner || "Sin indicar")}</td>
          <td><span class="rrll-status-pill ${statusClass}">${escapeHtml(paritariaStatusLabel(item.status))}</span></td>
          <td>${escapeHtml(requestDate)}</td>
          <td><span class="committee-badge rrll-pro-source">${escapeHtml(sessionInfo)}</span></td>
          <td class="rrll-pro-update">${escapeHtml(lastParitariaUpdate(item))}</td>
          <td class="rrll-pro-actions" onclick="event.stopPropagation()">
            <button class="small secondary" onclick="event.stopPropagation(); openParitariaUpdateModal('${item.id}')">Editar</button>
            ${item.status !== "paritaria-pending" ? `<button class="small secondary" onclick="event.stopPropagation(); moveParitariaItem('${item.id}', 'paritaria-pending')">Pendiente</button>` : ""}
            ${item.status !== "paritaria-progress" ? `<button class="small black" onclick="event.stopPropagation(); moveParitariaItem('${item.id}', 'paritaria-progress')">En curso</button>` : ""}
            ${item.status === "paritaria-progress" ? `<button class="small" onclick="event.stopPropagation(); addParitariaItemToParitariaSession('${item.id}')">Añadir a Paritaria</button>` : ""}
            ${item.status !== "paritaria-closed" ? `<button class="small" onclick="event.stopPropagation(); moveParitariaItem('${item.id}', 'paritaria-closed')">Cerrar</button>` : ""}
            <button class="small danger" onclick="event.stopPropagation(); deleteParitariaItem('${item.id}')">Eliminar</button>
          </td>
        </tr>
      `;
    }

    function renderParitariaItems() {
      const items = getParitariaItems();
      const counts = { "paritaria-pending": 0, "paritaria-progress": 0, "paritaria-closed": 0 };
      items.forEach(item => { counts[item.status] = (counts[item.status] || 0) + 1; });

      const allEl = document.getElementById("count-paritaria-all");
      const pendingEl = document.getElementById("count-paritaria-pending");
      const progressEl = document.getElementById("count-paritaria-progress");
      const closedEl = document.getElementById("count-paritaria-closed");
      if (allEl) allEl.textContent = items.length;
      if (pendingEl) pendingEl.textContent = counts["paritaria-pending"];
      if (progressEl) progressEl.textContent = counts["paritaria-progress"];
      if (closedEl) closedEl.textContent = counts["paritaria-closed"];

      document.querySelectorAll("#gestor-puntos-paritaria .rrll-pro-tabs button").forEach(button => button.classList.remove("active"));
      const activeId = paritariaViewFilter === "all" ? "paritaria-filter-all" : `paritaria-filter-${paritariaViewFilter.replace("paritaria-", "")}`;
      const activeFilter = document.getElementById(activeId);
      if (activeFilter) activeFilter.classList.add("active");

      const query = (document.getElementById("paritariaInlineSearch")?.value || "").trim().toLowerCase();
      const filtered = items
        .filter(item => paritariaViewFilter === "all" || item.status === paritariaViewFilter)
        .filter(item => paritariaMatchesQuery(item, query));

      const statusOrder = { "paritaria-progress": 0, "paritaria-pending": 1, "paritaria-closed": 2 };
      filtered.sort((a, b) => {
        const byStatus = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
        if (paritariaViewFilter === "all" && byStatus) return byStatus;
        const aDate = a.requestDate || "9999-12-31";
        const bDate = b.requestDate || "9999-12-31";
        return aDate.localeCompare(bDate);
      });

      const tableBody = document.getElementById("paritariaTableBody");
      const empty = document.getElementById("paritariaTableEmpty");
      if (tableBody) {
        tableBody.innerHTML = filtered.map(renderParitariaRow).join("");
        ensureParitariaDoubleClickBinding();
      } else {
        ["paritaria-pending", "paritaria-progress", "paritaria-closed"].forEach(status => {
          const el = document.getElementById(status);
          if (el) el.innerHTML = "";
        });
      }
      if (empty) empty.style.display = filtered.length ? "none" : "block";

      updateQuickCounts();
      renderParitariaSessions();
      renderAlertsPanel();
    }


  const api = {
    getParitariaItems,
    setParitariaItems,
    addParitariaItem,
    toggleParitariaCreateForm,
    toggleParitariaSessionCreateForm,
    moveParitariaItem,
    deleteParitariaItem,
    openParitariaUpdateModal,
    closeParitariaUpdateModal,
    saveParitariaUpdateFromModal,
    getParitariaSessions,
    setParitariaSessions,
    getParitariaSessionDisplayItems,
    addParitariaSession,
    sessionLabel,
    openAddParitariaToParitariaModal,
    closeAddParitariaToParitariaModal,
    confirmAddParitariaToParitariaSession,
    addParitariaItemToParitariaSession,
    moveParitariaSessionItem,
    removeParitariaSessionItem,
    syncParitariaSessionOrder,
    closeParitariaSession,
    reopenParitariaSession,
    deleteParitariaSession,
    getParitariaSessionView,
    setParitariaSessionView,
    applyParitariaSessionView,
    toggleParitariaSessionPanel,
    toggleParitariaSessionCard,
    toggleParitariaSessionYear,
    renderParitariaSessions,
    openParitariaSessionOrderModal,
    closeParitariaSessionOrderModal,
    handleParitariaOrderDragStart,
    handleParitariaOrderDragOver,
    handleParitariaOrderDrop,
    handleParitariaOrderDragEnd,
    saveParitariaSessionOrderFromModal,
    renderParitariaItems,
    setParitariaViewFilter,
    toggleParitariaRowDetails,
    handleParitariaRowClick,
    handleParitariaRowDoubleClick,
    ensureParitariaDoubleClickBinding
  };

  window.ParitariaModule = api;

  // Compatibilidad temporal con HTML/app.js mientras se completa Fase 3.
  Object.assign(window, api);
})();
