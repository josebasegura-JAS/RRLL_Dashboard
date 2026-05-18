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
