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
    let rrllPendingRemoteRefresh = false;
    let rrllAutoSyncTimer = null;
    let rrllIsApplyingRemoteRefresh = false;
    let rrllIsCheckingDatabaseUpdates = false;
    let rrllSaveStatusTimer = null;
    let rrllLastSyncOffline = false;
    let rrllPersistQueue = Promise.resolve();
    const RRLL_EDITING_LOCKS_KEY = "rrll_editing_locks";
    const RRLL_EDITING_LOCK_TTL_MS = 30 * 1000;
    const RRLL_EDITING_LOCK_HEARTBEAT_MS = 10 * 1000;
    let rrllCurrentUserCache = null;
    const rrllEditingHeartbeatTimers = {};

    async function getCurrentWindowsUser() {
      if (rrllCurrentUserCache) return rrllCurrentUserCache;
      try {
        if (window.rrllDB && typeof window.rrllDB.getInfo === "function") {
          const info = await window.rrllDB.getInfo();
          rrllCurrentUserCache = String((info && info.user) || "usuario").trim() || "usuario";
          return rrllCurrentUserCache;
        }
      } catch (error) {
        console.warn("No se pudo resolver usuario Windows actual:", error);
      }
      rrllCurrentUserCache = "usuario";
      return rrllCurrentUserCache;
    }

    function getEditingLocks() {
      const raw = load(RRLL_EDITING_LOCKS_KEY, []);
      return Array.isArray(raw) ? raw : [];
    }

    function setEditingLocks(next) {
      save(RRLL_EDITING_LOCKS_KEY, Array.isArray(next) ? next : []);
    }

    function isExpiredLock(lock) {
      const expiresAt = Date.parse(lock && lock.expiresAt);
      return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
    }

    
    function purgeExpiredEditingLocks() {
      const locks = getEditingLocks();
      const active = locks.filter(lock => {
        const expired = isExpiredLock(lock);
        if (expired) {
          console.info("[RRLL LOCK] lock caducado eliminado:", { module: lock?.module, recordId: lock?.recordId, editingBy: lock?.editingBy, expiresAt: lock?.expiresAt });
        }
        return !expired;
      });
      if (active.length !== locks.length) setEditingLocks(active);
      return active;
    }

    function getActiveEditingLock(moduleName, recordId) {
      const module = String(moduleName || "").trim();
      const id = String(recordId || "").trim();
      if (!module || !id) return null;
      const active = purgeExpiredEditingLocks();
      return active.find(lock => String(lock.module) === module && String(lock.recordId) === id) || null;
    }

    function clearEditingLock(moduleName, recordId) {
      try {
        const module = String(moduleName || "").trim();
        const id = String(recordId || "").trim();
        if (!module || !id) return false;
        const locks = purgeExpiredEditingLocks();
        const next = locks.filter(lock => !(String(lock.module) === module && String(lock.recordId) === id));
        if (next.length !== locks.length) {
          console.info("[RRLL LOCK] lock liberado:", { module, recordId: id });
          setEditingLocks(next);
        }
        return true;
      } catch (error) {
        console.warn("No se pudo liberar lock de edición:", error);
        return false;
      }
    }

    async function acquireEditingLock(moduleName, recordId) {
      const module = String(moduleName || "").trim();
      const id = String(recordId || "").trim();
      if (!module || !id) return { allowed: true, lock: null };

      const currentUser = await getCurrentWindowsUser();
      const locks = purgeExpiredEditingLocks();
      const existingIndex = locks.findIndex(lock => String(lock.module) === module && String(lock.recordId) === id);
      const existing = existingIndex >= 0 ? locks[existingIndex] : null;

      if (existing && String(existing.editingBy || "").toLowerCase() !== currentUser.toLowerCase()) {
        console.info("[RRLL LOCK] edición bloqueada por otro usuario:", { module, recordId: id, requestedBy: currentUser, lockedBy: existing.editingBy, editingAt: existing.editingAt });
        return { allowed: false, lock: existing };
      }

      if (existing && String(existing.editingBy || "").toLowerCase() === currentUser.toLowerCase()) {
        console.info("[RRLL LOCK] edición permitida por ser el mismo usuario:", { module, recordId: id, editingBy: currentUser });
      }

      const now = new Date();
      const nextLock = {
        module,
        recordId: id,
        editingBy: currentUser,
        editingAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + RRLL_EDITING_LOCK_TTL_MS).toISOString()
      };
      const nextLocks = existingIndex >= 0
        ? locks.map((lock, index) => (index === existingIndex ? nextLock : lock))
        : [...locks, nextLock];
      setEditingLocks(nextLocks);
      console.info("[RRLL LOCK] lock adquirido:", { module, recordId: id, editingBy: currentUser, expiresAt: nextLock.expiresAt });
      return { allowed: true, lock: nextLock };
    }

    async function renewEditingLock(moduleName, recordId) {
      const module = String(moduleName || "").trim();
      const id = String(recordId || "").trim();
      if (!module || !id) return { allowed: true, lock: null };
      console.info("[RRLL LOCK] heartbeat enviado:", { module, recordId: id });
      return acquireEditingLock(module, id);
    }

    function clearEditingLockHeartbeat(moduleName, recordId) {
      const key = `${String(moduleName || "").trim()}::${String(recordId || "").trim()}`;
      if (rrllEditingHeartbeatTimers[key]) {
        clearInterval(rrllEditingHeartbeatTimers[key]);
        delete rrllEditingHeartbeatTimers[key];
      }
    }

    function startEditingLockHeartbeat(moduleName, recordId) {
      const module = String(moduleName || "").trim();
      const id = String(recordId || "").trim();
      if (!module || !id) return;
      clearEditingLockHeartbeat(module, id);
      rrllEditingHeartbeatTimers[`${module}::${id}`] = setInterval(async () => {
        try {
          const result = await renewEditingLock(module, id);
          if (result?.lock?.expiresAt) console.info("[RRLL LOCK] lock renovado:", { module, recordId: id, expiresAt: result.lock.expiresAt });
        } catch (error) {
          console.warn("[RRLL LOCK] fallo heartbeat (reintento automático):", { module, recordId: id, error: error?.message || error });
        }
      }, RRLL_EDITING_LOCK_HEARTBEAT_MS);
    }

    function showEditingLockBlockedMessage(lock) {
      if (!lock) return;
      const editingBy = lock.editingBy || "otro usuario";
      const editingDate = Date.parse(lock.editingAt || "");
      const editingAt = Number.isFinite(editingDate)
        ? new Date(editingDate).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "hora no disponible";
      alert(`Este registro está siendo editado por ${editingBy}. Podrás editarlo cuando finalice o en unos segundos si la edición quedó abierta.\n\nUsuario: ${editingBy}\nHora del lock: ${editingAt}\nEl bloqueo caduca automáticamente en 30 segundos.`);
    }

    async function clearEditingLocksForCurrentUser(reason) {
      try {
        const currentUser = await getCurrentWindowsUser();
        const locks = purgeExpiredEditingLocks();
        const next = locks.filter(lock => String(lock.editingBy || "").toLowerCase() !== currentUser.toLowerCase());
        if (next.length !== locks.length) {
          console.info("[RRLL LOCK] liberando locks de sesión:", { reason: reason || "unknown", editingBy: currentUser, released: locks.length - next.length });
          setEditingLocks(next);
        }
      } catch (error) {
        console.warn("No se pudieron liberar locks de sesión:", error);
      }
    }


    function setSaveStatus(status, detail) {
      const widget = document.getElementById("saveStatusWidget");
      const label = document.getElementById("saveStatusLabel");
      const detailEl = document.getElementById("saveStatusDetail");
      if (!widget || !label || !detailEl) return;

      widget.classList.remove("saving", "saved", "synced", "offline", "error");
      widget.classList.add(status || "synced");

      const labels = {
        saving: "OK",
        saved: "OK",
        synced: "OK",
        offline: "Error",
        error: "Error"
      };

      const currentLabel = labels[status] || "OK";
      label.textContent = currentLabel;
      if (currentLabel === "Error") {
        detailEl.textContent = "";
      } else {
        const fallbackDetail = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        detailEl.textContent = compactSidebarSyncDetail(detail || fallbackDetail);
      }
    }

    function compactSidebarSyncDetail(detail) {
      const timeMatch = String(detail || "").match(/\b\d{1,2}:\d{2}:\d{2}\b/);
      return timeMatch ? timeMatch[0] : "";
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

window.acquireEditingLock = acquireEditingLock;
window.renewEditingLock = renewEditingLock;
window.startEditingLockHeartbeat = startEditingLockHeartbeat;
window.clearEditingLockHeartbeat = clearEditingLockHeartbeat;
window.showEditingLockBlockedMessage = showEditingLockBlockedMessage;
window.getCurrentWindowsUser = getCurrentWindowsUser;

window.purgeExpiredEditingLocks = purgeExpiredEditingLocks;
window.getActiveEditingLock = getActiveEditingLock;
window.clearEditingLock = clearEditingLock;
window.clearEditingLocksForCurrentUser = clearEditingLocksForCurrentUser;

window.addEventListener("beforeunload", () => {
  clearEditingLocksForCurrentUser("beforeunload");
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    purgeExpiredEditingLocks();
  }
});
