(function () {
  "use strict";

  const RECIPIENTS_KEY = "rrll_especiales_destinatarios";
  let editingRecipientId = null;
  let selectedMsgFile = null;

  function getRecipients() {
    const value = load(RECIPIENTS_KEY, []);
    return Array.isArray(value) ? value : [];
  }

  function setRecipients(items) {
    save(RECIPIENTS_KEY, Array.isArray(items) ? items : []);
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function getActiveRecipients() {
    return getRecipients().filter(item => item && item.active && isValidEmail(item.email));
  }

  function buildEspecialesSubject(evento) {
    return `Servicio Especial ${String(evento || "").trim()}`.trim();
  }

  function buildEspecialesHtmlBody(payload = {}) {
    const evento = String(payload.evento || "").trim();
    const fecha = String(payload.fecha || "").trim();
    const hora = String(payload.hora || "").trim();
    const enlace = String(payload.enlace || "").trim();
    const ruta = String(payload.ruta || "").trim();

    const intro = `Se adjuntan los turnos de conducción correspondientes al servicio especial de ${escapeHtml(evento || "[EVENTO]")}, que tendrá lugar${fecha ? ` el ${escapeHtml(fecha)}` : ""}${hora ? ` a las ${escapeHtml(hora)}` : ""}.`;

    return [
      "<p>Kaixo:</p>",
      `<p>${intro}</p>`,
      enlace ? `<p>La información también se encuentra disponible en la intranet:<br><a href="${escapeHtml(enlace)}">${escapeHtml(enlace)}</a></p>` : "",
      ruta ? `<p>Los turnos están disponibles en la siguiente ruta:<br>${escapeHtml(ruta)}</p>` : "",
      "<p>Agur bat.</p>"
    ].filter(Boolean).join("");
  }

  function collectServiceData() {
    return {
      evento: String(document.getElementById("especialesEvento")?.value || "").trim(),
      fecha: String(document.getElementById("especialesFecha")?.value || "").trim(),
      hora: String(document.getElementById("especialesHora")?.value || "").trim(),
      enlace: String(document.getElementById("especialesEnlace")?.value || "").trim(),
      ruta: String(document.getElementById("especialesRuta")?.value || "").trim(),
      observaciones: String(document.getElementById("especialesObservaciones")?.value || "").trim()
    };
  }

  function syncDraftButtonState() {
    const button = document.getElementById("especialesGenerateDraftBtn");
    const warning = document.getElementById("especialesRecipientsWarning");
    if (!button || !warning) return;
    const hasActive = getActiveRecipients().length > 0;
    button.disabled = !hasActive;
    warning.style.display = hasActive ? "none" : "block";
  }

  function renderEspecialesPreview() {
    const preview = document.getElementById("especialesPreview");
    if (!preview) return;
    const data = collectServiceData();
    preview.innerHTML = buildEspecialesHtmlBody(data);
    syncDraftButtonState();
  }

  function resetRecipientForm() {
    const nameInput = document.getElementById("especialRecipientName");
    const emailInput = document.getElementById("especialRecipientEmail");
    const activeInput = document.getElementById("especialRecipientActive");
    const button = document.getElementById("especialRecipientSubmitBtn");
    if (nameInput) nameInput.value = "";
    if (emailInput) emailInput.value = "";
    if (activeInput) activeInput.checked = true;
    if (button) button.textContent = "Añadir destinatario";
    editingRecipientId = null;
  }

  function editEspecialRecipient(id) {
    const item = getRecipients().find(entry => entry && entry.id === id);
    if (!item) return;
    editingRecipientId = id;
    const nameInput = document.getElementById("especialRecipientName");
    const emailInput = document.getElementById("especialRecipientEmail");
    const activeInput = document.getElementById("especialRecipientActive");
    const button = document.getElementById("especialRecipientSubmitBtn");
    if (nameInput) nameInput.value = item.name || "";
    if (emailInput) emailInput.value = item.email || "";
    if (activeInput) activeInput.checked = !!item.active;
    if (button) button.textContent = "Guardar cambios";
  }

  function toggleEspecialRecipient(id, active) {
    const next = getRecipients().map(item => item && item.id === id ? { ...item, active: !!active } : item);
    setRecipients(next);
    renderEspecialesRecipients();
    renderEspecialesPreview();
  }

  function renderEspecialesRecipients() {
    const body = document.getElementById("especialesRecipientsBody");
    if (!body) return;
    const items = getRecipients();

    body.innerHTML = items.length ? items.map(item => {
      const itemId = String(item.id || "");
      return `<tr>
        <td>${escapeHtml(item.name || "")}</td>
        <td>${escapeHtml(item.email || "")}</td>
        <td><input type="checkbox" ${item.active ? "checked" : ""} onchange="toggleEspecialRecipient('${escapeHtml(itemId)}', this.checked)" aria-label="Activar destinatario"></td>
        <td>
          <button type="button" class="secondary small" onclick="editEspecialRecipient('${escapeHtml(itemId)}')">Editar</button>
          <button type="button" class="secondary small" onclick="deleteEspecialRecipient('${escapeHtml(itemId)}')">Eliminar</button>
        </td>
      </tr>`;
    }).join("") : '<tr><td colspan="4" class="muted">Sin destinatarios.</td></tr>';

    syncDraftButtonState();
  }

  function addEspecialRecipient() {
    const name = String(document.getElementById("especialRecipientName")?.value || "").trim();
    const email = String(document.getElementById("especialRecipientEmail")?.value || "").trim();
    const active = !!document.getElementById("especialRecipientActive")?.checked;

    if (!name) return alert("Debes indicar un nombre.");
    if (!isValidEmail(email)) return alert("El email no tiene un formato válido.");

    const normalized = normalizeEmail(email);
    const items = getRecipients();
    const duplicated = items.find(item => item && normalizeEmail(item.email) === normalized && item.id !== editingRecipientId);
    if (duplicated) return alert("Ya existe un destinatario con ese email.");

    const next = editingRecipientId
      ? items.map(item => item && item.id === editingRecipientId ? { ...item, name, email, active } : item)
      : [...items, { id: crypto.randomUUID ? crypto.randomUUID() : `esp-${Date.now()}-${Math.random().toString(36).slice(2)}`, name, email, active }];

    setRecipients(next);
    resetRecipientForm();
    renderEspecialesRecipients();
    renderEspecialesPreview();
  }

  function deleteEspecialRecipient(id) {
    const next = getRecipients().filter(item => item && item.id !== id);
    setRecipients(next);
    if (editingRecipientId === id) resetRecipientForm();
    renderEspecialesRecipients();
    renderEspecialesPreview();
  }

  async function generateEspecialesDraft() {
    const active = getActiveRecipients();
    if (!active.length) return alert("No hay destinatarios activos.");

    const data = collectServiceData();
    if (!data.evento) return alert("Debes indicar al menos el nombre del evento.");

    try {
      const result = await window.rrllOutlook.createDraft({
        to: active.map(x => x.email).join(";"),
        cc: "",
        subject: buildEspecialesSubject(data.evento),
        htmlBody: buildEspecialesHtmlBody(data)
      });
      if (!result || !result.ok) throw new Error(result && result.message ? result.message : "Outlook no disponible");
      alert("Se ha abierto el borrador en Outlook para revisión manual.");
    } catch (error) {
      console.error("Error creando borrador Outlook:", error);
      alert(`No se ha podido abrir Outlook.\nDetalle: ${error && error.message ? error.message : "error desconocido"}`);
    }
  }

  function clearEspecialesForm() {
    ["especialesEvento", "especialesFecha", "especialesHora", "especialesEnlace", "especialesRuta", "especialesObservaciones"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    renderEspecialesPreview();
  }

  function renderEspeciales() {
    resetRecipientForm();
    renderEspecialesPreview();
    renderEspecialesRecipients();
    initMsgImport();
  }

  function normalizeDateInput(raw) {
    const v = String(raw || "").trim();
    const m = v.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
    if (!m) return "";
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${month}-${day}`;
  }

  function normalizeTimeInput(raw) {
    const v = String(raw || "").trim().replace("h", "").replace(".", ":");
    const m = v.match(/(\d{1,2}):(\d{2})/);
    if (!m) return "";
    return `${m[1].padStart(2, "0")}:${m[2]}`;
  }

  function detectAutoFields(text) {
    const source = String(text || "");
    const eventMatch = source.match(/(?:concierto|evento|bec)\s*[:\-]?\s*([^\n\r]{4,120})/i);
    const dateMatch = source.match(/(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i);
    const timeMatch = source.match(/\b(\d{1,2}(?::|\.)\d{2}\s*h?)\b/i);
    const urlMatch = source.match(/\bhttps?:\/\/[^\s<>"']+/i) || source.match(/\b(?:intranet|www\.)[^\s<>"']+/i);
    const uncMatch = source.match(/(?:[A-Za-z]:\\|\\\\)[^\n\r;,"<>]+/);
    return {
      evento: eventMatch ? eventMatch[1].trim() : "",
      fecha: dateMatch ? normalizeDateInput(dateMatch[1]) : "",
      hora: timeMatch ? normalizeTimeInput(timeMatch[1]) : "",
      enlace: urlMatch ? urlMatch[0].trim() : "",
      ruta: uncMatch ? uncMatch[0].trim() : ""
    };
  }

  function readMsgTextPayload(buffer) {
    const latin1 = new TextDecoder("latin1").decode(buffer);
    const utf16 = new TextDecoder("utf-16le").decode(buffer);
    const merged = `${latin1}\n${utf16}`.replace(/\0/g, " ");
    return merged;
  }

  async function parseOutlookMsg(file) {
    if (!file || !/\.msg$/i.test(file.name || "")) {
      return { ok: false, message: "Selecciona un archivo .msg válido." };
    }
    try {
      const buffer = await file.arrayBuffer();
      const text = readMsgTextPayload(buffer);
      const subject = (text.match(/(?:subject|asunto)\s*[:=]\s*([^\r\n]{3,200})/i) || [])[1] || "";
      const senderName = (text.match(/(?:from|de)\s*[:=]\s*([^\r\n<]{3,120})/i) || [])[1] || "";
      const senderEmail = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0] || "";
      const date = (text.match(/(?:sent|fecha)\s*[:=]\s*([^\r\n]{4,80})/i) || [])[1] || "";
      const body = text.slice(0, 10000);
      const auto = detectAutoFields(`${subject}\n${body}`);
      return {
        ok: !!(subject || body),
        partial: !(auto.evento && auto.fecha && auto.hora && (auto.enlace || auto.ruta)),
        data: { subject: subject.trim(), body, senderName: senderName.trim(), senderEmail: senderEmail.trim(), date: date.trim(), ...auto }
      };
    } catch (error) {
      console.error("Error parseando .msg:", error);
      return { ok: false, message: "No se ha podido importar el mensaje .msg." };
    }
  }

  function setMsgStatus(text, tone) {
    const status = document.getElementById("especialesMsgStatus");
    if (!status) return;
    status.textContent = text || "";
    status.className = tone === "error" ? "muted danger" : "muted";
  }

  async function importSelectedMsg() {
    if (!selectedMsgFile) return setMsgStatus("Selecciona o arrastra primero un archivo .msg.", "error");
    const parsed = await parseOutlookMsg(selectedMsgFile);
    if (!parsed.ok) {
      setMsgStatus(parsed.message || "No se ha podido interpretar completamente el mensaje", "error");
      return;
    }
    const data = parsed.data || {};
    const setValue = (id, value) => {
      const input = document.getElementById(id);
      if (input && value) input.value = value;
    };
    setValue("especialesEvento", data.evento || data.subject);
    setValue("especialesFecha", data.fecha);
    setValue("especialesHora", data.hora);
    setValue("especialesEnlace", data.enlace);
    setValue("especialesRuta", data.ruta);
    renderEspecialesPreview();
    setMsgStatus(parsed.partial ? "No se ha podido interpretar completamente el mensaje" : "Mensaje importado correctamente");
  }

  function initMsgImport() {
    const input = document.getElementById("especialesMsgInput");
    const selectBtn = document.getElementById("especialesMsgSelectBtn");
    const importBtn = document.getElementById("especialesMsgImportBtn");
    const dropZone = document.getElementById("especialesMsgDropZone");
    if (!input || !selectBtn || !importBtn || !dropZone || dropZone.dataset.bound === "1") return;
    dropZone.dataset.bound = "1";
    selectBtn.addEventListener("click", () => input.click());
    importBtn.addEventListener("click", () => { importSelectedMsg(); });
    input.addEventListener("change", () => {
      selectedMsgFile = input.files && input.files[0] ? input.files[0] : null;
      setMsgStatus(selectedMsgFile ? `Archivo listo: ${selectedMsgFile.name}` : "");
    });
    ["dragenter", "dragover"].forEach(eventName => {
      dropZone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.opacity = "0.8";
      });
    });
    ["dragleave", "drop"].forEach(eventName => {
      dropZone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.opacity = "1";
      });
    });
    dropZone.addEventListener("drop", e => {
      const files = e.dataTransfer && e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
      const file = files.find(x => /\.msg$/i.test(x.name || ""));
      if (!file) {
        setMsgStatus("Si el arrastre directo desde Outlook no funciona, guarda primero el correo como archivo .msg.", "error");
        return;
      }
      selectedMsgFile = file;
      setMsgStatus(`Archivo listo: ${file.name}`);
    });
  }

  window.renderEspeciales = renderEspeciales;
  window.addEspecialRecipient = addEspecialRecipient;
  window.deleteEspecialRecipient = deleteEspecialRecipient;
  window.editEspecialRecipient = editEspecialRecipient;
  window.toggleEspecialRecipient = toggleEspecialRecipient;
  window.generateEspecialesDraft = generateEspecialesDraft;
  window.clearEspecialesForm = clearEspecialesForm;
  window.renderEspecialesPreview = renderEspecialesPreview;
  window.parseOutlookMsg = parseOutlookMsg;
})();
