(function () {
  const ACTIVE_USERS_KEY = "rrll_active_users";
  const HEARTBEAT_MS = 30 * 1000;
  const STALE_MS = 2 * 60 * 1000;

  let presenceTimer = null;
  let currentPresenceId = null;
  let currentIdentity = null;

  function readActiveUsers() {
    const raw = typeof load === "function" ? load(ACTIVE_USERS_KEY, []) : [];
    return Array.isArray(raw) ? raw : [];
  }

  function writeActiveUsers(users) {
    if (typeof save === "function") save(ACTIVE_USERS_KEY, Array.isArray(users) ? users : []);
  }

  function isFresh(entry, nowMs = Date.now()) {
    const lastSeenMs = Date.parse(entry && entry.lastSeen);
    return Number.isFinite(lastSeenMs) && (nowMs - lastSeenMs) <= STALE_MS;
  }

  function formatLastSeen(iso) {
    const ms = Date.parse(iso);
    if (!Number.isFinite(ms)) return "sin dato";
    const diff = Math.max(0, Date.now() - ms);
    if (diff < 60 * 1000) return "hace <1 min";
    const mins = Math.floor(diff / 60000);
    return `hace ${mins} min`;
  }

  async function resolveIdentity() {
    if (currentIdentity) return currentIdentity;
    let username = "usuario";
    let hostname = "equipo";
    let appVersion = "";

    try {
      const info = window.rrllDB && typeof window.rrllDB.getInfo === "function" ? await window.rrllDB.getInfo() : null;
      if (info && info.user) {
        const userText = String(info.user).trim();
        if (userText) username = userText;
      }
      if (info && info.hostname) hostname = String(info.hostname || "").trim() || hostname;
      if (info && info.appVersion) appVersion = String(info.appVersion || "").trim();
    } catch (error) {
      console.warn("No se pudo resolver identidad para presencia:", error);
    }

    currentIdentity = { username, hostname, appVersion };
    currentPresenceId = `${username.toLowerCase()}@${hostname.toLowerCase()}`;
    return currentIdentity;
  }

  function pruneAndRender() {
    const now = Date.now();
    const users = readActiveUsers();
    const freshUsers = users.filter(item => isFresh(item, now));
    if (freshUsers.length !== users.length) writeActiveUsers(freshUsers);

    const counter = document.getElementById("presenceCount");
    const list = document.getElementById("presenceUsersList");
    if (!counter || !list) return;

    counter.textContent = String(freshUsers.length);
    if (!freshUsers.length) {
      list.innerHTML = '<li class="presence-empty">Sin usuarios conectados</li>';
      return;
    }

    list.innerHTML = freshUsers
      .sort((a, b) => Date.parse(b.lastSeen || "") - Date.parse(a.lastSeen || ""))
      .map(item => `<li><strong>${escapeHtml(item.username || "usuario")}</strong> · ${escapeHtml(item.hostname || "equipo")}<small>${escapeHtml(formatLastSeen(item.lastSeen))}</small></li>`)
      .join("");
  }

  async function heartbeat() {
    const identity = await resolveIdentity();
    const nowIso = new Date().toISOString();
    const users = readActiveUsers().filter(item => isFresh(item));

    const entry = {
      id: currentPresenceId,
      username: identity.username,
      hostname: identity.hostname,
      lastSeen: nowIso,
      appVersion: identity.appVersion || undefined
    };

    const idx = users.findIndex(item => String(item.id || "") === currentPresenceId);
    if (idx >= 0) users[idx] = { ...users[idx], ...entry };
    else users.push(entry);

    writeActiveUsers(users);
    pruneAndRender();
  }

  function removeCurrentUser() {
    if (!currentPresenceId) return;
    const users = readActiveUsers();
    const next = users.filter(item => String(item.id || "") !== currentPresenceId);
    if (next.length !== users.length) writeActiveUsers(next);
  }

  function startPresence() {
    heartbeat().catch(error => console.warn("Heartbeat inicial de presencia falló:", error));
    if (presenceTimer) clearInterval(presenceTimer);
    presenceTimer = setInterval(() => {
      heartbeat().catch(error => console.warn("Heartbeat de presencia falló:", error));
    }, HEARTBEAT_MS);

    window.addEventListener("beforeunload", () => {
      try { removeCurrentUser(); } catch {}
    });

    setInterval(pruneAndRender, 20 * 1000);
  }

  window.startPresenceTracking = startPresence;
  window.renderPresenceWidget = pruneAndRender;
})();
