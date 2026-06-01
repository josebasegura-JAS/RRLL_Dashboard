/**
 * Helpers de adjuntos del renderer.
 * Extraído de storage.js sin cambiar comportamiento funcional.
 */

    function attachmentNameFromPath(pathValue) {
      const parts = String(pathValue || "").split(/[/\\]/);
      return parts[parts.length - 1] || String(pathValue || "");
    }

    async function openAttachment(pathValue) {
      const result = await window.rrllAttachments?.openPath?.(pathValue);
      if (!result || !result.ok) alert("El archivo ya no existe o no es accesible.");
    }

    async function openAttachmentFolder(pathValue) {
      const result = await window.rrllAttachments?.openFolder?.(pathValue);
      if (!result || !result.ok) alert("El archivo ya no existe o no es accesible.");
    }

    function removeAttachmentReference(moduleName, index) {
      const key = moduleName === "task" ? "__taskDraftAttachments" : "__petitionDraftAttachments";
      const list = Array.isArray(window[key]) ? [...window[key]] : [];
      list.splice(index, 1);
      window[key] = list;
      if (moduleName === "task") window.renderTaskAttachments?.();
      else window.renderPetitionAttachments?.();
    }

    async function selectTaskAttachmentFiles() {
      const selected = await window.rrllAttachments?.selectFiles?.() || [];
      const current = Array.isArray(window.__taskDraftAttachments) ? [...window.__taskDraftAttachments] : [];
      selected.forEach(pathValue => {
        const normalized = String(pathValue || "").trim();
        if (!normalized || current.some(item => item.path === normalized)) return;
        current.push({ name: attachmentNameFromPath(normalized), path: normalized, type: "file", addedAt: new Date().toISOString() });
      });
      window.__taskDraftAttachments = current;
      window.renderTaskAttachments?.();
    }

    async function selectPetitionAttachmentFiles() {
      const selected = await window.rrllAttachments?.selectFiles?.() || [];
      const current = Array.isArray(window.__petitionDraftAttachments) ? [...window.__petitionDraftAttachments] : [];
      selected.forEach(pathValue => {
        const normalized = String(pathValue || "").trim();
        if (!normalized || current.some(item => item.path === normalized)) return;
        current.push({ name: attachmentNameFromPath(normalized), path: normalized, type: "file", addedAt: new Date().toISOString() });
      });
      window.__petitionDraftAttachments = current;
      window.renderPetitionAttachments?.();
    }

    function renderAttachments(targetId, list, moduleName) {
      const container = document.getElementById(targetId);
      if (!container) return;
      const items = Array.isArray(list) ? list : [];
      container.innerHTML = items.length
        ? items.map((item, index) => `<div class="rrll-attachment-item" ondblclick="openAttachment('${escapeHtml(item.path || "")}')"><span>📄 ${escapeHtml(item.name || "Documento")}</span><small>${escapeHtml(item.path || "")}</small><div><button class="small secondary" onclick="openAttachment('${escapeHtml(item.path || "")}')">Abrir</button><button class="small secondary" onclick="openAttachmentFolder('${escapeHtml(item.path || "")}')">Carpeta</button><button class="small danger" onclick="removeAttachmentReference('${moduleName}', ${index})">Quitar</button></div></div>`).join("")
        : `<div class="muted">Sin adjuntos.</div>`;
    }

    function renderTaskAttachments(targetId = "newTaskAttachmentsList", source) {
      const items = Array.isArray(source) ? source : (Array.isArray(window.__taskDraftAttachments) ? window.__taskDraftAttachments : []);
      const effectiveTarget = document.getElementById("taskUpdateModal")?.classList.contains("open") && !source ? "taskAttachmentsList" : targetId;
      renderAttachments(effectiveTarget, items, "task");
    }

    function renderPetitionAttachments(targetId = "newPetitionAttachmentsList", source) {
      const items = Array.isArray(source) ? source : (Array.isArray(window.__petitionDraftAttachments) ? window.__petitionDraftAttachments : []);
      const effectiveTarget = document.getElementById("petitionUpdateModal")?.classList.contains("open") && !source ? "petitionAttachmentsList" : targetId;
      renderAttachments(effectiveTarget, items, "petition");
    }

    window.openAttachment = openAttachment;
    window.openAttachmentFolder = openAttachmentFolder;
    window.removeAttachmentReference = removeAttachmentReference;
    window.selectTaskAttachmentFiles = selectTaskAttachmentFiles;
    window.selectPetitionAttachmentFiles = selectPetitionAttachmentFiles;
    window.renderTaskAttachments = renderTaskAttachments;
    window.renderPetitionAttachments = renderPetitionAttachments;
