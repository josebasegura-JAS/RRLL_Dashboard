// Acceso operativo a la carpeta principal de Relaciones Laborales.
(function () {
  const DEFAULT_RRLL_FOLDER_PATH = "G:\\Capital Humano\\Relaciones Laborales";
  let rrllFolderNoticeTimer = null;

  function getRRLLFolderBridge() {
    return window.rrllFolder && typeof window.rrllFolder === "object" ? window.rrllFolder : null;
  }

  function getLocalFallbackPath() {
    try {
      return localStorage.getItem("rrll_folder_path") || DEFAULT_RRLL_FOLDER_PATH;
    } catch {
      return DEFAULT_RRLL_FOLDER_PATH;
    }
  }

  function setLocalFallbackPath(folderPath) {
    try {
      localStorage.setItem("rrll_folder_path", folderPath);
    } catch {}
  }

  function showRRLLFolderMessage(message, type = "error") {
    const sidebarNotice = document.getElementById("rrllFolderNotice");
    const configMessage = document.getElementById("rrllFolderConfigMessage");

    if (sidebarNotice) {
      sidebarNotice.textContent = message;
      sidebarNotice.classList.remove("success", "error", "visible");
      sidebarNotice.classList.add(type === "success" ? "success" : "error", "visible");
      clearTimeout(rrllFolderNoticeTimer);
      rrllFolderNoticeTimer = setTimeout(() => sidebarNotice.classList.remove("visible"), 3200);
    }

    if (configMessage) {
      configMessage.textContent = message;
      configMessage.classList.remove("success", "error");
      configMessage.classList.add(type === "success" ? "success" : "error");
    }
  }

  async function loadRRLLFolderPath() {
    const bridge = getRRLLFolderBridge();
    try {
      if (bridge && typeof bridge.getPath === "function") {
        const folderPath = await bridge.getPath();
        return folderPath || DEFAULT_RRLL_FOLDER_PATH;
      }
    } catch (error) {
      console.error("No se pudo cargar la carpeta RRLL:", error);
    }
    return getLocalFallbackPath();
  }

  async function renderRRLLFolderConfig() {
    const input = document.getElementById("rrllFolderPathInput");
    if (!input) return;
    input.value = await loadRRLLFolderPath();
  }

  async function saveRRLLFolderPath() {
    const input = document.getElementById("rrllFolderPathInput");
    const folderPath = input ? input.value.trim() : "";
    if (!folderPath) {
      showRRLLFolderMessage("No se pudo abrir la carpeta configurada.", "error");
      return;
    }

    const bridge = getRRLLFolderBridge();
    try {
      let savedPath = folderPath;
      if (bridge && typeof bridge.setPath === "function") {
        savedPath = await bridge.setPath(folderPath);
      } else {
        setLocalFallbackPath(folderPath);
      }
      if (input) input.value = savedPath || folderPath;
      showRRLLFolderMessage("Ruta de carpeta guardada.", "success");
    } catch (error) {
      console.error("No se pudo guardar la carpeta RRLL:", error);
      showRRLLFolderMessage("No se pudo abrir la carpeta configurada.", "error");
    }
  }

  async function openRRLLFolderShortcut() {
    const bridge = getRRLLFolderBridge();
    try {
      if (!bridge || typeof bridge.open !== "function") {
        showRRLLFolderMessage("No se pudo abrir la carpeta configurada.", "error");
        return;
      }
      const result = await bridge.open();
      if (!result || !result.ok) {
        showRRLLFolderMessage("No se pudo abrir la carpeta configurada.", "error");
      }
    } catch (error) {
      console.error("No se pudo abrir la carpeta RRLL:", error);
      showRRLLFolderMessage("No se pudo abrir la carpeta configurada.", "error");
    }
  }

  window.renderRRLLFolderConfig = renderRRLLFolderConfig;
  window.saveRRLLFolderPath = saveRRLLFolderPath;
  window.openRRLLFolderShortcut = openRRLLFolderShortcut;

  document.addEventListener("DOMContentLoaded", () => {
    renderRRLLFolderConfig();
  });
})();
