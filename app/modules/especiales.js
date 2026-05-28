(function () {
  "use strict";

  const RECIPIENTS_KEY = "rrll_especiales_destinatarios";
  let editingRecipientId = null;

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
  }

  function parseOutlookMsg(_file) {
    // TODO(fase-futura): parseo real de mensaje .msg
    return { ok: false, pending: true, message: "Próximamente disponible" };
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
