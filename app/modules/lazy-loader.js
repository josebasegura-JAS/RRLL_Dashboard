// Carga bajo demanda de módulos pesados.
// Mantiene el arranque ligero y carga cada bloque funcional cuando se abre por primera vez.
(function () {
  "use strict";

  const loadedScripts = new Set(Array.from(document.scripts || [])
    .map(script => script.getAttribute("src"))
    .filter(Boolean));
  const loadingScripts = new Map();

  const MODULE_SCRIPTS = Object.freeze({
    "gestor-plantilla": ["modules/plantilla.js"],
    "gestor-teletrabajo": ["modules/plantilla.js", "modules/teletrabajo.js"],
    "gestor-vinculograma": ["modules/plantilla.js", "modules/vinculograma.js"],
    "gestor-licencias": ["modules/plantilla.js", "modules/licencias.js"],
    "gestor-criterios": ["modules/criterios-rrll.js"],
    "gestor-especiales": ["modules/especiales.js"],
    "gestor-sorteos": ["modules/plantilla.js", "modules/sorteos.js"],
    "gestor-ticket-restaurante": [
      "modules/ticket-calendar-domain.js",
      "modules/ticket-calendar-adapter.js",
      "modules/ticket-restaurante.js",
      "modules/ticket-calendar-management.js"
    ],
    "gestor-presupuestos": [
      "modules/ticket-calendar-domain.js",
      "modules/ticket-calendar-adapter.js",
      "modules/ticket-restaurante.js",
      "modules/ticket-calendar-management.js",
      "modules/budget-domain.js",
      "modules/budget.js"
    ]
  });

  const MODULE_RENDERERS = Object.freeze({
    "gestor-plantilla": ["renderPlantilla"],
    "gestor-teletrabajo": ["renderTelework"],
    "gestor-vinculograma": ["renderVinculogramas"],
    "gestor-licencias": ["renderLicencias"],
    "gestor-criterios": ["renderCriteria"],
    "gestor-especiales": ["renderEspeciales"],
    "gestor-sorteos": ["renderSorteos"],
    "gestor-ticket-restaurante": ["ensureTicketRestaurantReady", "renderTicketRestaurant"],
    "gestor-presupuestos": ["initializeBudgetModule"]
  });

  function setModuleLoadingState(moduleId, loading) {
    const panel = document.getElementById(moduleId);
    if (!panel) return;
    panel.classList.toggle("rrll-module-loading", !!loading);
    panel.setAttribute("aria-busy", loading ? "true" : "false");
  }

  function loadScriptOnce(src) {
    if (!src) return Promise.resolve();
    if (loadedScripts.has(src)) return Promise.resolve();
    if (loadingScripts.has(src)) return loadingScripts.get(src);

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = () => {
        loadedScripts.add(src);
        loadingScripts.delete(src);
        resolve();
      };
      script.onerror = () => {
        loadingScripts.delete(src);
        reject(new Error(`No se pudo cargar ${src}`));
      };
      document.body.appendChild(script);
    });

    loadingScripts.set(src, promise);
    return promise;
  }

  async function ensureRRLLModuleLoaded(moduleId) {
    const scripts = MODULE_SCRIPTS[moduleId] || [];
    if (!scripts.length) return true;
    setModuleLoadingState(moduleId, true);
    try {
      for (const src of scripts) await loadScriptOnce(src);
      return true;
    } finally {
      setModuleLoadingState(moduleId, false);
    }
  }

  async function renderRRLLLazyModule(moduleId) {
    const renderers = MODULE_RENDERERS[moduleId] || [];
    for (const fnName of renderers) {
      const fn = window[fnName];
      if (typeof fn !== "function") continue;
      try { await fn(); }
      catch (error) { console.warn(`[RRLL] Error renderizando ${moduleId} con ${fnName}:`, error); }
    }
    if (typeof window.applyAllClosedColumnStates === "function") window.applyAllClosedColumnStates();
  }

  function preloadRRLLModuleWhenIdle(moduleId) {
    const runner = () => ensureRRLLModuleLoaded(moduleId).catch(error => console.warn(`[RRLL] Precarga fallida de ${moduleId}:`, error));
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(runner, { timeout: 4500 });
    else window.setTimeout(runner, 1200);
  }

  window.ensureRRLLModuleLoaded = ensureRRLLModuleLoaded;
  window.renderRRLLLazyModule = renderRRLLLazyModule;
  window.preloadRRLLModuleWhenIdle = preloadRRLLModuleWhenIdle;
  window.RRLL_LAZY_MODULE_SCRIPTS = MODULE_SCRIPTS;
})();
