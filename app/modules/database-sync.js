// Fase 2.7: sincronización y configuración de base de datos.
// Mantiene las mismas funciones globales para no romper llamadas inline ni app.js.
(function () {
  async function refreshDatabaseInfo() {
    if (!window.rrllDB || typeof window.rrllDB.getInfo !== "function") {
      phase4SetTexts(["dbModeLabel", "configDbModeLabel"], "LocalStorage del navegador");
      phase4SetTexts(["dbPathLabel", "configDbPathLabel"], "Sin SQLite disponible");
      phase4SetTexts(["dbUserLabel", "configDbUserLabel"], "Usuario no disponible");
      phase4SetTexts(["dbSyncLabel", "configDbSyncLabel"], "No disponible");
      phase4SetTexts(["dbUpdatedByLabel", "configDbUpdatedByLabel"], "Sin datos");
      return;
    }

    try {
      const info = await window.rrllDB.getInfo();
      const modeText = info.mode === "shared"
        ? (info.fallbackLocal ? "Compartida no disponible · Local temporal" : "Compartida conectada")
        : "Local";
      phase4SetTexts(["dbModeLabel", "configDbModeLabel"], modeText);
      phase4SetTexts(["dbPathLabel", "configDbPathLabel"], info.path || "Ruta no disponible");
      phase4SetTexts(["dbUserLabel", "configDbUserLabel"], info.user || "Usuario Windows no disponible");
      if (info.fallbackLocal && info.configuredSharedPath) {
        phase4SetTexts(["dbPathLabel", "configDbPathLabel"], `${info.path} (red configurada: ${info.configuredSharedPath})`);
      }
      const backup = await (window.rrllDB.getBackupStatus ? window.rrllDB.getBackupStatus() : null);
      const backupText = backup && backup.error
        ? `Error: ${backup.error}`
        : (backup && backup.warning
          ? `${backup.warning}${backup.networkError ? ` Detalle: ${backup.networkError}` : ""}`
          : (backup && (backup.lastBackupAt || backup.createdAt) ? `${new Date(backup.lastBackupAt || backup.createdAt).toLocaleString("es-ES")}${backup.suspicious ? " (sospechoso)" : ""}${backup.dirtySinceLastBackup ? " · cambios pendientes" : ""}` : "No configurado"));
      phase4SetTexts(["configBackupStatusLabel"], backupText);
      const mirror = await (window.rrllDB.getMirrorStatus ? window.rrllDB.getMirrorStatus() : null);
      const mirrorDate = mirror && (mirror.lastMirrorAt || mirror.updatedAt) ? new Date(mirror.lastMirrorAt || mirror.updatedAt).toLocaleString("es-ES") : "";
      const mirrorText = mirror && mirror.mirrorError
        ? "No actualizado"
        : (mirrorDate ? `${mirrorDate}${mirror.exists ? "" : " · fichero no encontrado"}` : (mirror && mirror.exists ? "Disponible" : "No creado"));
      phase4SetTexts(["configMirrorStatusLabel"], mirrorText);
      renderMirrorDetails(mirror);
      if (typeof window.refreshSidebarDatabaseStatus === "function") await window.refreshSidebarDatabaseStatus();
      const state = await updateSyncStatus("info");
      phase4SetTexts(["configDbUpdatedByLabel"], state ? "Conectado" : "Error");
    } catch (error) {
      phase4SetTexts(["dbModeLabel", "configDbModeLabel"], "Error");
      phase4SetTexts(["dbPathLabel", "configDbPathLabel"], error && error.message ? error.message : "No se pudo leer la configuración.");
    }
  }


  function formatMirrorSize(sizeBytes) {
    const size = Number(sizeBytes || 0);
    if (!Number.isFinite(size) || size <= 0) return "No disponible";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function formatMirrorDate(value) {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleString("es-ES") : "Sin actualizaciones";
  }

  function renderMirrorDetails(mirror) {
    const status = mirror || {};
    const existsText = status.exists ? "Sí" : "No";
    const errorText = status.mirrorError ? status.mirrorError : "Sin errores";
    const okText = status.mirrorError ? "Error" : (status.exists && status.mirrorOk ? "OK" : (status.exists ? "Pendiente de validar" : "No disponible"));
    phase4SetTexts(["configMirrorExistsLabel"], existsText);
    phase4SetTexts(["configMirrorUpdatedLabel"], formatMirrorDate(status.lastMirrorAt || status.updatedAt));
    phase4SetTexts(["configMirrorPathLabel"], status.mirrorPath || "Ruta no disponible");
    phase4SetTexts(["configMirrorSourcePathLabel"], status.sourcePath || "Sin origen registrado");
    phase4SetTexts(["configMirrorSizeLabel"], formatMirrorSize(status.sizeBytes));
    phase4SetTexts(["configMirrorOkLabel"], `${okText}${status.mirrorError ? ` · ${errorText}` : ""}`);
  }

  async function updateSyncStatus(source) {
    if (!window.rrllDB || typeof window.rrllDB.getState !== "function") {
      phase4SetTexts(["dbSyncLabel", "configDbSyncLabel"], "No disponible");
      return null;
    }

    try {
      const state = await window.rrllDB.getState();
      phase4SetTexts(["dbSyncLabel", "configDbSyncLabel"], `${formatSyncDate(state.lastUpdate)}${source ? "" : ""}`);
      phase4SetTexts(["dbUpdatedByLabel", "configDbUpdatedByLabel"], state.lastUpdateBy || "Sin datos");
      if (source !== "save") {
        setSaveStatus("synced", `Sincronizado: ${formatSyncDate(state.lastUpdate || new Date().toISOString())}`);
      }
      return state;
    } catch (error) {
      phase4SetTexts(["dbSyncLabel", "configDbSyncLabel"], "Error de sincronización");
      setSaveStatus("offline", error && error.message ? error.message : "No se pudo consultar la base de datos.");
      return null;
    }
  }

  function renderDatabaseNotice(message, duration = 3500) {
    const el = document.getElementById("dbRemoteRefreshNotice");
    if (!el) return;
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(renderDatabaseNotice._timer);
    renderDatabaseNotice._timer = setTimeout(() => el.classList.remove("visible"), duration);
  }

  function renderRemoteRefreshNotice(state) {
    const user = state && state.lastUpdateBy ? state.lastUpdateBy : "otro usuario";
    renderDatabaseNotice(`Datos actualizados desde base compartida (${user})`);
  }

  async function applyReconnectedSharedRefresh(state) {
    rrllIsApplyingRemoteRefresh = true;
    const scrollSnapshots = preserveScrollPositions();
    rrllDatabaseCache = await window.rrllDB.loadAll();
    rrllLastKnownDbToken = state && state.token ? state.token : null;
    rrllPendingRemoteRefresh = false;
    renderAfterImport();
    restoreScrollPositions(scrollSnapshots);
    await refreshDatabaseInfo();
    renderDatabaseNotice("Conexión recuperada: se ha refrescado la BBDD compartida. Los cambios realizados en la copia local temporal no se reconcilian automáticamente.", 9000);
    console.info("[RRLL SYNC] Reconexión correcta: caché refrescada desde base compartida sin reconciliación automática.");
    setSaveStatus("synced", "Reconectado y refrescado desde la base compartida.");
  }



  function isSharedModeState(info) {
    return !!(info && info.mode === "shared" && !info.fallbackLocal);
  }

  function hasActiveEditingContext() {
    const modalSelectors = [
      "#taskUpdateModal.open",
      "#petitionUpdateModal.open",
      "#agendaUpdateModal.open",
      "#minuteDueDateModal.open",
      "#minuteAllegationsModal.open",
      "#committeeSessionOrderModal.open",
      "#paritariaSessionOrderModal.open",
      "#addAgendaToCommitteeModal.open",
      "#addParitariaToParitariaModal.open",
      "#paritariaUpdateModal.open",
      "#minuteEditModal.open",
      "#vinculogramaEditModal.open",
      "#licenseUpdateModal.open",
      "#ticketRestaurantPersonFormModal.open",
      "#criteriaEditModal.open",
      "#plantillaEditModal.open"
    ];
    return modalSelectors.some(selector => document.querySelector(selector));
  }

  function preserveScrollPositions() {
    const targets = [window, document.scrollingElement, document.getElementById("appContent")].filter(Boolean);
    return targets.map(target => ({
      target,
      top: target === window ? window.scrollY : target.scrollTop,
      left: target === window ? window.scrollX : target.scrollLeft
    }));
  }

  function restoreScrollPositions(snapshots) {
    (snapshots || []).forEach(snapshot => {
      if (!snapshot || !snapshot.target) return;
      if (snapshot.target === window) {
        window.scrollTo(snapshot.left || 0, snapshot.top || 0);
      } else {
        snapshot.target.scrollTop = snapshot.top || 0;
        snapshot.target.scrollLeft = snapshot.left || 0;
      }
    });
  }

  async function applyRemoteRefresh(state, options = {}) {
    const token = state && state.token;
    if (!token) return false;

    rrllIsApplyingRemoteRefresh = true;
    const scrollSnapshots = preserveScrollPositions();
    rrllDatabaseCache = await window.rrllDB.loadAll();
    rrllLastKnownDbToken = token;
    rrllPendingRemoteRefresh = false;
    renderAfterImport();
    restoreScrollPositions(scrollSnapshots);
    await refreshDatabaseInfo();
    renderRemoteRefreshNotice(state);
    console.info("[RRLL SYNC] token aplicado tras loadAll", { token });
    if (options.pendingSource) {
      console.info("[RRLL SYNC] Refresh pendiente ejecutado al cerrar modal.");
    } else {
      console.info("[RRLL SYNC] Refresh ejecutado correctamente.");
    }
    setSaveStatus("synced", `Actualizado desde base compartida: ${formatSyncDate(state.lastUpdate || new Date().toISOString())}`);
    return true;
  }

  async function runPendingRemoteRefreshIfNeeded() {
    if (!rrllPendingRemoteRefresh) return false;
    if (!window.rrllDB || typeof window.rrllDB.getState !== "function" || typeof window.rrllDB.loadAll !== "function") return false;
    if (rrllIsApplyingRemoteRefresh || rrllIsCheckingDatabaseUpdates) return false;
    if (document.hidden) return false;
    if (hasActiveEditingContext()) return false;

    rrllIsCheckingDatabaseUpdates = true;
    try {
      const state = await window.rrllDB.getState();
      const token = state && state.token;
      if (!token) {
        rrllPendingRemoteRefresh = false;
        return false;
      }
      if (rrllLastKnownDbToken && token === rrllLastKnownDbToken) {
        rrllPendingRemoteRefresh = false;
        return false;
      }
      return await applyRemoteRefresh(state, { pendingSource: true });
    } catch (error) {
      console.warn("[RRLL SYNC] Error al ejecutar refresh pendiente:", error);
      return false;
    } finally {
      rrllIsApplyingRemoteRefresh = false;
      rrllIsCheckingDatabaseUpdates = false;
    }
  }

  async function checkDatabaseUpdatesSilently() {
    if (!window.rrllDB || typeof window.rrllDB.getState !== "function" || typeof window.rrllDB.loadAll !== "function") return;
    if (rrllIsApplyingRemoteRefresh || rrllIsCheckingDatabaseUpdates) return;
    if (document.hidden) return;

    rrllIsCheckingDatabaseUpdates = true;
    try {
      const info = typeof window.rrllDB.getInfo === "function" ? await window.rrllDB.getInfo() : null;
      if (!isSharedModeState(info)) {
        console.info("[RRLL SYNC] Sincronización omitida: modo local o fallback local activo.");
        rrllLastSyncOffline = !!(info && info.fallbackLocal);
        return;
      }

      const state = await window.rrllDB.getState();
      if (rrllLastSyncOffline) {
        rrllLastSyncOffline = false;
        await applyReconnectedSharedRefresh(state);
        return;
      }

      const token = state && state.token;
      if (!token) return;

      if (!rrllLastKnownDbToken) {
        rrllLastKnownDbToken = token;
        await updateSyncStatus();
        return;
      }

      if (token !== rrllLastKnownDbToken) {
        console.info("[RRLL SYNC] token remoto detectado", { tokenAnterior: rrllLastKnownDbToken, tokenActual: token });
        if (hasActiveEditingContext()) {
          rrllPendingRemoteRefresh = true;
          console.info("[RRLL SYNC] token no aplicado por edición activa");
          setSaveStatus("synced", "Cambios detectados. Refresco pospuesto por edición activa.");
          await refreshDatabaseInfo();
          return;
        }

        await applyRemoteRefresh(state);
      }
    } catch (error) {
      if (!rrllLastSyncOffline) {
        rrllLastSyncOffline = true;
        console.warn("[RRLL SYNC] Conexión perdida con base compartida.", error);
      }
      setSaveStatus("offline", error && error.message ? error.message : "Conexión con base compartida no disponible. Modo local temporal.");
    } finally {
      rrllIsApplyingRemoteRefresh = false;
      rrllIsCheckingDatabaseUpdates = false;
    }
  }

  function startDatabaseAutoSync() {
    if (rrllAutoSyncTimer) clearInterval(rrllAutoSyncTimer);
    console.info("[RRLL SYNC] Sincronización automática iniciada (intervalo: 12s).");
    checkDatabaseUpdatesSilently();
    if (typeof window.refreshSidebarDatabaseStatus === "function") window.refreshSidebarDatabaseStatus();
    rrllAutoSyncTimer = setInterval(() => {
      checkDatabaseUpdatesSilently();
      if (typeof window.refreshSidebarDatabaseStatus === "function") window.refreshSidebarDatabaseStatus();
    }, 12000);
    if (!startDatabaseAutoSync._listenersAttached) {
      window.addEventListener("focus", () => { checkDatabaseUpdatesSilently(); });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkDatabaseUpdatesSilently();
      });
      window.addEventListener("hashchange", () => { checkDatabaseUpdatesSilently(); });
      startDatabaseAutoSync._listenersAttached = true;
    }
  }

  async function chooseSharedDatabaseFolder() {
    if (!window.rrllDB || typeof window.rrllDB.chooseSharedDirectory !== "function") {
      alert("Esta función solo está disponible en la aplicación de escritorio.");
      return;
    }

    try {
      const directory = await window.rrllDB.chooseSharedDirectory();
      if (!directory) return;

      const probe = await window.rrllDB.probeSharedDirectory?.(directory);
      if (!probe) throw new Error("No se pudo validar la carpeta compartida.");
      let options = {};
      if (probe.status === "empty") {
        const shouldCreate = confirm("La base compartida está vacía. ¿Inicializarla desde los datos locales actuales? Se creará backup automático.");
        if (!shouldCreate) return;
      }
      if (probe.status === "missing") {
        const shouldCreate = confirm("No existe base SQLite compartida. ¿Crear base compartida desde datos locales actuales? Se creará backup automático.");
        if (!shouldCreate) return;
      }
      if (probe.status === "valid") {
        const localCount = Object.keys(rrllDatabaseCache || {}).filter(key => String(key || "").startsWith("rrll_")).length;
        const sharedCount = Number(probe.rrllKeyCount || 0);
        if (sharedCount < localCount) {
          const proceedWithLowerCount = confirm(`La base de red existente tiene menos claves RRLL (${sharedCount}) que la base actual (${localCount}). ¿Conectar igualmente a esa base existente?`);
          if (!proceedWithLowerCount) return;
          options.allowExistingLowerCount = true;
        }
      }
      alert(`Base detectada con ${Number(probe.rrllKeyCount || 0)} claves RRLL.`);
      await window.rrllDB.setSharedDirectory(directory, rrllDatabaseCache || {}, options);
      rrllDatabaseCache = await window.rrllDB.loadAll();
      const state = await updateSyncStatus("mode-change");
      if (state && state.token) rrllLastKnownDbToken = state.token;
      renderAfterImport();
      await refreshDatabaseInfo();
      alert("Conectado a base compartida");
    } catch (error) {
      console.error("Error al activar base compartida:", error);
      alert(`No se ha cambiado la configuración por seguridad. ${error && error.message ? error.message : "error desconocido"}`);
    }
  }

  async function useLocalDatabaseMode() {
    if (!window.rrllDB || typeof window.rrllDB.useLocalDatabase !== "function") {
      alert("Esta función solo está disponible en la aplicación de escritorio.");
      return;
    }

    try {
      const confirmed = confirm("Se volverá a usar la base SQLite local de este equipo y se copiarán los datos que ves ahora. ¿Continuar?");
      if (!confirmed) return;

      await window.rrllDB.useLocalDatabase(rrllDatabaseCache || {});
      rrllDatabaseCache = await window.rrllDB.loadAll();
      const state = await updateSyncStatus("mode-change");
      if (state && state.token) rrllLastKnownDbToken = state.token;
      renderAfterImport();
      await refreshDatabaseInfo();
      alert("Modo local activado correctamente.");
    } catch (error) {
      console.error("Error al activar base local:", error);
      alert(`No se pudo activar la base local. Detalle: ${error && error.message ? error.message : "error desconocido"}`);
    }
  }

  async function reloadDatabaseFromDisk() {
    if (!window.rrllDB || typeof window.rrllDB.loadAll !== "function") return;
    try {
      rrllDatabaseCache = await window.rrllDB.loadAll();
      const state = await updateSyncStatus("manual");
      if (state && state.token) rrllLastKnownDbToken = state.token;
      renderAfterImport();
      await refreshDatabaseInfo();
      alert("Datos recargados desde la base de datos.");
    } catch (error) {
      console.error("Error al recargar base:", error);
      alert(`No se pudo recargar la base. Detalle: ${error && error.message ? error.message : "error desconocido"}`);
    }
  }


  async function openLocalMirrorFolder() {
    if (!window.rrllDB || typeof window.rrllDB.openMirrorFolder !== "function") {
      alert("Esta función solo está disponible en la aplicación de escritorio.");
      return;
    }
    const result = await window.rrllDB.openMirrorFolder();
    if (!result || !result.ok) alert("No se pudo abrir la carpeta del espejo local.");
  }

  async function updateLocalMirrorNow() {
    if (!window.rrllDB || typeof window.rrllDB.getInfo !== "function" || typeof window.rrllDB.updateLocalMirror !== "function") {
      alert("Esta función solo está disponible en la aplicación de escritorio.");
      return;
    }

    try {
      const info = await window.rrllDB.getInfo();
      if (!isSharedModeState(info)) {
        alert("Para actualizar el espejo ahora, la BBDD compartida debe estar activa y accesible. La app está en modo local o en local temporal.");
        await refreshDatabaseInfo();
        return;
      }

      const result = await window.rrllDB.updateLocalMirror();
      await refreshDatabaseInfo();
      if (!result || !result.ok) {
        const detail = result && (result.error || result.mirrorError || result.skipped) ? (result.error || result.mirrorError || result.skipped) : "motivo no disponible";
        alert(`No se pudo actualizar el espejo local: ${detail}`);
        return;
      }
      alert("Espejo local actualizado correctamente.");
    } catch (error) {
      console.error("Error al actualizar espejo local:", error);
      alert(`No se pudo actualizar el espejo local. Detalle: ${error && error.message ? error.message : "error desconocido"}`);
    }
  }

  async function useMirrorAsLocalDatabaseMode() {
    if (!window.rrllDB || typeof window.rrllDB.useMirrorAsLocalDatabase !== "function") {
      alert("Esta función solo está disponible en la aplicación de escritorio.");
      return;
    }

    const warning = "Esto no sincroniza cambios con la BBDD compartida. Solo usará la última copia espejo como BBDD local.";
    const confirmed = confirm(`${warning}

Se creará un backup previo de la BBDD local actual y después se sustituirá por el espejo. ¿Continuar?`);
    if (!confirmed) return;

    try {
      const result = await window.rrllDB.useMirrorAsLocalDatabase();
      await refreshDatabaseInfo();
      alert(`Modo local activado usando el espejo. La aplicación se recargará ahora.${result && result.backupPath ? `

Backup previo: ${result.backupPath}` : ""}`);
      window.location.reload();
    } catch (error) {
      console.error("Error al usar espejo como BBDD local:", error);
      alert(`No se ha tocado la BBDD local. No se pudo usar el espejo como BBDD local: ${error && error.message ? error.message : "error desconocido"}`);
      await refreshDatabaseInfo();
    }
  }

  window.refreshDatabaseInfo = refreshDatabaseInfo;
  window.updateSyncStatus = updateSyncStatus;
  window.renderRemoteRefreshNotice = renderRemoteRefreshNotice;
  window.checkDatabaseUpdatesSilently = checkDatabaseUpdatesSilently;
  window.startDatabaseAutoSync = startDatabaseAutoSync;
  window.runPendingRemoteRefreshIfNeeded = runPendingRemoteRefreshIfNeeded;
  window.chooseSharedDatabaseFolder = chooseSharedDatabaseFolder;
  window.useLocalDatabaseMode = useLocalDatabaseMode;
  window.reloadDatabaseFromDisk = reloadDatabaseFromDisk;
  window.openLocalMirrorFolder = openLocalMirrorFolder;
  window.updateLocalMirrorNow = updateLocalMirrorNow;
  window.useMirrorAsLocalDatabaseMode = useMirrorAsLocalDatabaseMode;
  window.retrySharedDatabaseConnection = async function retrySharedDatabaseConnection() {
    if (!window.rrllDB || typeof window.rrllDB.getInfo !== "function" || typeof window.rrllDB.setSharedDirectory !== "function") {
      await refreshDatabaseInfo();
      await updateSyncStatus("manual");
      return;
    }

    const info = await window.rrllDB.getInfo();
    if (info && info.mode === "shared" && info.configuredSharedPath) {
      try {
        const sharedDir = info.sharedDir || (info.configuredSharedPath.includes('\\') || info.configuredSharedPath.includes('/') ? info.configuredSharedPath.replace(/[\/][^\/]+$/, "") : "");
        if (sharedDir) {
          await window.rrllDB.setSharedDirectory(sharedDir, rrllDatabaseCache || {}, { allowExistingLowerCount: true });
        }
      } catch (error) {
        console.warn("No se pudo reconectar automáticamente a la base de red configurada:", error);
      }
    }

    await refreshDatabaseInfo();
    await updateSyncStatus("manual");
  };
  window.createBackupNow = async function createBackupNow() {
    if (!window.rrllDB || typeof window.rrllDB.createBackup !== "function") return;
    const result = await window.rrllDB.createBackup({ reason: "manual_ui", data: window.rrllDatabaseCache || {} });
    if (typeof window.refreshSidebarDatabaseStatus === "function") await window.refreshSidebarDatabaseStatus();
    await refreshDatabaseInfo();
    if (!result || !result.ok) {
      const detail = result && (result.error || result.skipped) ? (result.error || result.skipped) : "motivo no disponible";
      console.warn("No se pudo crear el backup manual:", detail);
      alert(`No se pudo crear el backup: ${detail}`);
      return;
    }
    if (result.warning) {
      alert(`${result.warning}${result.networkError ? ` Detalle: ${result.networkError}` : ""}`);
      return;
    }
    alert("Backup creado correctamente.");
  };
  window.openBackupsFolder = async function openBackupsFolder() {
    if (!window.rrllDB || typeof window.rrllDB.openBackupsFolder !== "function") return;
    const result = await window.rrllDB.openBackupsFolder();
    if (!result || !result.ok) alert("No se pudo abrir la carpeta de backups.");
  };
})();
