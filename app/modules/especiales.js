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

  function createEspecialRecipientId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `esp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function getActiveRecipients() {
    return getRecipients().filter(item => item && isValidEmail(item.email));
  }

  function buildEspecialesBullet(payload = {}) {
    const evento = String(payload.evento || "").trim();
    const fecha = String(payload.fecha || "").trim();
    const hora = normalizeTimeInput(payload.hora || "");
    const dateParts = getDateParts(fecha);
    const year = dateParts.year || detectYearFromText(`${evento} ${fecha}`) || String(new Date().getFullYear());
    const diaSemana = dateParts.weekDay || "[DIA_SEMANA]";
    const fechaLarga = dateParts.longDate || "[FECHA_LARGA]";
    return `BEC Concierto ${evento || "[EVENTO]"}, ${diaSemana} ${fechaLarga} de ${year} a las ${hora || "[HORA]"}h`;
  }

  function buildEspecialesSubject(payload = {}) {
    return `Servicio Especial ${buildEspecialesBullet(payload)}`.trim();
  }

  function buildEspecialesHtmlBody(payload = {}) {
    const evento = String(payload.evento || "").trim();
    const fecha = String(payload.fecha || "").trim();
    const hora = normalizeTimeInput(payload.hora || "");
    const enlace = String(payload.enlace || "").trim();
    const dateParts = getDateParts(fecha);
    const year = dateParts.year || detectYearFromText(`${evento} ${fecha}`) || String(new Date().getFullYear());
    const diaSemana = dateParts.weekDay || "[DIA_SEMANA]";
    const fechaLarga = dateParts.longDate || "[FECHA_LARGA]";
    const ruta = String(payload.ruta || "").trim() || buildTurnosPath(year);

    return [
      '<div style="font-family: Verdana, Arial, sans-serif; font-size: 11pt;">',
      "<p>Kaixo,</p>",
      "<p>Adjunto acceso a los turnos de conducción de Servicio Especial donde ya están disponibles en la intranet los turnos de conducción de:</p>",
      `<p><strong>• ${escapeHtml(buildEspecialesBullet(payload))}</strong></p>`,
      enlace ? `<p><a href="${escapeHtml(enlace)}">${escapeHtml(enlace)}</a></p>` : "<p>[ENLACE]</p>",
      `<p>Los turnos están en: Las personas -> turnos -> trenes -> Invierno -> Servicios Especiales -> ${escapeHtml(year)}</p>`,
      "<p>Así mismo, tenéis los turnos de MTEs en Excel con la tabla de % Parada SIN del servicio especial a realizar. Se encuentra en el siguiente directorio común que tenéis acceso:</p>",
      `<p>${escapeHtml(ruta)}</p>`,
      "<p>Ondo izan</p>",
      "</div>"
    ].join("");
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



  function setOutlookStatus(message, tone) {
    const status = document.getElementById("especialesOutlookStatus");
    if (!status) return;
    status.textContent = message || "";
    status.className = tone === "error" ? "muted danger" : tone === "success" ? "muted ok" : "muted";
  }

  function getDraftAvailability() {
    const active = getActiveRecipients();
    const data = collectServiceData();
    if (!active.length) return { ok: false, reason: "faltan destinatarios con email válido" };
    if (!data.evento) return { ok: false, reason: "falta evento" };
    if (!window.rrllOutlook || typeof window.rrllOutlook.createDraft !== "function") return { ok: false, reason: "falta API Outlook" };
    return { ok: true, active, data };
  }

  function syncDraftButtonState() {
    const button = document.getElementById("especialesGenerateDraftBtn");
    const warning = document.getElementById("especialesRecipientsWarning");
    if (!button || !warning) return;
    const availability = getDraftAvailability();
    button.disabled = !availability.ok;
    warning.style.display = availability.ok ? "none" : "block";
    warning.textContent = availability.ok ? "" : `No disponible: ${availability.reason}.`;
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
    const button = document.getElementById("especialRecipientSubmitBtn");
    if (nameInput) nameInput.value = "";
    if (emailInput) emailInput.value = "";
    if (button) button.textContent = "Añadir destinatario";
    editingRecipientId = null;
  }

  function editEspecialRecipient(id) {
    const item = getRecipients().find(entry => entry && entry.id === id);
    if (!item) return;
    editingRecipientId = id;
    const nameInput = document.getElementById("especialRecipientName");
    const emailInput = document.getElementById("especialRecipientEmail");
    const button = document.getElementById("especialRecipientSubmitBtn");
    if (nameInput) nameInput.value = item.name || "";
    if (emailInput) emailInput.value = item.email || "";
    if (button) button.textContent = "Guardar cambios";
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
        <td>
          <button type="button" class="secondary small" onclick="editEspecialRecipient('${escapeHtml(itemId)}')">Editar</button>
          <button type="button" class="secondary small" onclick="deleteEspecialRecipient('${escapeHtml(itemId)}')">Eliminar</button>
        </td>
      </tr>`;
    }).join("") : '<tr><td colspan="3" class="muted">Sin destinatarios.</td></tr>';

    syncDraftButtonState();
  }

  async function addEspecialRecipient() {
    const name = String(document.getElementById("especialRecipientName")?.value || "").trim();
    const email = String(document.getElementById("especialRecipientEmail")?.value || "").trim();

    if (!name) return alert("Debes indicar un nombre.");
    if (!isValidEmail(email)) return alert("El email no tiene un formato válido.");

    const normalized = normalizeEmail(email);
    const items = getRecipients();
    const duplicated = items.find(item => item && normalizeEmail(item.email) === normalized && item.id !== editingRecipientId);
    if (duplicated) return alert("Ya existe un destinatario con ese email.");

    const next = editingRecipientId
      ? items.map(item => item && item.id === editingRecipientId ? { ...item, name, email } : item)
      : [...items, { id: createEspecialRecipientId(), name, email }];

    try {
      const saveResult = setRecipients(next);
      if (saveResult && typeof saveResult.then === "function") {
        await saveResult;
      }
      resetRecipientForm();
      renderEspecialesRecipients();
      renderEspecialesPreview();
      syncDraftButtonState();
    } catch (error) {
      console.error("Error guardando destinatario Especiales:", error);
      alert("No se ha podido guardar el destinatario.");
    }
  }

  function deleteEspecialRecipient(id) {
    const next = getRecipients().filter(item => item && item.id !== id);
    setRecipients(next);
    if (editingRecipientId === id) resetRecipientForm();
    renderEspecialesRecipients();
    renderEspecialesPreview();
  }

  async function generateEspecialesDraft() {
    console.log("[Especiales] Click generar borrador");
    const availability = getDraftAvailability();
    if (!availability.ok) {
      setOutlookStatus(`No se puede generar el borrador: ${availability.reason}.`, "error");
      syncDraftButtonState();
      return;
    }

    const button = document.getElementById("especialesGenerateDraftBtn");
    const previousText = button ? button.textContent : "";
    if (button) {
      button.disabled = true;
      button.textContent = "Generando borrador en Outlook...";
    }

    try {
      setOutlookStatus("Preparando borrador...");
      const payload = {
        to: availability.active.map(x => x.email).join(";"),
        cc: "",
        subject: buildEspecialesSubject(availability.data),
        htmlBody: buildEspecialesHtmlBody(availability.data)
      };
      setOutlookStatus("Llamando a Outlook...");
      const result = await window.rrllOutlook.createDraft(payload);
      if (!result || !result.ok) throw new Error(result && result.message ? result.message : "Outlook no disponible");
      setOutlookStatus("Borrador abierto en Outlook", "success");
    } catch (error) {
      console.error("Error creando borrador Outlook:", error);
      setOutlookStatus(`Error al abrir Outlook: ${error && error.message ? error.message : "error desconocido"}`, "error");
    } finally {
      if (button) button.textContent = previousText || "Generar borrador en Outlook";
      syncDraftButtonState();
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
    const iso = v.match(/\b(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})\b/);
    if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
    const es = v.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/);
    if (es) {
      const day = es[1].padStart(2, "0");
      const month = es[2].padStart(2, "0");
      const year = es[3].length === 2 ? `20${es[3]}` : es[3];
      return `${year}-${month}-${day}`;
    }
    const months = {
      enero: "01", febrero: "02", marzo: "03", abril: "04", mayo: "05", junio: "06",
      julio: "07", agosto: "08", septiembre: "09", setiembre: "09", octubre: "10", noviembre: "11", diciembre: "12"
    };
    const longEs = v.match(/(?:\b(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b\s+)?(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{2,4})/i);
    if (!longEs) return "";
    const day = longEs[1].padStart(2, "0");
    const monthName = String(longEs[2] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const month = months[monthName];
    if (!month) return "";
    const year = longEs[3].length === 2 ? `20${longEs[3]}` : longEs[3];
    return `${year}-${month}-${day}`;
  }
  function getDateParts(isoDate) {
    const v = String(isoDate || "").trim();
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return { year: "", weekDay: "", longDate: "" };
    const year = Number(m[1]); const month = Number(m[2]); const day = Number(m[3]);
    const d = new Date(Date.UTC(year, month - 1, day));
    const days = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
    const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    return { year: String(year), weekDay: days[d.getUTCDay()], longDate: `${String(day).padStart(2, "0")} DE ${months[month - 1]}` };
  }

  function normalizeTimeInput(raw) {
    const m = String(raw || "").trim().match(/\b(\d{1,2})\s*[:.]\s*(\d{2})\s*h?\b/i);
    if (!m) return "";
    return `${m[1].padStart(2, "0")}:${m[2]}`;
  }
  function detectYearFromText(text) {
    const m = String(text || "").match(/\b(20\d{2})\b/);
    if (m) return m[1];
    const m2 = String(text || "").match(/\b\d{1,2}[\/.-]\d{1,2}[\/.-](\d{2})\b/);
    return m2 ? `20${m2[1]}` : "";
  }
  function buildTurnosPath(year) {
    const y = String(year || "").trim() || String(new Date().getFullYear());
    return `G:\\DC\\PAS_TURNOS_RRLL\\${y}\\TURNOS`;
  }
  function decodeMimeWords(value) {
    let text = String(value || "");
    const normalized = text.replace(/=\?iso[\s_-]*8859[\s_-]*1\?/gi, "=?iso-8859-1?");

    function decodeBytesToText(bytes, charset) {
      const normalizedCharset = charset.includes("8859-1") ? "iso-8859-1" : "utf-8";
      try {
        return new TextDecoder(normalizedCharset).decode(bytes);
      } catch (_e) {
        return new TextDecoder("utf-8").decode(bytes);
      }
    }

    function decodeQBytes(content) {
      const replaced = String(content || "").replace(/_/g, " ");
      const bytes = [];
      for (let i = 0; i < replaced.length; i += 1) {
        if (replaced[i] === "=" && /[0-9A-Fa-f]{2}/.test(replaced.slice(i + 1, i + 3))) {
          bytes.push(parseInt(replaced.slice(i + 1, i + 3), 16));
          i += 2;
        } else {
          bytes.push(replaced.charCodeAt(i) & 0xff);
        }
      }
      return new Uint8Array(bytes);
    }

    function decodeBase64Bytes(content) {
      const binary = atob(String(content || "").replace(/\s+/g, ""));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i) & 0xff;
      return bytes;
    }

    text = normalized.replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, (_all, charsetRaw, encRaw, contentRaw) => {
      const charset = String(charsetRaw || "").trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "-");
      const enc = String(encRaw || "").toUpperCase();
      const content = String(contentRaw || "");
      try {
        if (enc === "Q") return decodeBytesToText(decodeQBytes(content), charset);
        if (enc === "B") return decodeBytesToText(decodeBase64Bytes(content), charset);
      } catch (_e) {}
      return content.replace(/_/g, " ");
    });
    return text.replace(/\?=Q$/i, "").trim();
  }

  function stripHtmlToText(html) {
    return String(html || "")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanEventFromSubject(subject) {
    return String(subject || "")
      .replace(/^\s*bec\b/gi, " ")
      .replace(/\b(?:servicio\s+especial|concierto|evento)\b/gi, " ")
      .replace(/\b(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/gi, " ")
      .replace(/\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/g, " ")
      .replace(/\b\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{2,4}\b/gi, " ")
      .replace(/\b\d{1,2}(?::|\.)\d{2}\s*h?\b/gi, " ")
      .replace(/[|,\-–—]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function detectAutoFields(text, subject) {
    const source = String(text || "");
    const eventMatch = source.match(/(?:servicio\s+especial|concierto|evento)\s*[:\-]?\s*([^\n\r]{4,120})/i);
    const dateMatch = source.match(/(?:\b(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b\s*)?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{2,4})/i);
    const timeMatch = source.match(/\b(\d{1,2}(?::|\.)\d{2}\s*h?)\b/i);
    const urlMatch = source.match(/\bhttps?:\/\/[^\s<>"']+/i) || source.match(/\b(?:intranet|www\.)[^\s<>"']+/i);
    const uncMatch = source.match(/(?:[A-Za-z]:\\|\\\\)[^\n\r;,"<>]+/);
    const fallbackEvent = cleanEventFromSubject(subject);
    return {
      evento: eventMatch ? cleanEventFromSubject(eventMatch[1]) : fallbackEvent,
      fecha: dateMatch ? normalizeDateInput(dateMatch[1]) : "",
      hora: timeMatch ? normalizeTimeInput(timeMatch[1]) : "",
      enlace: urlMatch ? urlMatch[0].trim() : "",
      ruta: uncMatch ? uncMatch[0].trim() : ""
    };
  }

  async function parseOutlookMsg(file) {
    if (!file || !/\.msg$/i.test(file.name || "")) {
      return { ok: false, message: "Selecciona un archivo .msg válido." };
    }
    try {
      if (!window.rrllMsg || typeof window.rrllMsg.parseOutlookMsg !== "function") {
        return { ok: false, message: "API de importación no disponible." };
      }
      const buffer = await file.arrayBuffer();
      const parsed = await window.rrllMsg.parseOutlookMsg(buffer);
      if (!parsed || !parsed.ok) {
        return { ok: false, message: parsed && parsed.message ? parsed.message : "No se ha podido importar el mensaje .msg." };
      }
      const data = parsed.data || {};
      const subject = decodeMimeWords(data.subject || "");
      const body = decodeMimeWords(data.body || "");
      const htmlBody = decodeMimeWords(data.htmlBody || data.bodyHTML || data.html || "");
      const senderName = String(data.senderName || "").trim();
      const senderEmail = String(data.senderEmail || "").trim();
      const date = normalizeDateInput(data.date || data.messageDeliveryTime || data.deliveryTime || data.creationTime || "");
      const textForDetection = `${subject}\n${body}\n${stripHtmlToText(htmlBody)}`;
      const auto = detectAutoFields(textForDetection, subject);
      const hasMainData = !!(auto.evento && auto.fecha && auto.hora);
      const hasSomeMainData = [auto.evento, auto.fecha, auto.hora].filter(Boolean).length > 0;
      return {
        ok: !!(subject || body || htmlBody),
        hasMainData,
        partial: !hasMainData && hasSomeMainData,
        data: { subject, body, htmlBody, senderName, senderEmail, date, ...auto }
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
      setMsgStatus(parsed.message || "No se ha podido interpretar el mensaje.", "error");
      return;
    }
    const data = parsed.data || {};
    const setValue = (id, value) => {
      const input = document.getElementById(id);
      if (input && value) input.value = value;
    };
    setValue("especialesEvento", data.evento || data.subject);
    setValue("especialesFecha", data.fecha);
    setValue("especialesHora", normalizeTimeInput(data.hora));
    setValue("especialesEnlace", data.enlace);
    setValue("especialesRuta", data.ruta || buildTurnosPath(detectYearFromText(`${data.subject} ${data.fecha}`)));
    renderEspecialesPreview();
    if (parsed.hasMainData) {
      setMsgStatus("Mensaje importado correctamente");
    } else if (parsed.partial) {
      setMsgStatus("Mensaje importado parcialmente. Revisa los campos antes de generar el borrador.", "error");
    } else {
      setMsgStatus("No se ha podido interpretar el mensaje.", "error");
    }
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
      if (selectedMsgFile) importSelectedMsg();
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
      importSelectedMsg();
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
