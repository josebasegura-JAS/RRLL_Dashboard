// Adaptador de compatibilidad del tema visual RRLL.
// Mantiene la API histórica, pero el único tema activo y persistido es oscuro.
(function () {
  const THEME_KEY = "rrll_theme";
  const DARK_THEME = "dark";

  function readTheme() {
    return DARK_THEME;
  }

  function updateThemeButtons() {
    document.querySelectorAll("[data-theme-choice]").forEach(button => {
      const darkChoice = button.getAttribute("data-theme-choice") === DARK_THEME;
      button.hidden = true;
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      button.classList.toggle("active", darkChoice);
      button.setAttribute("aria-pressed", darkChoice ? "true" : "false");
    });
  }

  function applyDarkTheme() {
    document.documentElement.setAttribute("data-theme", DARK_THEME);
    if (document.body) document.body.setAttribute("data-theme", DARK_THEME);
    updateThemeButtons();
    return DARK_THEME;
  }

  function persistDarkTheme() {
    try { localStorage.setItem(THEME_KEY, DARK_THEME); } catch {}
  }

  window.setRRLLTheme = function setRRLLTheme() {
    applyDarkTheme();
    persistDarkTheme();
  };

  window.getRRLLTheme = readTheme;

  document.addEventListener("DOMContentLoaded", () => {
    applyDarkTheme();
    persistDarkTheme();
  });

  applyDarkTheme();
  persistDarkTheme();
})();
