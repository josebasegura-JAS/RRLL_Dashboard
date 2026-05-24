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
      const backupText = backup && backup.createdAt ? `${new Date(backup.createdAt).toLocaleString("es-ES")}${backup.suspicious ? " (sospechoso)" : ""}` : "No configurado";
      phase4SetTexts(["configBackupStatusLabel"], backupText);
      const state = await updateSyncStatus("info");
      phase4SetTexts(["configDbUpdatedByLabel"], state ? "Conectado" : "Error");
    } catch (error) {
      phase4SetTexts(["dbModeLabel", "configDbModeLabel"], "Error");
      phase4SetTexts(["dbPathLabel", "configDbPathLabel"], error && error.message ? error.message : "No se pudo leer la configuración.");
    }
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
      if (state.token && !rrllLastKnownDbToken) rrllLastKnownDbToken = state.token;
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

  function renderRemoteRefreshNotice(state) {
    const el = document.getElementById("dbRemoteRefreshNotice");
    if (!el) return;
    const user = state && state.lastUpdateBy ? state.lastUpdateBy : "otro usuario";
    el.textContent = `Datos actualizados desde base compartida (${user})`;
    el.classList.add("visible");
    clearTimeout(renderRemoteRefreshNotice._timer);
    renderRemoteRefreshNotice._timer = setTimeout(() => el.classList.remove("visible"), 3500);
  }

  async function checkDatabaseUpdatesSilently() {
    if (!window.rrllDB || typeof window.rrllDB.getState !== "function" || typeof window.rrllDB.loadAll !== "function") return;
    if (rrllIsApplyingRemoteRefresh || rrllIsCheckingDatabaseUpdates) return;
    if (document.hidden) return;

    rrllIsCheckingDatabaseUpdates = true;
    try {
      const state = await window.rrllDB.getState();
      const token = state && state.token;
      if (!token) return;

      if (!rrllLastKnownDbToken) {
        rrllLastKnownDbToken = token;
        await updateSyncStatus();
        return;
      }

      if (token !== rrllLastKnownDbToken) {
        rrllIsApplyingRemoteRefresh = true;
        rrllDatabaseCache = await window.rrllDB.loadAll();
        rrllLastKnownDbToken = token;
        renderAfterImport();
        await refreshDatabaseInfo();
        renderRemoteRefreshNotice(state);
        setSaveStatus("synced", `Actualizado desde base compartida: ${formatSyncDate(state.lastUpdate || new Date().toISOString())}`);
      }
    } catch (error) {
      console.error("Error en sincronización automática:", error);
      setSaveStatus("offline", error && error.message ? error.message : "No se pudo comprobar la base de datos compartida.");
    } finally {
      rrllIsApplyingRemoteRefresh = false;
      rrllIsCheckingDatabaseUpdates = false;
    }
  }

  function startDatabaseAutoSync() {
    if (rrllAutoSyncTimer) clearInterval(rrllAutoSyncTimer);
    checkDatabaseUpdatesSilently();
    rrllAutoSyncTimer = setInterval(checkDatabaseUpdatesSilently, 20000);
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
      if (probe.status === "empty") {
        const shouldCreate = confirm("La base compartida parece vacía. ¿Crear base compartida desde datos locales?");
        if (!shouldCreate) return;
      }
      if (probe.status === "missing") {
        const shouldCreate = confirm("No existe base SQLite compartida. ¿Crearla desde datos locales?");
        if (!shouldCreate) return;
      }
      alert(`Base encontrada con ${Number(probe.rrllKeyCount || 0)} claves.`);
      await window.rrllDB.setSharedDirectory(directory, rrllDatabaseCache || {});
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

  window.refreshDatabaseInfo = refreshDatabaseInfo;
  window.updateSyncStatus = updateSyncStatus;
  window.renderRemoteRefreshNotice = renderRemoteRefreshNotice;
  window.checkDatabaseUpdatesSilently = checkDatabaseUpdatesSilently;
  window.startDatabaseAutoSync = startDatabaseAutoSync;
  window.chooseSharedDatabaseFolder = chooseSharedDatabaseFolder;
  window.useLocalDatabaseMode = useLocalDatabaseMode;
  window.reloadDatabaseFromDisk = reloadDatabaseFromDisk;
  window.retrySharedDatabaseConnection = async function retrySharedDatabaseConnection() {
    await refreshDatabaseInfo();
    await updateSyncStatus("manual");
  };
  window.createBackupNow = async function createBackupNow() {
    if (!window.rrllDB || typeof window.rrllDB.createBackup !== "function") return;
    await window.rrllDB.createBackup({ reason: "manual_ui", data: window.rrllDatabaseCache || {} });
    await refreshDatabaseInfo();
    alert("Backup creado correctamente.");
  };
  window.openBackupsFolder = async function openBackupsFolder() {
    if (!window.rrllDB || typeof window.rrllDB.openBackupsFolder !== "function") return;
    const result = await window.rrllDB.openBackupsFolder();
    if (!result || !result.ok) alert("No se pudo abrir la carpeta de backups.");
  };
})();
