// Fase 2.8: navegación extraída desde app.js sin cambiar comportamiento.
// Mantiene funciones globales para compatibilidad con HTML inline y otros módulos.

function toggleSidebarLeft() {
      const layout = document.getElementById("dashboardLayout");
      const toggle = document.getElementById("sidebarToggle");
      if (!layout) return;
      const collapsed = !layout.classList.contains("sidebar-collapsed");
      layout.classList.toggle("sidebar-collapsed", collapsed);
      try { localStorage.setItem("rrll_sidebar_collapsed", collapsed ? "1" : "0"); } catch {}
      if (toggle) toggle.innerHTML = collapsed ? '<span class="sidebar-toggle-symbol">›</span> Panel lateral' : '<span class="sidebar-toggle-symbol">‹</span> Panel lateral';
    }

    function restoreSidebarLeftState() {
      let collapsed = false;
      try { collapsed = localStorage.getItem("rrll_sidebar_collapsed") === "1"; } catch {}
      const layout = document.getElementById("dashboardLayout");
      const toggle = document.getElementById("sidebarToggle");
      if (!layout) return;
      layout.classList.toggle("sidebar-collapsed", collapsed);
      if (toggle) toggle.innerHTML = collapsed ? '<span class="sidebar-toggle-symbol">›</span> Panel lateral' : '<span class="sidebar-toggle-symbol">‹</span> Panel lateral';
    }

    function toggleQuickCommitteeMenu(event) {
      if (event) { event.preventDefault(); event.stopPropagation(); }
      const group = document.getElementById("quickCommitteeGroup");
      if (group) group.classList.toggle("open");
    }

    function closeQuickCommitteeMenu() {
      const group = document.getElementById("quickCommitteeGroup");
      if (group) group.classList.remove("open");
    }

    function toggleQuickParitariaMenu(event) {
      event.preventDefault();
      event.stopPropagation();
      const group = document.getElementById("quickParitariaGroup");
      if (group) group.classList.toggle("open");
      closeQuickCommitteeMenu();
    }

    function closeQuickParitariaMenu() {
      const group = document.getElementById("quickParitariaGroup");
      if (group) group.classList.remove("open");
    }


    const RRLL_MAIN_GESTOR_IDS = ["gestor-tareas", "gestor-peticiones", "gestor-comite", "gestor-paritaria", "gestor-actas", "gestor-teletrabajo", "gestor-vinculograma", "gestor-licencias", "gestor-plantilla"];
    const RRLL_PHASE4_SUBVIEW_MAP = {
      "gestor-puntos-comite": { parent: "gestor-comite", section: "gestor-puntos-comite", menu: "comite" },
      "gestor-sesiones-comite": { parent: "gestor-comite", section: "gestor-sesiones-comite", menu: "comite" },
      "gestor-puntos-paritaria": { parent: "gestor-paritaria", section: "gestor-puntos-paritaria", menu: "paritaria" },
      "gestor-sesiones-paritaria": { parent: "gestor-paritaria", section: "gestor-sesiones-paritaria", menu: "paritaria" }
    };
    let rrllAccordionsReady = false;
    let rrllPhase4NavigationReady = false;
    let rrllPhase4CurrentView = null;
    let rrllPhase4ViewTimer = null;
    let rrllVisibilityGuardReady = false;

    function rrllGetMainModulePanels() {
      return RRLL_MAIN_GESTOR_IDS
        .map(id => document.getElementById(id))
        .filter(Boolean);
    }

    function rrllNormalizeModulePanels() {
      rrllGetMainModulePanels().forEach(panel => {
        panel.dataset.rrllModulePanel = "1";
      });
    }

    function rrllCurrentActiveModule() {
      const fromDataset = document.body && document.body.dataset ? document.body.dataset.activeModule : "";
      if (fromDataset && RRLL_MAIN_GESTOR_IDS.includes(fromDataset)) return fromDataset;
      if (rrllPhase4CurrentView && RRLL_PHASE4_SUBVIEW_MAP[rrllPhase4CurrentView]) return RRLL_PHASE4_SUBVIEW_MAP[rrllPhase4CurrentView].parent;
      if (rrllPhase4CurrentView && RRLL_MAIN_GESTOR_IDS.includes(rrllPhase4CurrentView)) return rrllPhase4CurrentView;
      return "home";
    }

    function rrllEnsureSingleVisibleModule() {
      const activeId = rrllCurrentActiveModule();
      const isHome = !activeId || activeId === "home";
      rrllNormalizeModulePanels();
      rrllGetMainModulePanels().forEach(panel => {
        const isActive = !isHome && panel.id === activeId;
        panel.dataset.rrllActive = isActive ? "true" : "false";
        panel.classList.toggle("phase4-active-module", isActive);
        panel.classList.toggle("phase4-inactive-module", !isActive);
        panel.hidden = !isActive;
        panel.setAttribute("aria-hidden", isActive ? "false" : "true");
        if (isActive) {
          panel.style.setProperty("display", "block", "important");
          panel.style.setProperty("visibility", "visible", "important");
          panel.style.removeProperty("height");
          panel.style.removeProperty("max-height");
          panel.style.removeProperty("min-height");
          panel.style.removeProperty("margin");
          panel.style.removeProperty("padding");
          panel.style.removeProperty("border");
          panel.style.removeProperty("overflow");
          panel.style.removeProperty("pointer-events");
          if (isDetailsElement(panel)) panel.open = true;
        } else {
          if (isDetailsElement(panel)) panel.open = false;
          panel.style.setProperty("display", "none", "important");
          panel.style.setProperty("visibility", "hidden", "important");
          panel.style.setProperty("height", "0", "important");
          panel.style.setProperty("max-height", "0", "important");
          panel.style.setProperty("min-height", "0", "important");
          panel.style.setProperty("margin", "0", "important");
          panel.style.setProperty("padding", "0", "important");
          panel.style.setProperty("border", "0", "important");
          panel.style.setProperty("overflow", "hidden", "important");
          panel.style.setProperty("pointer-events", "none", "important");
        }
      });
    }

    function rrllSetupVisibilityGuard() {
      if (rrllVisibilityGuardReady) return;
      rrllVisibilityGuardReady = true;
      const rerun = () => {
        if (document.body.classList.contains("phase4-view-module") || document.body.dataset.activeModule) rrllEnsureSingleVisibleModule();
      };
      window.addEventListener("scroll", rerun, { passive: true });
      window.addEventListener("resize", rerun, { passive: true });
      document.addEventListener("click", () => setTimeout(rerun, 0), true);
    }

    function phase4PersistView(viewId) {
      try { localStorage.setItem("rrll_phase4_last_view", viewId || "home"); } catch {}
    }

    function phase4ReadPersistedView() {
      try { return localStorage.getItem("rrll_phase4_last_view") || "home"; } catch { return "home"; }
    }

    function phase4StartViewTransition() {
      document.body.classList.add("phase4-transitioning");
      if (rrllPhase4ViewTimer) clearTimeout(rrllPhase4ViewTimer);
      rrllPhase4ViewTimer = setTimeout(() => document.body.classList.remove("phase4-transitioning"), 140);
    }

    function isDetailsElement(element) {
      return element && element.tagName && element.tagName.toLowerCase() === "details";
    }

    function closeOtherMainGestors(openGestor) {
      RRLL_MAIN_GESTOR_IDS.forEach(id => {
        const gestor = document.getElementById(id);
        if (gestor && gestor !== openGestor && isDetailsElement(gestor)) gestor.open = false;
      });
    }

    function setPhase4SideSubmenu(menuName, open) {
      const submenu = document.getElementById(`phase4-submenu-${menuName}`);
      const parent = document.querySelector(`.phase4-nav-parent[data-menu="${menuName}"]`);
      if (submenu) submenu.classList.toggle("open", !!open);
      if (parent) parent.classList.toggle("open", !!open);
    }

    function togglePhase4SideSubmenu(menuName) {
      const submenu = document.getElementById(`phase4-submenu-${menuName}`);
      const nextOpen = !(submenu && submenu.classList.contains("open"));
      setPhase4SideSubmenu(menuName, nextOpen);
    }

    function phase4OpenSubview(subviewId) {
      const cfg = RRLL_PHASE4_SUBVIEW_MAP[subviewId];
      if (!cfg) return false;
      if (cfg.parent === "gestor-comite") openCommitteeSubsection(cfg.section);
      else if (cfg.parent === "gestor-paritaria") openParitariaSubsection(cfg.section);
      else openMainGestor(cfg.parent);
      rrllPhase4CurrentView = subviewId;
      phase4PersistView(subviewId);
      setPhase4SideSubmenu(cfg.menu, true);
      phase4SetActiveNav(subviewId);
      return true;
    }

    function phase4SetActiveNav(viewId) {
      const subview = RRLL_PHASE4_SUBVIEW_MAP[viewId];
      const effectiveMain = subview ? subview.parent : viewId;
      document.querySelectorAll(".phase4-nav-item").forEach(item => {
        const href = item.getAttribute("href") || "";
        const dataView = item.getAttribute("data-view") || "";
        const menu = item.getAttribute("data-menu") || "";
        const isParentActive = subview && menu === subview.menu;
        item.classList.toggle("active", dataView === viewId || href === `#${viewId}` || href === `#${effectiveMain}` || !!isParentActive);
      });
      document.querySelectorAll(".phase4-nav-subitem").forEach(item => {
        const href = item.getAttribute("href") || "";
        item.classList.toggle("active", href === `#${viewId}`);
      });
      setPhase4SideSubmenu("comite", effectiveMain === "gestor-comite");
      setPhase4SideSubmenu("paritaria", effectiveMain === "gestor-paritaria");
    }


    function rrllApplyModuleVisibility(activeId) {
      const isHome = !activeId || activeId === "home";
      document.body.dataset.activeModule = isHome ? "home" : activeId;
      document.body.classList.toggle("phase4-view-home", isHome);
      document.body.classList.toggle("phase4-view-module", !isHome);
      rrllNormalizeModulePanels();
      rrllEnsureSingleVisibleModule();
    }

    function phase4ShowHome() {
      if (rrllPhase4CurrentView === "home" && document.body.classList.contains("phase4-view-home")) return;
      phase4StartViewTransition();
      rrllPhase4CurrentView = "home";
      phase4PersistView("home");
      document.body.classList.add("phase4-view-home");
      document.body.classList.remove("phase4-view-module");
      rrllApplyModuleVisibility("home");
      phase4SetActiveNav("home");
      if (typeof renderHomeDashboard === "function") renderHomeDashboard();
    }

    function phase4ShowModule(gestorId) {
      const gestor = document.getElementById(gestorId);
      if (!isDetailsElement(gestor)) {
        phase4ShowHome();
        return false;
      }
      if (rrllPhase4CurrentView !== gestorId || !gestor.classList.contains("phase4-active-module")) phase4StartViewTransition();
      rrllPhase4CurrentView = gestorId;
      phase4PersistView(gestorId);
      document.body.classList.add("phase4-view-module");
      document.body.classList.remove("phase4-view-home");
      rrllApplyModuleVisibility(gestorId);
      gestor.open = true;
      closeOtherMainGestors(gestor);
      phase4SetActiveNav(gestorId);
      preventLegacySummaryToggle();
      forceActiveDetailsOpen();
      return true;
    }

    function openMainGestor(gestorId) {
      return phase4ShowModule(gestorId);
    }

    function closeOtherCommitteeSubsections(openSection) {
      document.querySelectorAll("#gestor-comite .committee-subsection").forEach(section => {
        if (section !== openSection && isDetailsElement(section)) section.open = false;
      });
    }

    function closeOtherParitariaSubsections(openSection) {
      document.querySelectorAll("#gestor-paritaria .paritaria-subsection").forEach(section => {
        if (section !== openSection && isDetailsElement(section)) section.open = false;
      });
    }

    function setupGestorAccordions() {
      if (rrllAccordionsReady) return;
      rrllAccordionsReady = true;

      RRLL_MAIN_GESTOR_IDS.forEach(id => {
        const gestor = document.getElementById(id);
        if (!isDetailsElement(gestor)) return;
        gestor.addEventListener("toggle", () => {
          if (gestor.open) {
            if (document.body.classList.contains("phase4-view-module") && rrllPhase4CurrentView !== id) {
              phase4ShowModule(id);
              return;
            }
            closeOtherMainGestors(gestor);
            if (document.body.classList.contains("phase4-view-module")) rrllApplyModuleVisibility(id);
          }
        });
      });

      document.querySelectorAll("#gestor-comite .committee-subsection").forEach(section => {
        if (!isDetailsElement(section)) return;
        section.addEventListener("toggle", () => {
          if (section.open) {
            openMainGestor("gestor-comite");
            closeOtherCommitteeSubsections(section);
          }
        });
      });

      document.querySelectorAll("#gestor-paritaria .paritaria-subsection").forEach(section => {
        if (!isDetailsElement(section)) return;
        section.addEventListener("toggle", () => {
          if (section.open) {
            openMainGestor("gestor-paritaria");
            closeOtherParitariaSubsections(section);
          }
        });
      });
    }

    function openCommitteeSubsection(sectionId) {
      openMainGestor("gestor-comite");
      const section = document.getElementById(sectionId);
      if (isDetailsElement(section)) {
        section.open = true;
        closeOtherCommitteeSubsections(section);
        preventLegacySummaryToggle();
        forceActiveDetailsOpen();
      }
    }

    function openParitariaSubsection(sectionId) {
      openMainGestor("gestor-paritaria");
      const section = document.getElementById(sectionId);
      if (isDetailsElement(section)) {
        section.open = true;
        closeOtherParitariaSubsections(section);
        preventLegacySummaryToggle();
        forceActiveDetailsOpen();
      }
    }

    document.addEventListener("click", event => {
      const group = document.getElementById("quickCommitteeGroup");
      if (group && !group.contains(event.target)) group.classList.remove("open");
      const paritariaGroup = document.getElementById("quickParitariaGroup");
      if (paritariaGroup && !paritariaGroup.contains(event.target)) paritariaGroup.classList.remove("open");
    });



    function setupPhase4Navigation() {
      rrllNormalizeModulePanels();
      rrllSetupVisibilityGuard();
      if (rrllPhase4NavigationReady) return;
      rrllPhase4NavigationReady = true;
      const links = Array.from(document.querySelectorAll(".phase4-nav-item, .phase4-nav-subitem"));
      const gestorMap = {
        "#gestor-tareas": "gestor-tareas",
        "#gestor-peticiones": "gestor-peticiones",
        "#gestor-actas": "gestor-actas",
        "#gestor-teletrabajo": "gestor-teletrabajo",
        "#gestor-vinculograma": "gestor-vinculograma",
        "#gestor-licencias": "gestor-licencias",
        "#gestor-plantilla": "gestor-plantilla",
        "#gestor-comite": "gestor-comite",
        "#gestor-paritaria": "gestor-paritaria",
        "#gestor-puntos-comite": "gestor-puntos-comite",
        "#gestor-sesiones-comite": "gestor-sesiones-comite",
        "#gestor-puntos-paritaria": "gestor-puntos-paritaria",
        "#gestor-sesiones-paritaria": "gestor-sesiones-paritaria"
      };
      links.forEach(link => {
        link.addEventListener("click", event => {
          if (link.classList.contains("phase4-nav-parent")) {
            event.preventDefault();
            return;
          }
          const href = link.getAttribute("href") || "";
          const view = link.getAttribute("data-view") || "";
          if (view === "home") {
            event.preventDefault();
            history.replaceState(null, "", window.location.pathname + window.location.search);
            phase4ShowHome();
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
          if (gestorMap[href]) {
            event.preventDefault();
            history.replaceState(null, "", href);
            const targetView = gestorMap[href];
            if (RRLL_PHASE4_SUBVIEW_MAP[targetView]) phase4OpenSubview(targetView);
            else openMainGestor(targetView);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
          phase4ShowHome();
        });
      });
      window.addEventListener("hashchange", phase4RouteFromHash);
    }

    function phase4RouteFromHash() {
      const hash = window.location.hash || "";
      const gestorId = hash.startsWith("#") ? hash.slice(1) : hash;
      if (RRLL_PHASE4_SUBVIEW_MAP[gestorId]) {
        phase4OpenSubview(gestorId);
      } else if (RRLL_MAIN_GESTOR_IDS.includes(gestorId)) {
        openMainGestor(gestorId);
      } else if (!gestorId) {
        // Fase 1: arranque estable y previsible. Si no hay hash, se entra siempre en Inicio.
        // Evita que una vista guardada antigua abra un gestor inesperado al iniciar.
        phase4ShowHome();
      } else {
        phase4ShowHome();
        setTimeout(() => {
          const target = document.getElementById(gestorId);
          if (target && typeof target.scrollIntoView === "function") {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 0);
      }
    }

function phase4OpenTarget(id) {
      if (RRLL_PHASE4_SUBVIEW_MAP[id]) {
        history.replaceState(null, "", `#${id}`);
        phase4OpenSubview(id);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (RRLL_MAIN_GESTOR_IDS.includes(id)) {
        history.replaceState(null, "", `#${id}`);
        openMainGestor(id);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      phase4ShowHome();
      const target = document.getElementById(id);
      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    function openPhase4DashboardTarget(id) {
      phase4OpenTarget(id);
    }

// Exposición explícita para compatibilidad con botones inline y módulos existentes.
window.toggleSidebarLeft = toggleSidebarLeft;
window.restoreSidebarLeftState = restoreSidebarLeftState;
window.toggleQuickCommitteeMenu = toggleQuickCommitteeMenu;
window.closeQuickCommitteeMenu = closeQuickCommitteeMenu;
window.toggleQuickParitariaMenu = toggleQuickParitariaMenu;
window.closeQuickParitariaMenu = closeQuickParitariaMenu;
window.togglePhase4SideSubmenu = togglePhase4SideSubmenu;
window.setupGestorAccordions = setupGestorAccordions;
window.phase4RouteFromHash = phase4RouteFromHash;
window.setupPhase4Navigation = setupPhase4Navigation;
window.phase4ShowHome = phase4ShowHome;
window.phase4ShowModule = phase4ShowModule;
window.rrllApplyModuleVisibility = rrllApplyModuleVisibility;
window.rrllEnsureSingleVisibleModule = rrllEnsureSingleVisibleModule;
window.openMainGestor = openMainGestor;
window.openCommitteeSubsection = openCommitteeSubsection;
window.openParitariaSubsection = openParitariaSubsection;
window.openPhase4DashboardTarget = openPhase4DashboardTarget;
