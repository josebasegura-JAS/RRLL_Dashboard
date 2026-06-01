const DEFAULT_LINKS = [
      { name: "Firma Digital", url: "https://apps.docusign.com/send" }
    ];

    const DEFAULT_ALLEGATION_UNIONS = ["ELA", "CCOO", "UGT", "LAB", "ESK", "SEMAF", "USO"];

    const MINUTE_STATUS_LABELS = {
      todo: "Pendiente de hacer",
      direction: "Enviada a Dirección",
      allegations: "Pendiente de alegaciones",
      signature: "Pendiente de firma"
    };


    // Funciones compartidas que aún coordinan alertas y sesiones de Comité.

    function toggleAlertsPanel() {
      const panel = document.getElementById("alertsPanel");
      if (!panel) return;
      panel.classList.toggle("collapsed");
      const collapsed = panel.classList.contains("collapsed");
      localStorage.setItem("rrll_alerts_collapsed", collapsed ? "1" : "0");
      const btn = document.getElementById("alerts-toggle");
      if (btn) btn.textContent = collapsed ? "▶" : "▼";
    }

    function restoreAlertsPanelState() {
      const panel = document.getElementById("alertsPanel");
      if (!panel) return;
      const collapsed = localStorage.getItem("rrll_alerts_collapsed") === "1";
      panel.classList.toggle("collapsed", collapsed);
      const btn = document.getElementById("alerts-toggle");
      if (btn) btn.textContent = collapsed ? "▶" : "▼";
    }

    function scrollToModule(moduleId) {
      const el = document.getElementById(moduleId);
      if (el) {
        el.open = true;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    function renderAlertsPanel() {
      const body = document.getElementById("alertsBody");
      const count = document.getElementById("alerts-count");
      if (!body || !count) return;

      const alerts = [];
      getTasks().forEach(task => {
        if (task.status === "closed") return;
        const due = dueStatus(task.dueDate);
        if (due.diffDays !== null && due.diffDays <= 5) {
          alerts.push({ type: due.diffDays < 0 ? "expired" : "due", title: task.title, module: "Tareas", moduleId: "gestor-tareas", meta: due.text });
        }
        const inactive = daysSince(latestActivityDate(task));
        if (task.status === "progress" && inactive !== null && inactive >= 14) {
          alerts.push({ type: "stale", title: task.title, module: "Tareas", moduleId: "gestor-tareas", meta: `En curso sin movimiento desde hace ${inactive} días` });
        }
      });

      getPetitions().forEach(item => {
        if (item.status === "petition-closed") return;
        const due = dueStatus(item.dueDate);
        if (due.diffDays !== null && due.diffDays <= 5) {
          alerts.push({ type: due.diffDays < 0 ? "expired" : "due", title: item.title, module: "Peticiones", moduleId: "gestor-peticiones", meta: due.text });
        }
        const inactive = daysSince(latestActivityDate(item));
        if (item.status === "petition-progress" && inactive !== null && inactive >= 14) {
          alerts.push({ type: "stale", title: item.title, module: "Peticiones", moduleId: "gestor-peticiones", meta: `En curso sin movimiento desde hace ${inactive} días` });
        }
      });

      getMinutes().forEach(minute => {
        if (minute.status !== "allegations" || !minute.dueDate) return;
        const due = dueStatus(minute.dueDate);
        if (due.diffDays !== null && due.diffDays <= 5) {
          alerts.push({ type: due.diffDays < 0 ? "expired" : "due", title: minute.title, module: "Actas", moduleId: "gestor-actas", meta: due.text });
        }
      });

      getAgendaItems().forEach(item => {
        if (item.status !== "agenda-progress") return;
        const inactive = daysSince(latestActivityDate(item));
        if (inactive !== null && inactive >= 21) {
          alerts.push({ type: "stale", title: item.title, module: "Comité", moduleId: "gestor-comite", meta: `En curso sin movimiento desde hace ${inactive} días` });
        }
      });

      count.textContent = alerts.length;
      if (!alerts.length) {
        body.innerHTML = `<div class="muted">Sin alertas activas.</div>`;
        return;
      }

      body.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.type === "expired" ? "expired" : alert.type === "stale" ? "stale" : ""}" onclick="scrollToModule('${alert.moduleId}')">
          <div class="alert-title">${escapeHtml(alert.module)} · ${escapeHtml(alert.title)}</div>
          <div class="alert-meta">${escapeHtml(alert.meta)}</div>
        </div>
      `).join("");
    }


    function committeeSessionMinuteTitle(session) {
      const code = session.code || session.title || "sin código";
      return `Acta Comité de Empresa ${code}`;
    }

    function committeeSessionHasPassed(session) {
      if (!session || !session.date || !/^\d{4}-\d{2}-\d{2}$/.test(session.date)) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const date = new Date(session.date + "T00:00:00");
      return date < today;
    }

    function syncPastCommitteeSessionsToMinutes() {
      const sessions = getCommitteeSessions();
      const minutes = getMinutes();
      const existingSessionIds = new Set(minutes.map(m => m.sourceCommitteeSessionId).filter(Boolean));
      const existingTitles = new Set(minutes.map(m => String(m.title || "").trim().toLowerCase()).filter(Boolean));
      const now = new Date().toISOString();
      const incoming = [];

      sessions.forEach(session => {
        if (session.status === "closed" || session.historical) return;
        if (!committeeSessionHasPassed(session)) return;
        if (existingSessionIds.has(session.id)) return;
        const title = committeeSessionMinuteTitle(session);
        if (existingTitles.has(title.trim().toLowerCase())) return;
        const items = getCommitteeSessionDisplayItems(session).map((item, index) => `${index + 1}. ${item.title}`).join("\n");
        incoming.push({
          id: crypto.randomUUID ? crypto.randomUUID() : `minute-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          title,
          status: "todo",
          dueDate: "",
          notes: `Generada automáticamente desde sesión de Comité.\nCódigo: ${session.code || "Sin código"}\nFecha: ${session.date || session.rawDate || "Sin fecha"}${items ? `\n\nOrden del día:\n${items}` : ""}`,
          sourceCommitteeSessionId: session.id,
          sourceCommitteeSessionCode: session.code || "",
          sourceCommitteeSessionDate: session.date || session.rawDate || "",
          createdAt: now,
          updatedAt: now
        });
        existingSessionIds.add(session.id);
        existingTitles.add(title.trim().toLowerCase());
      });

      if (incoming.length) setMinutes([...incoming, ...minutes]);
    }
