/**
 * Fase 2.6 - Backup e importación.
 *
 * Extraído desde app.js sin cambiar comportamiento.
 * Mantiene funciones globales para botones inline y llamadas existentes.
 */
(function () {
  const BACKUP_KEYS = [
        "rrll_links",
        "rrll_closed_column_tasks_open",
        "rrll_closed_column_agenda_open",
        "rrll_closed_column_petitions_open",
        "rrll_tasks",
        "rrll_minutes",
        "rrll_agenda_items",
        "rrll_petitions",
        "rrll_telework",
        "rrll_vinculogramas",
        "rrll_licencias_excedencias",
        "rrll_plantilla",
        "rrll_especiales_destinatarios",
        "rrll_trash"
      ];

      function purgeDeprecatedFixedTaskData() {
        const localKeysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (isDeprecatedFixedTaskKey(key)) localKeysToRemove.push(key);
        }
        localKeysToRemove.forEach(key => localStorage.removeItem(key));

        if (window.rrllDB && rrllDatabaseCache) {
          let changed = false;
          Object.keys(rrllDatabaseCache).forEach(key => {
            if (isDeprecatedFixedTaskKey(key)) {
              delete rrllDatabaseCache[key];
              changed = true;
            }
          });
          if (changed) persistDatabaseCache();
        }
      }

      function collectAllBackupKeys() {
        const keys = new Set(BACKUP_KEYS);

        if (window.rrllDB) {
          Object.keys(rrllDatabaseCache || {}).forEach(key => {
            if (isRRLLKey(key) && !isDeprecatedFixedTaskKey(key)) keys.add(key);
          });
          return Array.from(keys);
        }

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (isRRLLKey(key) && !isDeprecatedFixedTaskKey(key)) keys.add(key);
        }

        return Array.from(keys);
      }

      function exportBackup() {
        const keys = collectAllBackupKeys();
        const data = {
          app: "Cuadro de Mando de RRLL",
          version: "1.0",
          exportedAt: new Date().toISOString(),
          values: {}
        };

        keys.forEach(key => {
          if (!isRRLLKey(key) || isDeprecatedFixedTaskKey(key)) return;

          if (window.rrllDB) {
            if (Object.prototype.hasOwnProperty.call(rrllDatabaseCache || {}, key)) {
              data.values[key] = serializeBackupValue(rrllDatabaseCache[key]);
            }
          } else {
            const value = localStorage.getItem(key);
            if (value !== null) data.values[key] = value;
          }
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `copia-cuadro-mando-rrll-${date}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }

      function clearExistingRRLLData() {
        if (window.rrllDB) {
          Object.keys(rrllDatabaseCache || {}).forEach(key => {
            if (isRRLLKey(key)) delete rrllDatabaseCache[key];
          });
          return;
        }

        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (isRRLLKey(key)) keysToRemove.push(key);
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      function applyImportedValues(values) {
        clearExistingRRLLData();

        Object.entries(values).forEach(([key, value]) => {
          if (!isRRLLKey(key) || isDeprecatedFixedTaskKey(key)) return;

          if (window.rrllDB) {
            rrllDatabaseCache[key] = parseBackupValue(value);
          } else {
            localStorage.setItem(key, serializeBackupValue(value));
          }
        });

        if (window.rrllDB) return persistDatabaseCache({ rejectOnError: true });
        return Promise.resolve();
      }

      function renderAfterImport() {
        restoreSidebarLeftState();
        setupGestorAccordions();
        window.renderAllDataViews();
      }

      let pendingImportValues = null;
      let pendingImportMeta = null;

      function safeParseBackupEntry(value, fallback) {
        try {
          return parseBackupValue(value);
        } catch {
          return fallback;
        }
      }

      function countBackupArray(values, key) {
        const parsed = safeParseBackupEntry(values[key], []);
        return Array.isArray(parsed) ? parsed.length : 0;
      }

      function countBackupKeys(values, prefix) {
        return Object.keys(values || {}).filter(key => key.startsWith(prefix)).length;
      }

      function buildImportSummary(values) {
        return [
          ["Tareas", countBackupArray(values, "rrll_tasks")],
          ["Comité", countBackupArray(values, "rrll_agenda_items")],
          ["Sesiones de Comité", countBackupArray(values, "rrll_committee_sessions")],
          ["Actas", countBackupArray(values, "rrll_minutes")],
          ["Peticiones", countBackupArray(values, "rrll_petitions")],
          ["Teletrabajo", countBackupArray(values, "rrll_telework")],
        ["Vinculograma", countBackupArray(values, "rrll_vinculogramas")],
          ["Licencias y excedencias", countBackupArray(values, "rrll_licencias_excedencias")],
          ["Papelera", countBackupArray(values, "rrll_trash")],
          ["Plantilla", countBackupArray(values, "rrll_plantilla")],
          ["Accesos parametrizables", countBackupArray(values, "rrll_links")]
          ,["Destinatarios especiales", countBackupArray(values, "rrll_especiales_destinatarios")]
        ];
      }

      function openImportPreview(values, meta) {
        pendingImportValues = values;
        pendingImportMeta = meta || {};

        const intro = document.getElementById("importPreviewIntro");
        const summary = document.getElementById("importPreviewSummary");
        const modal = document.getElementById("importPreviewModal");
        if (!intro || !summary || !modal) return;

        const exportedAt = pendingImportMeta.exportedAt ? new Date(pendingImportMeta.exportedAt).toLocaleString("es-ES") : "fecha no indicada";
        intro.textContent = `Copia detectada: ${pendingImportMeta.app || "Cuadro de Mando de RRLL"} · ${pendingImportMeta.version || "sin versión"} · ${exportedAt}.`;
        summary.innerHTML = buildImportSummary(values)
          .map(([label, count]) => `<span>${escapeHtml(label)}</span><b>${count}</b>`)
          .join("");
        modal.classList.add("open");
      }

      function closeImportPreview() {
        const modal = document.getElementById("importPreviewModal");
        if (modal) modal.classList.remove("open");
      }

      async function confirmImportBackup() {
        if (!pendingImportValues) return;
        try {
          if (window.rrllDB && typeof window.rrllDB.createBackup === "function") {
            const backupResult = await window.rrllDB.createBackup({ reason: "before_import_destructive", data: window.rrllDatabaseCache || {} });
            if (!backupResult || backupResult.ok !== true) {
              const backupErrorDetail = backupResult && (backupResult.error || backupResult.reason || backupResult.code);
              console.error("Importación RRLL cancelada: no se pudo crear el backup previo:", backupResult);
              alert(`Importación cancelada: no se pudo crear el backup previo. Detalle: ${backupErrorDetail || "error desconocido"}`);
              return;
            }
          }
          try {
            await applyImportedValues(pendingImportValues);
            await window.waitForPendingSaves?.();
          } catch (error) {
            console.error("Error al guardar copia RRLL importada:", error);
            alert(`No se pudo completar la importación porque no se pudieron guardar los datos. Detalle: ${error && error.message ? error.message : "error desconocido"}`);
            return;
          }
          closeImportPreview();
          renderAfterImport();
          pendingImportValues = null;
          pendingImportMeta = null;
          alert("Datos importados correctamente.");
        } catch (error) {
          console.error("Error al aplicar copia RRLL:", error);
          alert(`No se pudo importar el fichero. Detalle: ${error && error.message ? error.message : "error desconocido"}`);
        }
      }

      function importBackup(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            if (!data || !data.values || typeof data.values !== "object" || Array.isArray(data.values)) {
              alert("El fichero no parece ser una copia válida del cuadro de mando.");
              return;
            }

            const rrllEntries = Object.entries(data.values).filter(([key]) => isRRLLKey(key));
            if (!rrllEntries.length) {
              alert("La copia no contiene datos reconocibles del cuadro de mando.");
              return;
            }

            openImportPreview(Object.fromEntries(rrllEntries), {
              app: data.app,
              version: data.version,
              exportedAt: data.exportedAt
            });
          } catch (error) {
            console.error("Error al leer copia RRLL:", error);
            alert(`No se pudo leer el fichero. Detalle: ${error && error.message ? error.message : "error desconocido"}`);
          } finally {
            event.target.value = "";
          }
        };

        reader.onerror = () => {
          alert("No se pudo leer el fichero seleccionado.");
          event.target.value = "";
        };

        reader.readAsText(file);
      }

  window.purgeDeprecatedFixedTaskData = purgeDeprecatedFixedTaskData;
  window.renderAfterImport = renderAfterImport;
  window.collectAllBackupKeys = collectAllBackupKeys;
  window.exportBackup = exportBackup;
  window.clearExistingRRLLData = clearExistingRRLLData;
  window.applyImportedValues = applyImportedValues;
  window.safeParseBackupEntry = safeParseBackupEntry;
  window.countBackupArray = countBackupArray;
  window.countBackupKeys = countBackupKeys;
  window.buildImportSummary = buildImportSummary;
  window.openImportPreview = openImportPreview;
  window.closeImportPreview = closeImportPreview;
  window.confirmImportBackup = confirmImportBackup;
  window.importBackup = importBackup;
})();
