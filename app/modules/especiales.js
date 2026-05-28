(function () {
  "use strict";

  const RECIPIENTS_KEY = "rrll_especiales_destinatarios";

  function getRecipients() {
    const value = load(RECIPIENTS_KEY, []);
    return Array.isArray(value) ? value : [];
  }

  function setRecipients(items) {
    save(RECIPIENTS_KEY, Array.isArray(items) ? items : []);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function renderEspecialesPreview() {
    const evento = String(document.getElementById("especialesEvento")?.value || "").trim();
    const fecha = String(document.getElementById("especialesFecha")?.value || "").trim();
    const hora = String(document.getElementById("especialesHora")?.value || "").trim();
    const enlace = String(document.getElementById("especialesEnlace")?.value || "").trim();
    const ruta = String(document.getElementById("especialesRuta")?.value || "").trim();
    const preview = document.getElementById("especialesPreview");
    if (!preview) return;

    const lines = [
      "<p>Kaixo:</p>",
      [fecha || hora ? `<p>Se adjuntan turnos de conducción para el servicio especial de ${escapeHtml(evento || "[EVENTO]")}, que tendrá lugar${fecha ? ` el ${escapeHtml(fecha)}` : ""}${hora ? ` a las ${escapeHtml(hora)}` : ""}.</p>` : `<p>Se adjuntan turnos de conducción para el servicio especial de ${escapeHtml(evento || "[EVENTO]")}.</p>`],
      enlace ? `<p>La información se encuentra disponible en la intranet:<br><a href="${escapeHtml(enlace)}">${escapeHtml(enlace)}</a></p>` : "",
      ruta ? `<p>Los turnos también se encuentran disponibles en la siguiente ruta:<br>${escapeHtml(ruta)}</p>` : "",
      "<p>Agur bat.</p>"
    ].flat().filter(Boolean);
    preview.innerHTML = lines.join("");
  }

  function renderEspecialesRecipients() {
    const body = document.getElementById("especialesRecipientsBody");
    const warning = document.getElementById("especialesRecipientsWarning");
    if (!body || !warning) return;
    const items = getRecipients();
    const active = items.filter(item => item && item.active && isValidEmail(item.email));
    warning.style.display = active.length ? "none" : "block";
    body.innerHTML = items.length ? items.map((item, idx) => `
      <tr>
        <td>${escapeHtml(item.name || "")}</td>
        <td>${escapeHtml(item.email || "")}</td>
        <td>${item.active ? "Sí" : "No"}</td>
        <td><button type="button" class="secondary small" onclick="deleteEspecialRecipient(${idx})">Eliminar</button></td>
      </tr>
    `).join("") : '<tr><td colspan="4" class="muted">Sin destinatarios.</td></tr>';
  }

  function addEspecialRecipient() {
    const name = String(document.getElementById("especialRecipientName")?.value || "").trim();
    const email = String(document.getElementById("especialRecipientEmail")?.value || "").trim();
    const active = !!document.getElementById("especialRecipientActive")?.checked;
    if (!name) return alert("Debes indicar un nombre.");
    if (!isValidEmail(email)) return alert("El email no tiene un formato válido.");
    const items = getRecipients();
    items.push({ name, email, active });
    setRecipients(items);
    const nameInput = document.getElementById("especialRecipientName");
    const emailInput = document.getElementById("especialRecipientEmail");
    const activeInput = document.getElementById("especialRecipientActive");
    if (nameInput) nameInput.value = "";
    if (emailInput) emailInput.value = "";
    if (activeInput) activeInput.checked = true;
    renderEspecialesRecipients();
  }

  function deleteEspecialRecipient(index) {
    const items = getRecipients();
    if (!items[index]) return;
    items.splice(index, 1);
    setRecipients(items);
    renderEspecialesRecipients();
  }

  async function generateEspecialesDraft() {
    const active = getRecipients().filter(item => item && item.active && isValidEmail(item.email));
    if (!active.length) return alert("No hay destinatarios activos.");
    const evento = String(document.getElementById("especialesEvento")?.value || "").trim();
    const fecha = String(document.getElementById("especialesFecha")?.value || "").trim();
    const hora = String(document.getElementById("especialesHora")?.value || "").trim();
    const enlace = String(document.getElementById("especialesEnlace")?.value || "").trim();
    const ruta = String(document.getElementById("especialesRuta")?.value || "").trim();
    const subject = `Servicio Especial ${evento || ""}`.trim();
    const bodyParts = [
      "<p>Kaixo:</p>",
      `<p>Se adjuntan turnos de conducción para el servicio especial de ${escapeHtml(evento || "[EVENTO]")}${fecha || hora ? `, que tendrá lugar${fecha ? ` el ${escapeHtml(fecha)}` : ""}${hora ? ` a las ${escapeHtml(hora)}` : ""}` : ""}.</p>`,
      enlace ? `<p>La información se encuentra disponible en la intranet:<br><a href="${escapeHtml(enlace)}">${escapeHtml(enlace)}</a></p>` : "",
      ruta ? `<p>Los turnos también se encuentran disponibles en la siguiente ruta:<br>${escapeHtml(ruta)}</p>` : "",
      "<p>Agur bat.</p>"
    ];
    const htmlBody = bodyParts.filter(Boolean).join("");
    try {
      const result = await window.rrllOutlook.createDraft({ to: active.map(x => x.email).join(";"), cc: "", subject, htmlBody });
      if (!result || !result.ok) throw new Error(result && result.message ? result.message : "Outlook no disponible");
    } catch (error) {
      console.error("Error creando borrador Outlook:", error);
      alert("No se ha podido abrir Outlook. Revise que Outlook clásico esté instalado.");
    }
  }

  function clearEspecialesForm() {
    ["especialesEvento", "especialesFecha", "especialesHora", "especialesEnlace", "especialesRuta"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    renderEspecialesPreview();
  }

  function renderEspeciales() {
    renderEspecialesPreview();
    renderEspecialesRecipients();
  }

  function parseOutlookMsg(_file) {
    return { ok: false, pending: true };
  }

  window.renderEspeciales = renderEspeciales;
  window.addEspecialRecipient = addEspecialRecipient;
  window.deleteEspecialRecipient = deleteEspecialRecipient;
  window.generateEspecialesDraft = generateEspecialesDraft;
  window.clearEspecialesForm = clearEspecialesForm;
  window.renderEspecialesPreview = renderEspecialesPreview;
  window.parseOutlookMsg = parseOutlookMsg;
})();
