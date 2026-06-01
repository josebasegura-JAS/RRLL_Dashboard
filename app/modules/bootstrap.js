// Arranque, render central y eventos globales.
// Los renderizados se aíslan para que un fallo puntual de un módulo no deje la aplicación completa en blanco.

function rrllSafeCall(label, fn) {
  try {
    if (typeof fn === "function") return fn();
  } catch (error) {
    console.error(`[RRLL] Error en ${label}:`, error);
    if (typeof setSaveStatus === "function") {
      setSaveStatus("error", `Error en ${label}. Revisa consola o recarga la app.`);
    }
  }
  return undefined;
}

    function renderAllDataViews() {
      rrllSafeCall("fecha", () => renderDate());
      rrllSafeCall("dashboard", () => renderHomeDashboard());
      rrllSafeCall("accesos rápidos", () => renderLinks());
      rrllSafeCall("configuración de accesos", () => renderLinkConfig());
      rrllSafeCall("orígenes de peticiones", () => { if (typeof renderPetitionOriginSettings === "function") renderPetitionOriginSettings(); });
      rrllSafeCall("tareas", () => renderTasks());
      rrllSafeCall("sincronización comité-actas", () => syncPastCommitteeSessionsToMinutes());
      rrllSafeCall("actas", () => renderMinutes());
      rrllSafeCall("puntos comité", () => renderAgendaItems());
      rrllSafeCall("puntos paritaria", () => renderParitariaItems());
      rrllSafeCall("sesiones comité", () => renderCommitteeSessions());
      rrllSafeCall("sesiones paritaria", () => renderParitariaSessions());
      rrllSafeCall("peticiones", () => renderPetitions());
      rrllSafeCall("teletrabajo", () => renderTelework());
      rrllSafeCall("vinculograma", () => { if (typeof renderVinculogramas === "function") renderVinculogramas(); });
      rrllSafeCall("licencias", () => { if (typeof renderLicencias === "function") renderLicencias(); });
      rrllSafeCall("plantilla", () => { if (typeof renderPlantilla === "function") renderPlantilla(); });
      rrllSafeCall("criterios RRLL", () => { if (typeof renderCriteria === "function") renderCriteria(); });
      rrllSafeCall("Ticket Restaurante", () => { if (typeof renderTicketRestaurant === "function") renderTicketRestaurant(); });
      rrllSafeCall("sorteos", () => { if (typeof renderSorteos === "function") renderSorteos(); });
      rrllSafeCall("especiales", () => { if (typeof renderEspeciales === "function") renderEspeciales(); });
      rrllSafeCall("papelera", () => renderTrash());
      rrllSafeCall("estado de alertas", () => restoreAlertsPanelState());
      rrllSafeCall("alertas", () => renderAlertsPanel());
      rrllSafeCall("columnas cerradas", () => applyAllClosedColumnStates());
    }

    function waitForDatabaseBridge(timeoutMs = 2500) {
      if (window.rrllDB && typeof window.rrllDB.loadAll === "function") return Promise.resolve(true);
      return new Promise(resolve => {
        const started = Date.now();
        const timer = setInterval(() => {
          if (window.rrllDB && typeof window.rrllDB.loadAll === "function") {
            clearInterval(timer);
            resolve(true);
            return;
          }
          if (Date.now() - started >= timeoutMs) {
            clearInterval(timer);
            resolve(false);
          }
        }, 50);
      });
    }

    async function openConfigModal() {
      const modal = document.getElementById("configModal");
      if (!modal) return;
      modal.classList.add("open");
      if (typeof renderPetitionOriginSettings === "function") renderPetitionOriginSettings();
      if (typeof renderRRLLFolderConfig === "function") await renderRRLLFolderConfig();
      if (typeof renderTicketRestaurantConfig === "function") renderTicketRestaurantConfig();
      await refreshDatabaseInfo();
    }

    function closeConfigModal() {
      const modal = document.getElementById("configModal");
      if (modal) modal.classList.remove("open");
    }



// Los <summary> de gestores ya no actúan como desplegables.
// Se conservan como cabecera visual y se evita el cierre accidental del módulo.
function preventLegacySummaryToggle() {
  document.querySelectorAll('details.module-card > summary, details.committee-subsection > summary, details.paritaria-subsection > summary').forEach(summary => {
    if (summary.dataset.rrllNoToggle === '1') return;
    summary.dataset.rrllNoToggle = '1';
    summary.addEventListener('click', event => {
      const actionable = event.target && event.target.closest && event.target.closest('button, a, input, select, textarea, label');
      if (actionable) return;
      event.preventDefault();
      event.stopPropagation();
      const details = summary.parentElement;
      if (details && details.tagName && details.tagName.toLowerCase() === 'details') details.open = true;
    }, true);
  });
}

function forceActiveDetailsOpen() {
  document.querySelectorAll('details.module-card.phase4-active-module').forEach(d => { d.open = true; });
  document.querySelectorAll('#gestor-comite.phase4-active-module details.committee-subsection[open], #gestor-paritaria.phase4-active-module details.paritaria-subsection[open]').forEach(d => { d.open = true; });
}

async function showStartupDbFallbackAlert() {
  if (!window.rrllDB || typeof window.rrllDB.getStartupAlert !== "function") return;
  const alertInfo = await window.rrllDB.getStartupAlert();
  if (!alertInfo) return;
  const existing = document.getElementById("dbStartupFallbackModal");
  if (existing) existing.remove();
  const modal = document.createElement("div");
  modal.id = "dbStartupFallbackModal";
  modal.className = "modal-backdrop db-startup-modal open";
  modal.innerHTML = `
    <div class="modal-box db-startup-modal-card">
      <h3>Base de datos de red no disponible</h3>
      <p>${escapeHtml(alertInfo.message || "No se ha podido acceder a la base de datos compartida. La aplicación se ha abierto con una copia local temporal. Los cambios podrían no sincronizarse automáticamente. Contacta con Sistemas o espera la recuperación antes de realizar cambios críticos.")}</p>
      <p class="muted">Ruta configurada: ${escapeHtml(alertInfo.configuredPath || "No disponible")}</p>
      <div class="modal-actions db-startup-modal-actions">
        <button type="button" class="warning" id="dbStartupRetryBtn">Reintentar</button>
        <button type="button" class="secondary" id="dbStartupConfigBtn">Ir a configuración</button>
        <button type="button" id="dbStartupContinueBtn">Continuar en local</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById("dbStartupRetryBtn")?.addEventListener("click", async () => {
    if (typeof window.retrySharedDatabaseConnection === "function") await window.retrySharedDatabaseConnection();
    if (typeof refreshDatabaseInfo === "function") await refreshDatabaseInfo();
    modal.remove();
  });
  document.getElementById("dbStartupConfigBtn")?.addEventListener("click", async () => {
    if (typeof openConfigModal === "function") await openConfigModal();
    modal.remove();
  });
  document.getElementById("dbStartupContinueBtn")?.addEventListener("click", () => modal.remove());
}

    async function initializeApp() {
      setupGestorAccordions();
      setupPhase4Navigation();
      preventLegacySummaryToggle();
      await waitForDatabaseBridge();

      if (window.rrllDB && typeof window.rrllDB.loadAll === "function") {
        try {
          rrllDatabaseCache = await window.rrllDB.loadAll();
          const state = await updateSyncStatus("init");
          if (state && state.token) rrllLastKnownDbToken = state.token;
        } catch (error) {
          console.error("No se pudo cargar la base de datos al iniciar:", error);
          markSaveError(error);
        }
      }

      purgeDeprecatedFixedTaskData();
      renderAllDataViews();
      phase4RouteFromHash();
      forceActiveDetailsOpen();
      await refreshDatabaseInfo();
      await showStartupDbFallbackAlert();
      startDatabaseAutoSync();
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        rrllSafeCall("cerrar modal tareas", () => closeTaskUpdateModal());
        rrllSafeCall("cerrar modal comité", () => closeAgendaUpdateModal());
        rrllSafeCall("cerrar vencimiento acta", () => closeMinuteDueDateModal());
        rrllSafeCall("cerrar alegaciones acta", () => closeMinuteAllegationsModal());
        rrllSafeCall("cerrar modal peticiones", () => closePetitionUpdateModal());
        rrllSafeCall("cerrar orden comité", () => closeCommitteeSessionOrderModal());
        rrllSafeCall("cerrar orden paritaria", () => closeParitariaSessionOrderModal());
        rrllSafeCall("cerrar añadir comité", () => closeAddAgendaToCommitteeModal());
        rrllSafeCall("cerrar añadir paritaria", () => closeAddParitariaToParitariaModal());
        rrllSafeCall("cerrar impresión", () => closePrintPreview());
        rrllSafeCall("cerrar configuración", () => closeConfigModal());
        rrllSafeCall("cerrar papelera", () => closeTrashModal());
        rrllSafeCall("cerrar licencias", () => { if (typeof closeLicenciaModal === "function") closeLicenciaModal(); });
        rrllSafeCall("cerrar Ticket Restaurante", () => { if (typeof closeTicketRestaurantPersonForm === "function") closeTicketRestaurantPersonForm(); });
        rrllSafeCall("cerrar criterios RRLL", () => { if (typeof closeCriteriaEditModal === "function") closeCriteriaEditModal(); });
      }
    });

    initializeApp().catch(error => {
      console.error("[RRLL] Error crítico de arranque:", error);
      if (typeof markSaveError === "function") markSaveError(error);
      else alert("No se pudo iniciar la aplicación. Revisa la consola.");
    });

// Exposición explícita para módulos y botones inline del HTML.
window.renderHomeDashboard = window.renderHomeDashboard || (typeof renderHomeDashboard === "function" ? renderHomeDashboard : undefined);
window.openPhase4DashboardTarget = openPhase4DashboardTarget;
window.phase4ShowHome = phase4ShowHome;
window.phase4ShowModule = phase4ShowModule;

window.openConfigModal = openConfigModal;
window.closeConfigModal = closeConfigModal;
window.openTrashModal = openTrashModal;
window.closeTrashModal = closeTrashModal;

window.renderAllDataViews = renderAllDataViews;
window.rrllSafeCall = rrllSafeCall;
