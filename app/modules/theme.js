// Selector de tema visual RRLL.
// Mantiene la elección en localStorage y no toca lógica ni datos.
(function () {
  const THEME_KEY = "rrll_theme";
  const DEFAULT_THEME = "dark";
  const VALID_THEMES = new Set(["light", "dark"]);

  function readTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "light") return "dark";
      return VALID_THEMES.has(stored) ? stored : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  }

  function updateThemeButtons(theme) {
    const darkOnlyNotice = document.getElementById("themeDarkOnlyNotice");
    if (darkOnlyNotice) darkOnlyNotice.hidden = false;
    document.querySelectorAll("[data-theme-choice]").forEach(button => {
      if (button.getAttribute("data-theme-choice") !== "dark") {
        button.hidden = true;
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
        button.classList.remove("active");
        button.setAttribute("aria-pressed", "false");
        return;
      }
      const active = button.getAttribute("data-theme-choice") === theme;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function applyTheme(theme) {
    const safeTheme = VALID_THEMES.has(theme) ? theme : DEFAULT_THEME;
    document.documentElement.setAttribute("data-theme", safeTheme);
    if (document.body) document.body.setAttribute("data-theme", safeTheme);
    updateThemeButtons(safeTheme);
    return safeTheme;
  }

  window.setRRLLTheme = function setRRLLTheme(theme) {
    const safeTheme = applyTheme("dark");
    try { localStorage.setItem(THEME_KEY, safeTheme); } catch {}
  };

  window.getRRLLTheme = readTheme;

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(readTheme());
  });

  applyTheme(readTheme());
})();
