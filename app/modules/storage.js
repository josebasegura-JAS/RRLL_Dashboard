/**
 * Capa de persistencia y estado de sincronización.
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
    let rrllSidebarStatusRefreshTimer = null;
    let rrllSidebarLastState = {
      info: null,
      backup: null,
      mirror: null,
      save: { status: "saved", updatedAt: null, error: "" }
    };
    let rrllLastSyncOffline = false;
    let rrllPersistQueue = Promise.resolve();
    let rrllPersistFailurePending = false;
    const RRLL_EDITING_LOCKS_KEY = "rrll_editing_locks";
    const RRLL_EDITING_LOCK_TTL_MS = 30 * 1000;
    const RRLL_EDITING_LOCK_HEARTBEAT_MS = 10 * 1000;
    const RRLL_EDITING_LOCK_HEARTBEAT_FAILURE_LIMIT = 3;
    let rrllCurrentUserCache = null;
    const rrllEditingHeartbeatTimers = {};
    const rrllEditingHeartbeatStates = {};

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
      return save(RRLL_EDITING_LOCKS_KEY, Array.isArray(next) ? next : [], { rejectOnError: true });
    }

    async function reloadEditingLocksFromSource() {
      if (window.rrllDB && typeof window.rrllDB.loadAll === "function") {
        const source = await window.rrllDB.loadAll();
        const locks = Array.isArray(source?.[RRLL_EDITING_LOCKS_KEY]) ? source[RRLL_EDITING_LOCKS_KEY] : [];
        rrllDatabaseCache[RRLL_EDITING_LOCKS_KEY] = locks;
        return locks;
      }
      return getEditingLocks();
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
      if (active.length !== locks.length) {
        setEditingLocks(active).catch(error => console.warn("No se pudieron persistir locks caducados:", error));
      }
      return active;
    }

    async function purgeExpiredEditingLocksAsync() {
      const locks = getEditingLocks();
      const active = locks.filter(lock => {
        const expired = isExpiredLock(lock);
        if (expired) {
          console.info("[RRLL LOCK] lock caducado purgado y persistido:", { module: lock?.module, recordId: lock?.recordId, editingBy: lock?.editingBy, expiresAt: lock?.expiresAt });
        }
        return !expired;
      });
      if (active.length !== locks.length) await setEditingLocks(active);
      return active;
    }

    function getActiveEditingLock(moduleName, recordId) {
      const module = String(moduleName || "").trim();
      const id = String(recordId || "").trim();
      if (!module || !id) return null;
      const active = purgeExpiredEditingLocks();
      return active.find(lock => String(lock.module) === module && String(lock.recordId) === id) || null;
    }

    async function clearEditingLock(moduleName, recordId) {
      try {
        const module = String(moduleName || "").trim();
        const id = String(recordId || "").trim();
        if (!module || !id) return false;
        const locks = getEditingLocks();
        const next = locks.filter(lock => !(String(lock.module) === module && String(lock.recordId) === id));
        if (next.length !== locks.length) {
          await setEditingLocks(next);
          console.info("[RRLL LOCK] lock liberado y persistido:", { module, recordId: id });
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
      let locks;
      try {
        await reloadEditingLocksFromSource();
        locks = await purgeExpiredEditingLocksAsync();
      } catch (error) {
        const message = `No se pudo confirmar el lock de edición porque falló la lectura o persistencia: ${error?.message || error}`;
        console.warn("[RRLL LOCK] adquisición cancelada durante la lectura o purga:", { module, recordId: id, error: error?.message || error });
        return { allowed: false, lock: { message }, message };
      }
      const existingIndex = locks.findIndex(lock => String(lock.module) === module && String(lock.recordId) === id);
      const existing = existingIndex >= 0 ? locks[existingIndex] : null;

      if (existing && String(existing.editingBy || "").toLowerCase() !== currentUser.toLowerCase()) {
        console.info("[RRLL LOCK] edición bloqueada por otro usuario:", { module, recordId: id, requestedBy: currentUser, lockedBy: existing.editingBy, editingAt: existing.editingAt, expiresAt: existing.expiresAt });
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
      try {
        await setEditingLocks(nextLocks);
        const confirmedLocks = await reloadEditingLocksFromSource();
        const confirmed = confirmedLocks.find(lock => String(lock.module) === module && String(lock.recordId) === id) || null;
        if (confirmed && String(confirmed.editingBy || "").toLowerCase() === currentUser.toLowerCase()) {
          console.info("[RRLL LOCK] lock adquirido y confirmado:", { module, recordId: id, editingBy: currentUser, expiresAt: confirmed.expiresAt });
          return { allowed: true, lock: confirmed };
        }

        const message = confirmed
          ? `No se pudo confirmar el lock de edición: otro usuario (${confirmed.editingBy || "desconocido"}) adquirió el registro antes de completar la confirmación.`
          : "No se pudo confirmar el lock de edición después de persistirlo. La edición se ha bloqueado por seguridad.";
        console.warn("[RRLL LOCK] adquisición no confirmada:", { module, recordId: id, requestedBy: currentUser, confirmedLock: confirmed });
        return { allowed: false, lock: confirmed || { message }, message };
      } catch (error) {
        const message = `No se pudo persistir o confirmar el lock de edición: ${error?.message || error}`;
        console.warn("[RRLL LOCK] adquisición cancelada por error de persistencia:", { module, recordId: id, error: error?.message || error });
        return { allowed: false, lock: { message }, message };
      }
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
      delete rrllEditingHeartbeatStates[key];
    }

    function registerEditingLockHeartbeatFailure(module, id, detail) {
      const key = `${module}::${id}`;
      const state = rrllEditingHeartbeatStates[key] || { confirmed: true, failures: 0, warned: false, message: "" };
      state.failures += 1;
      state.message = `No se ha podido renovar el lock de edición (${state.failures}/${RRLL_EDITING_LOCK_HEARTBEAT_FAILURE_LIMIT}). ${detail || ""}`.trim();
      if (state.failures >= RRLL_EDITING_LOCK_HEARTBEAT_FAILURE_LIMIT) {
        state.confirmed = false;
        state.message = "El lock de edición ya no está confirmado porque su renovación ha fallado repetidamente. Guarda o copia tus cambios y vuelve a abrir el registro antes de continuar editando.";
        if (!state.warned) {
          state.warned = true;
          alert(state.message);
        }
      }
      rrllEditingHeartbeatStates[key] = state;
      console.warn("[RRLL LOCK] fallo heartbeat (reintento automático):", { module, recordId: id, failures: state.failures, confirmed: state.confirmed, detail });
      return state;
    }

    function startEditingLockHeartbeat(moduleName, recordId) {
      const module = String(moduleName || "").trim();
      const id = String(recordId || "").trim();
      if (!module || !id) return;
      clearEditingLockHeartbeat(module, id);
      const key = `${module}::${id}`;
      rrllEditingHeartbeatStates[key] = { confirmed: true, failures: 0, warned: false, message: "" };
      rrllEditingHeartbeatTimers[key] = setInterval(async () => {
        try {
          const result = await renewEditingLock(module, id);
          if (result?.allowed === false) {
            registerEditingLockHeartbeatFailure(module, id, result.message || "La renovación no se pudo confirmar.");
            return;
          }
          rrllEditingHeartbeatStates[key] = { confirmed: true, failures: 0, warned: false, message: "" };
          if (result?.lock?.expiresAt) console.info("[RRLL LOCK] lock renovado:", { module, recordId: id, expiresAt: result.lock.expiresAt });
        } catch (error) {
          registerEditingLockHeartbeatFailure(module, id, error?.message || String(error));
        }
      }, RRLL_EDITING_LOCK_HEARTBEAT_MS);
    }

    function showEditingLockBlockedMessage(lock) {
      if (!lock) return;
      if (lock.message) {
        alert(lock.message);
        return;
      }
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
        const locks = await purgeExpiredEditingLocksAsync();
        const next = locks.filter(lock => String(lock.editingBy || "").toLowerCase() !== currentUser.toLowerCase());
        if (next.length !== locks.length) {
          const released = locks.length - next.length;
          await setEditingLocks(next);
          console.info("[RRLL LOCK] limpieza de locks del usuario persistida:", { reason: reason || "unknown", editingBy: currentUser, released });
        }
        await window.waitForPendingSaves?.();
      } catch (error) {
        console.warn("No se pudieron liberar locks de sesión:", error);
      }
    }


    function formatSidebarTime(value) {
      const date = value ? new Date(value) : null;
      if (!date || Number.isNaN(date.getTime())) return "--:--";
      return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    }

    function getSidebarModeLabel(info) {
      if (info && info.mode === "shared" && info.fallbackLocal) return "BBDD local temporal";
      if (info && info.mode === "shared") return "BBDD red";
      return "BBDD local";
    }

    function getSidebarStatusLabel(save, backup, mirror) {
      if (save && save.status === "saving") return "Guardando...";
      if (save && save.status === "error") return "Error al guardar";
      if (mirror && mirror.mirrorError) return "Espejo local no actualizado";
      if (backup && backup.error) return "Error de backup";
      if (backup && backup.warning) return "Backup local creado; copia de red pendiente";
      if (backup && backup.dirtySinceLastBackup) return "Cambios pendientes de backup";
      return "Guardado";
    }

    function getSidebarVariant(info, save, backup, mirror) {
      if (info && info.fallbackLocal) return "pending";
      if (save && save.status === "error") return "error";
      if (save && save.status === "saving") return "saving";
      if (mirror && mirror.mirrorError) return "pending";
      if (backup && (backup.error || backup.warning)) return "pending";
      if (backup && backup.dirtySinceLastBackup) return "pending";
      if (info && info.mode === "shared" && !info.fallbackLocal) return "saved";
      return "local";
    }

    function renderSidebarDatabaseStatus() {
      const widget = document.getElementById("saveStatusWidget");
      const label = document.getElementById("saveStatusLabel");
      const connectionEl = document.getElementById("dbConnectionDetail");
      const saveEl = document.getElementById("saveStatusDetail");
      const backupEl = document.getElementById("backupStatusDetail");
      const mirrorEl = document.getElementById("mirrorStatusDetail");
      if (!widget || !label || !saveEl) return;

      const info = rrllSidebarLastState.info || {};
      const backup = rrllSidebarLastState.backup || {};
      const mirror = rrllSidebarLastState.mirror || {};
      const save = rrllSidebarLastState.save || { status: "saved", updatedAt: null, error: "" };
      const modeLabel = getSidebarModeLabel(info);
      const statusLabel = getSidebarStatusLabel(save, backup, mirror);
      const variant = getSidebarVariant(info, save, backup, mirror);

      widget.classList.remove("saving", "saved", "synced", "offline", "error", "local", "pending");
      widget.classList.add(variant);
      if (variant === "saved" || variant === "local") widget.classList.add("synced");
      if (info && info.fallbackLocal) {
        widget.title = "La BBDD compartida no está accesible. Se usa una copia local temporal. Los cambios podrían no sincronizarse automáticamente. Contacta con Sistemas o espera la recuperación antes de realizar cambios críticos.";
        label.textContent = "⚠ BBDD compartida no accesible";
        if (connectionEl) connectionEl.textContent = "Usando copia local temporal.";
        saveEl.textContent = "Los cambios podrían no sincronizarse automáticamente.";
        if (backupEl) backupEl.textContent = "Evita cambios críticos hasta recuperar la red.";
        if (mirrorEl) mirrorEl.textContent = "Contacta con Sistemas o espera la recuperación.";
        return;
      }

      widget.title = save.status === "error" && save.error
        ? save.error
        : (mirror && mirror.mirrorError ? mirror.mirrorError : (backup && (backup.error || backup.warning) ? (backup.error || `${backup.warning}${backup.networkError ? ` ${backup.networkError}` : ""}`) : `${modeLabel} · ${statusLabel}`));

      label.textContent = `${modeLabel} · ${statusLabel}`;
      if (connectionEl) connectionEl.textContent = "";
      saveEl.textContent = save.status === "error" && save.error
        ? "Error al guardar"
        : `Último guardado: ${formatSidebarTime(save.updatedAt)}`;
      if (backupEl) backupEl.textContent = backup && backup.error
        ? "Backup no creado"
        : (backup && backup.warning ? backup.warning : `Último backup: ${formatSidebarTime(backup.lastBackupAt || backup.createdAt)}`);
      if (mirrorEl) {
        if (mirror && mirror.mirrorError) {
          mirrorEl.textContent = "Espejo local no actualizado";
        } else if (mirror && (mirror.lastMirrorAt || mirror.updatedAt)) {
          mirrorEl.textContent = `Espejo local actualizado: ${formatSidebarTime(mirror.lastMirrorAt || mirror.updatedAt)}`;
        } else if (mirror && mirror.exists) {
          mirrorEl.textContent = "Espejo local disponible";
        } else {
          mirrorEl.textContent = "Espejo local: --:--";
        }
      }
    }

    async function refreshSidebarDatabaseStatus(options = {}) {
      if (window.rrllDB) {
        try {
          const [info, backup, mirror, save] = await Promise.all([
            typeof window.rrllDB.getInfo === "function" ? window.rrllDB.getInfo() : null,
            typeof window.rrllDB.getBackupStatus === "function" ? window.rrllDB.getBackupStatus() : null,
            typeof window.rrllDB.getMirrorStatus === "function" ? window.rrllDB.getMirrorStatus() : null,
            typeof window.rrllDB.getLastSaveStatus === "function" ? window.rrllDB.getLastSaveStatus() : null
          ]);
          if (info) rrllSidebarLastState.info = info;
          if (backup) rrllSidebarLastState.backup = backup;
          if (mirror) rrllSidebarLastState.mirror = mirror;
          if (save && !(options.preserveLocalSaving && rrllSidebarLastState.save.status === "saving")) {
            rrllSidebarLastState.save = save;
          }
        } catch (error) {
          rrllSidebarLastState.save = { status: "error", updatedAt: rrllSidebarLastState.save?.updatedAt || null, error: error && error.message ? error.message : "No se pudo consultar el estado de BBDD." };
        }
      }
      renderSidebarDatabaseStatus();
    }

    function scheduleSidebarStatusRefresh(delay = 0, options = {}) {
      clearTimeout(rrllSidebarStatusRefreshTimer);
      rrllSidebarStatusRefreshTimer = setTimeout(() => {
        refreshSidebarDatabaseStatus(options).catch(error => console.warn("No se pudo refrescar estado BBDD sidebar:", error));
      }, delay);
    }

    function setSaveStatus(status, detail, options = {}) {
      const normalizedStatus = status === "offline" ? "error" : (status || "saved");
      const now = new Date().toISOString();
      if (rrllPersistFailurePending && !options.recoverPersistFailure && !options.persistFailure) {
        renderSidebarDatabaseStatus();
        return;
      }
      if (normalizedStatus === "saving") {
        rrllSidebarLastState.save = { status: "saving", updatedAt: rrllSidebarLastState.save?.updatedAt || null, error: "" };
      } else if (normalizedStatus === "error") {
        rrllSidebarLastState.save = { status: "error", updatedAt: rrllSidebarLastState.save?.updatedAt || null, error: detail || "No se pudo guardar o sincronizar." };
      } else {
        rrllSidebarLastState.save = { status: "saved", updatedAt: now, error: "" };
      }
      renderSidebarDatabaseStatus();
      if (window.rrllDB && normalizedStatus !== "saving") scheduleSidebarStatusRefresh(250);
    }

    function markSaveStarted() {
      setSaveStatus("saving", "Escribiendo cambios en la base de datos");
    }

    async function markSaveFinished() {
      const state = await updateSyncStatus("save");
      if (state && state.token) rrllLastKnownDbToken = state.token;
      rrllPersistFailurePending = false;
      setSaveStatus("saved", `Último guardado: ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`, { recoverPersistFailure: true });
      scheduleSidebarStatusRefresh(0);
      clearTimeout(rrllSaveStatusTimer);
    }

    function markSaveError(error) {
      console.error("Error de guardado/sincronización:", error);
      setSaveStatus("error", error && error.message ? error.message : "No se pudo guardar o sincronizar.", { persistFailure: true });
      rrllPersistFailurePending = true;
    }

    function enqueueDatabasePersist(operation) {
      rrllPersistQueue = rrllPersistQueue.catch(() => {}).then(operation);
      return rrllPersistQueue;
    }

    function persistDatabaseCache({ rejectOnError = false } = {}) {
      if (!window.rrllDB || typeof window.rrllDB.saveAll !== "function") return;
      markSaveStarted();
      return enqueueDatabasePersist(() => window.rrllDB.saveAll(rrllDatabaseCache))
        .then(markSaveFinished)
        .catch(error => {
          markSaveError(error);
          if (rejectOnError) throw error;
        });
    }

    function persistDatabaseKey(key, value, { rejectOnError = false } = {}) {
      if (!window.rrllDB || typeof window.rrllDB.saveKey !== "function") {
        return persistDatabaseCache({ rejectOnError });
      }
      markSaveStarted();
      return enqueueDatabasePersist(() => window.rrllDB.saveKey(key, value))
        .then(markSaveFinished)
        .catch(error => {
          markSaveError(error);
          if (rejectOnError) throw error;
        });
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

function save(key, value, { rejectOnError = false } = {}) {
  if (window.rrllDB) {
    rrllDatabaseCache[key] = value;
    return persistDatabaseKey(key, value, { rejectOnError });
  }

  try {
    markSaveStarted();
    localStorage.setItem(key, JSON.stringify(value));
    rrllPersistFailurePending = false;
    setSaveStatus("saved", `Guardado local: ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`, { recoverPersistFailure: true });
  } catch (error) {
    markSaveError(error);
    if (rejectOnError) return Promise.reject(error);
  }

  return Promise.resolve();
}

window.refreshSidebarDatabaseStatus = refreshSidebarDatabaseStatus;
window.renderSidebarDatabaseStatus = renderSidebarDatabaseStatus;

window.waitForPendingSaves = async function () {
  try {
    await rrllPersistQueue.catch(() => {});
  } catch (error) {
    console.warn("Error esperando cola de persistencia:", error);
  }
};



function clearAllEditingLockHeartbeats() {
  Object.keys(rrllEditingHeartbeatTimers).forEach(key => {
    clearInterval(rrllEditingHeartbeatTimers[key]);
    delete rrllEditingHeartbeatTimers[key];
    delete rrllEditingHeartbeatStates[key];
    console.info("[RRLL LOCK] heartbeat detenido:", { key });
  });
  console.info("[RRLL LOCK] todos los heartbeats detenidos");
}

function hasAnyOpenModal() {
  return !!document.querySelector('.modal.open, [role="dialog"].open, .overlay.open');
}

window.resetEditingSessionState = async function (reason) {
  try {
    clearAllEditingLockHeartbeats();
    await clearEditingLocksForCurrentUser(reason || "manual");
    await purgeExpiredEditingLocksAsync();
    await window.waitForPendingSaves?.();
    const stateKeys = [
      "activeTaskUpdateId", "activePetitionUpdateId", "activeAgendaUpdateId", "activeParitariaUpdateId",
      "activeActaUpdateId", "activeVinculogramaUpdateId", "activeLicenciaUpdateId", "activePlantillaUpdateId", "activeCriterioUpdateId"
    ];
    stateKeys.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(window, key)) window[key] = null;
    });
    if (!hasAnyOpenModal()) await window.runPendingRemoteRefreshIfNeeded?.();
    console.info("[RRLL LOCK] sesión de edición reseteada", { reason: reason || "manual" });
    return true;
  } catch (error) {
    console.warn("[RRLL LOCK] fallo al resetear sesión de edición:", error);
    return false;
  }
};

window.acquireEditingLock = acquireEditingLock;
window.renewEditingLock = renewEditingLock;
window.startEditingLockHeartbeat = startEditingLockHeartbeat;
window.clearEditingLockHeartbeat = clearEditingLockHeartbeat;
window.showEditingLockBlockedMessage = showEditingLockBlockedMessage;
window.getCurrentWindowsUser = getCurrentWindowsUser;

window.purgeExpiredEditingLocks = purgeExpiredEditingLocks;
window.purgeExpiredEditingLocksAsync = purgeExpiredEditingLocksAsync;
window.getActiveEditingLock = getActiveEditingLock;
window.clearEditingLock = clearEditingLock;
window.clearEditingLocksForCurrentUser = clearEditingLocksForCurrentUser;
window.clearAllEditingLockHeartbeats = clearAllEditingLockHeartbeats;
window.getEditingLockHeartbeatState = (moduleName, recordId) => rrllEditingHeartbeatStates[`${String(moduleName || "").trim()}::${String(recordId || "").trim()}`] || null;

window.addEventListener("beforeunload", () => {
  clearAllEditingLockHeartbeats();
  purgeExpiredEditingLocks();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    purgeExpiredEditingLocksAsync().catch(error => console.warn("No se pudieron purgar locks caducados al recuperar foco:", error));
  }
});
