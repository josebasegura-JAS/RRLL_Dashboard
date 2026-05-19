/**
 * Capa de persistencia y estado de sincronización.
 * Extraído en Fase 2 sin cambiar comportamiento funcional.
 */

function getTodayKey() {
      return new Date().toISOString().slice(0, 10);
    }

    function getMonthKey() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    let rrllDatabaseCache = {};
    let rrllLastKnownDbToken = null;
    let rrllAutoSyncTimer = null;
    let rrllIsApplyingRemoteRefresh = false;
    let rrllIsCheckingDatabaseUpdates = false;
    let rrllSaveStatusTimer = null;
    let rrllPersistQueue = Promise.resolve();


    function setSaveStatus(status, detail) {
      const widget = document.getElementById("saveStatusWidget");
      const label = document.getElementById("saveStatusLabel");
      const detailEl = document.getElementById("saveStatusDetail");
      if (!widget || !label || !detailEl) return;

      widget.classList.remove("saving", "saved", "synced", "offline", "error");
      widget.classList.add(status || "synced");

      const labels = {
        saving: "Espera",
        saved: "Sinc. OK",
        synced: "Sinc. OK",
        offline: "Sinc. ERR",
        error: "Sinc. ERR"
      };

      label.textContent = labels[status] || "Sinc. OK";
      const fallbackDetail = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      detailEl.textContent = compactSidebarSyncDetail(detail || fallbackDetail);
    }

    function compactSidebarSyncDetail(detail) {
      const timeMatch = String(detail || "").match(/\b\d{1,2}:\d{2}:\d{2}\b/);
      return timeMatch ? timeMatch[0] : new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }

    function markSaveStarted() {
      setSaveStatus("saving", "Escribiendo cambios en la base de datos");
    }

    async function markSaveFinished() {
      const state = await updateSyncStatus("save");
      if (state && state.token) rrllLastKnownDbToken = state.token;
      setSaveStatus("saved", `Último guardado: ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`);
      clearTimeout(rrllSaveStatusTimer);
      rrllSaveStatusTimer = setTimeout(() => {
        setSaveStatus("synced", `Sincronizado: ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`);
      }, 1600);
    }

    function markSaveError(error) {
      console.error("Error de guardado/sincronización:", error);
      setSaveStatus("error", error && error.message ? error.message : "No se pudo guardar o sincronizar.");
    }

    function enqueueDatabasePersist(operation) {
      rrllPersistQueue = rrllPersistQueue.catch(() => {}).then(operation);
      return rrllPersistQueue;
    }

    function persistDatabaseCache() {
      if (!window.rrllDB || typeof window.rrllDB.saveAll !== "function") return;
      markSaveStarted();
      enqueueDatabasePersist(() => window.rrllDB.saveAll(rrllDatabaseCache)
        .then(() => {
          if (window.rrllDB && typeof window.rrllDB.backupAll === "function") {
            return window.rrllDB.backupAll(rrllDatabaseCache);
          }
          return null;
        }))
        .then(markSaveFinished)
        .catch(markSaveError);
    }

    function persistDatabaseKey(key, value) {
      if (!window.rrllDB || typeof window.rrllDB.saveKey !== "function") {
        persistDatabaseCache();
        return;
      }
      markSaveStarted();
      enqueueDatabasePersist(() => window.rrllDB.saveKey(key, value)
        .then(() => {
          if (window.rrllDB && typeof window.rrllDB.backupAll === "function") {
            return window.rrllDB.backupAll(rrllDatabaseCache);
          }
          return null;
        }))
        .then(markSaveFinished)
        .catch(markSaveError);
    }

    function load(key, fallback) {
      try {
        if (window.rrllDB && rrllDatabaseCache && Object.prototype.hasOwnProperty.call(rrllDatabaseCache, key)) {
          return rrllDatabaseCache[key];
        }

        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch {
        return fallback;
      }
    }

function save(key, value) {
  if (window.rrllDB) {
    rrllDatabaseCache[key] = value;
    persistDatabaseKey(key, value);
  } else {
    try {
      markSaveStarted();
      localStorage.setItem(key, JSON.stringify(value));
      setSaveStatus("saved", `Guardado local: ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`);
    } catch (error) {
      markSaveError(error);
    }
  }
}

    function attachmentNameFromPath(pathValue) {
      const parts = String(pathValue || "").split(/[/\\]/);
      return parts[parts.length - 1] || String(pathValue || "");
    }

    async function openAttachment(pathValue) {
      const result = await window.rrllAttachments?.openPath?.(pathValue);
      if (!result || !result.ok) alert("El archivo ya no existe o no es accesible.");
    }

    async function openAttachmentFolder(pathValue) {
      const result = await window.rrllAttachments?.openFolder?.(pathValue);
      if (!result || !result.ok) alert("El archivo ya no existe o no es accesible.");
    }

    function removeAttachmentReference(moduleName, index) {
      const key = moduleName === "task" ? "__taskDraftAttachments" : "__petitionDraftAttachments";
      const list = Array.isArray(window[key]) ? [...window[key]] : [];
      list.splice(index, 1);
      window[key] = list;
      if (moduleName === "task") window.renderTaskAttachments?.();
      else window.renderPetitionAttachments?.();
    }

    async function selectTaskAttachmentFiles() {
      const selected = await window.rrllAttachments?.selectFiles?.() || [];
      const current = Array.isArray(window.__taskDraftAttachments) ? [...window.__taskDraftAttachments] : [];
      selected.forEach(pathValue => {
        const normalized = String(pathValue || "").trim();
        if (!normalized || current.some(item => item.path === normalized)) return;
        current.push({ name: attachmentNameFromPath(normalized), path: normalized, type: "file", addedAt: new Date().toISOString() });
      });
      window.__taskDraftAttachments = current;
      window.renderTaskAttachments?.();
    }

    async function selectPetitionAttachmentFiles() {
      const selected = await window.rrllAttachments?.selectFiles?.() || [];
      const current = Array.isArray(window.__petitionDraftAttachments) ? [...window.__petitionDraftAttachments] : [];
      selected.forEach(pathValue => {
        const normalized = String(pathValue || "").trim();
        if (!normalized || current.some(item => item.path === normalized)) return;
        current.push({ name: attachmentNameFromPath(normalized), path: normalized, type: "file", addedAt: new Date().toISOString() });
      });
      window.__petitionDraftAttachments = current;
      window.renderPetitionAttachments?.();
    }

    function renderAttachments(targetId, list, moduleName) {
      const container = document.getElementById(targetId);
      if (!container) return;
      const items = Array.isArray(list) ? list : [];
      container.innerHTML = items.length
        ? items.map((item, index) => `<div class="rrll-attachment-item" ondblclick="openAttachment('${escapeHtml(item.path || "")}')"><span>📄 ${escapeHtml(item.name || "Documento")}</span><small>${escapeHtml(item.path || "")}</small><div><button class="small secondary" onclick="openAttachment('${escapeHtml(item.path || "")}')">Abrir</button><button class="small secondary" onclick="openAttachmentFolder('${escapeHtml(item.path || "")}')">Carpeta</button><button class="small danger" onclick="removeAttachmentReference('${moduleName}', ${index})">Quitar</button></div></div>`).join("")
        : `<div class="muted">Sin adjuntos.</div>`;
    }

    function renderTaskAttachments(targetId = "newTaskAttachmentsList", source) {
      const items = Array.isArray(source) ? source : (Array.isArray(window.__taskDraftAttachments) ? window.__taskDraftAttachments : []);
      const effectiveTarget = document.getElementById("taskUpdateModal")?.classList.contains("open") && !source ? "taskAttachmentsList" : targetId;
      renderAttachments(effectiveTarget, items, "task");
    }

    function renderPetitionAttachments(targetId = "newPetitionAttachmentsList", source) {
      const items = Array.isArray(source) ? source : (Array.isArray(window.__petitionDraftAttachments) ? window.__petitionDraftAttachments : []);
      const effectiveTarget = document.getElementById("petitionUpdateModal")?.classList.contains("open") && !source ? "petitionAttachmentsList" : targetId;
      renderAttachments(effectiveTarget, items, "petition");
    }

    window.openAttachment = openAttachment;
    window.openAttachmentFolder = openAttachmentFolder;
    window.removeAttachmentReference = removeAttachmentReference;
    window.selectTaskAttachmentFiles = selectTaskAttachmentFiles;
    window.selectPetitionAttachmentFiles = selectPetitionAttachmentFiles;
    window.renderTaskAttachments = renderTaskAttachments;
    window.renderPetitionAttachments = renderPetitionAttachments;
