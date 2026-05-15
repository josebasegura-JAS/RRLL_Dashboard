// Gestor de Licencias sin sueldo y Excedencias.
// Flujo: pendiente de aprobar -> pendiente de firma -> vigente -> histórico por fecha fin.
(function () {
  'use strict';

  const KEY = 'rrll_licencias_excedencias';
  let activeLicenseId = null;

  function getLicencias() {
    const items = load(KEY, []);
    return Array.isArray(items) ? items : [];
  }

  function setLicencias(items) {
    save(KEY, Array.isArray(items) ? items : []);
  }

  function toggleLicenciaCreateForm(forceOpen) {
    const form = document.getElementById('licenciaCreateForm');
    if (!form) return;
    const open = typeof forceOpen === 'boolean' ? forceOpen : form.classList.contains('rrll-create-form-collapsed');
    form.classList.toggle('rrll-create-form-collapsed', !open);
    if (open) setTimeout(() => document.getElementById('newLicEmployeeNumber')?.focus(), 0);
  }


  function getPlantillaForLicencias() {
    try {
      if (typeof getPlantilla !== 'function') return [];
      const items = getPlantilla();
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  function normalizeLicenciaLookup(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function findLicenciaPlantillaByEmployeeNumber(value) {
    const target = String(value || '').trim();
    if (!target) return null;
    return getPlantillaForLicencias().find(person => String(person.employeeNumber || '').trim() === target) || null;
  }

  function fillLicenciaPerson(person, target = 'create') {
    if (!person) return;
    const employeeEl = document.getElementById(target === 'modal' ? 'licenseEditEmployeeNumber' : 'newLicEmployeeNumber');
    const nameEl = document.getElementById(target === 'modal' ? 'licenseEditName' : 'newLicName');
    if (employeeEl) employeeEl.value = person.employeeNumber || '';
    if (nameEl) nameEl.value = person.name || '';
    if (target === 'modal') hideLicenciaModalSuggestions();
    else hideLicenciaSuggestions();
  }

  function licenciaEmployeeNumberChanged() {
    const employeeEl = document.getElementById('newLicEmployeeNumber');
    if (!employeeEl) return;
    const person = findLicenciaPlantillaByEmployeeNumber(employeeEl.value);
    if (person) fillLicenciaPerson(person, 'create');
  }

  function licenciaModalEmployeeNumberChanged() {
    const employeeEl = document.getElementById('licenseEditEmployeeNumber');
    if (!employeeEl) return;
    const person = findLicenciaPlantillaByEmployeeNumber(employeeEl.value);
    if (person) fillLicenciaPerson(person, 'modal');
  }

  function hideLicenciaSuggestions() {
    const box = document.getElementById('licenciaPersonSuggestions');
    if (!box) return;
    box.classList.remove('open');
    box.innerHTML = '';
  }

  function hideLicenciaModalSuggestions() {
    const box = document.getElementById('licensePersonSuggestions');
    if (!box) return;
    box.classList.remove('open');
    box.innerHTML = '';
  }

  function hideLicenciaSuggestionsDelayed() {
    setTimeout(hideLicenciaSuggestions, 180);
  }

  function hideLicenciaModalSuggestionsDelayed() {
    setTimeout(hideLicenciaModalSuggestions, 180);
  }

  function renderLicenciaSuggestions(inputId, boxId, target) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(boxId);
    if (!input || !box) return;
    const query = normalizeLicenciaLookup(input.value);
    if (query.length < 2) {
      if (target === 'modal') hideLicenciaModalSuggestions();
      else hideLicenciaSuggestions();
      return;
    }
    const results = getPlantillaForLicencias()
      .filter(person => {
        const name = normalizeLicenciaLookup(person.name);
        const employee = normalizeLicenciaLookup(person.employeeNumber);
        return name.includes(query) || employee.includes(query);
      })
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' }))
      .slice(0, 8);

    if (!results.length) {
      box.innerHTML = '<div class="rrll-autocomplete-empty">Sin coincidencias en Plantilla</div>';
      box.classList.add('open');
      return;
    }

    const fn = target === 'modal' ? 'selectLicenciaModalPerson' : 'selectLicenciaPerson';
    box.innerHTML = results.map(person => `
      <button type="button" class="rrll-autocomplete-option" onmousedown="event.preventDefault(); ${fn}('${person.id}')">
        <strong>${escapeHtml(person.name || 'Sin nombre')}</strong>
        <span>Nº ${escapeHtml(person.employeeNumber || '')} · ${escapeHtml(person.job || 'Sin puesto')}</span>
      </button>
    `).join('');
    box.classList.add('open');
  }

  function licenciaNameAutocomplete() {
    renderLicenciaSuggestions('newLicName', 'licenciaPersonSuggestions', 'create');
  }

  function licenciaModalNameAutocomplete() {
    renderLicenciaSuggestions('licenseEditName', 'licensePersonSuggestions', 'modal');
  }

  function selectLicenciaPerson(personId) {
    const person = getPlantillaForLicencias().find(item => item.id === personId);
    if (person) fillLicenciaPerson(person, 'create');
  }

  function selectLicenciaModalPerson(personId) {
    const person = getPlantillaForLicencias().find(item => item.id === personId);
    if (person) fillLicenciaPerson(person, 'modal');
  }

  function normalizeEmployeeNumber(value) {
    return String(value || '').trim();
  }

  function compareByEmployeeNumber(a, b) {
    const aRaw = normalizeEmployeeNumber(a.employeeNumber);
    const bRaw = normalizeEmployeeNumber(b.employeeNumber);
    const aDigits = aRaw.replace(/\D/g, '');
    const bDigits = bRaw.replace(/\D/g, '');
    const aNum = Number(aDigits);
    const bNum = Number(bDigits);
    if (aDigits && bDigits && Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) return aNum - bNum;
    const byRaw = aRaw.localeCompare(bRaw, 'es', { numeric: true, sensitivity: 'base' });
    if (byRaw !== 0) return byRaw;
    return String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' });
  }

  function todayDateOnly() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  function parseDateOnly(value) {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDateInput(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function addYearsToDateInput(value, years) {
    const date = parseDateOnly(value);
    if (!date) return '';
    const next = new Date(date);
    next.setFullYear(next.getFullYear() + Number(years || 0));
    return formatDateInput(next);
  }

  function addMonthsToDateInput(value, months) {
    const date = parseDateOnly(value);
    if (!date) return '';
    const next = new Date(date);
    next.setMonth(next.getMonth() + Number(months || 0));
    return formatDateInput(next);
  }

  function daysBetweenDateInputs(startValue, endValue) {
    const start = parseDateOnly(startValue);
    const end = parseDateOnly(endValue);
    if (!start || !end) return null;
    return Math.round((end - start) / 86400000) + 1;
  }

  function isAldType(type) {
    return String(type || '').toLowerCase().includes('libre disposición') || String(type || '').toLowerCase().includes('libre disposicion');
  }

  function isLicenciaSinSueldoType(type) {
    return String(type || '').toLowerCase() === 'licencia sin sueldo';
  }

  function syncLicenciaEndDate(prefix) {
    const typeEl = document.getElementById(prefix === 'modal' ? 'licenseEditType' : 'newLicType');
    const startEl = document.getElementById(prefix === 'modal' ? 'licenseEditStartDate' : 'newLicStartDate');
    const endEl = document.getElementById(prefix === 'modal' ? 'licenseEditEndDate' : 'newLicEndDate');
    if (!typeEl || !startEl || !endEl) return;
    const ald = isAldType(typeEl.value);
    endEl.readOnly = ald;
    endEl.classList.toggle('readonly-autofill', ald);
    if (ald) endEl.value = startEl.value ? addYearsToDateInput(startEl.value, 5) : '';
  }

  function licenciaTypeChanged() {
    syncLicenciaEndDate('create');
  }

  function licenciaStartDateChanged() {
    syncLicenciaEndDate('create');
  }

  function licenciaModalTypeChanged() {
    syncLicenciaEndDate('modal');
  }

  function licenciaModalStartDateChanged() {
    syncLicenciaEndDate('modal');
  }

  function validateLicenseDates(type, startDate, endDate) {
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (!start || !end) return 'Revisa las fechas introducidas. Alguna no es válida.';
    if (end < start) return 'La fecha fin de permiso no puede ser anterior a la fecha de inicio.';
    if (isAldType(type)) {
      const expectedEnd = addYearsToDateInput(startDate, 5);
      if (endDate !== expectedEnd) return 'En Año de Libre Disposición, la fecha fin debe calcularse automáticamente a 5 años desde el inicio.';
      return '';
    }
    if (isLicenciaSinSueldoType(type)) {
      const days = daysBetweenDateInputs(startDate, endDate);
      const maxEnd = addMonthsToDateInput(startDate, 9);
      if (days !== null && days < 15) return 'La licencia sin sueldo debe tener una duración mínima de 15 días.';
      if (maxEnd && parseDateOnly(endDate) > parseDateOnly(maxEnd)) return 'La licencia sin sueldo no puede superar los 9 meses.';
    }
    return '';
  }

  function formatLicDate(value) {
    if (!value) return 'Sin fecha';
    const date = parseDateOnly(value);
    if (!date) return String(value);
    return date.toLocaleDateString('es-ES');
  }

  function isLicenseExpired(item) {
    if (!item || item.status !== 'active') return false;
    const end = parseDateOnly(item.endDate);
    if (!end) return false;
    return end < todayDateOnly();
  }

  function licenseDisplayStatus(item) {
    if (isLicenseExpired(item)) return 'Histórico';
    if (item.status === 'pending_signature') return 'Pendiente de firma';
    if (item.status === 'active') return 'Vigente';
    return 'Pendiente de aprobar';
  }

  function licenseYear(item) {
    const date = parseDateOnly(item.endDate) || parseDateOnly(item.startDate) || parseDateOnly(item.requestDate) || new Date();
    return date.getFullYear();
  }

  function splitLicencias() {
    const pending = [];
    const signature = [];
    const active = [];
    const history = [];

    getLicencias().forEach(item => {
      if (isLicenseExpired(item)) history.push(item);
      else if (item.status === 'pending_signature') signature.push(item);
      else if (item.status === 'active') active.push(item);
      else pending.push(item);
    });

    pending.sort(compareByEmployeeNumber);
    signature.sort(compareByEmployeeNumber);
    active.sort(compareByEmployeeNumber);
    history.sort((a, b) => licenseYear(b) - licenseYear(a) || compareByEmployeeNumber(a, b));
    return { pending, signature, active, history };
  }

  function getLicenciasByScope(scope) {
    const split = splitLicencias();
    if (scope === 'pending_signature') return { title: 'Licencias y excedencias pendientes de firma', filename: 'licencias-pendientes-firma', rows: split.signature };
    if (scope === 'active') return { title: 'Licencias y excedencias vigentes', filename: 'licencias-vigentes', rows: split.active };
    if (scope === 'history') return { title: 'Histórico de licencias y excedencias', filename: 'historico-licencias-excedencias', rows: split.history };
    return { title: 'Licencias y excedencias pendientes de aprobar', filename: 'licencias-pendientes-aprobar', rows: split.pending };
  }

  function refreshLicenciasDependents() {
    renderLicencias();
    if (typeof updateQuickCounts === 'function') updateQuickCounts();
    if (typeof renderHomeDashboard === 'function') renderHomeDashboard();
    if (typeof renderTrash === 'function') renderTrash();
  }

  function addLicencia() {
    const employeeEl = document.getElementById('newLicEmployeeNumber');
    const nameEl = document.getElementById('newLicName');
    const requestEl = document.getElementById('newLicRequestDate');
    const typeEl = document.getElementById('newLicType');
    const startEl = document.getElementById('newLicStartDate');
    const endEl = document.getElementById('newLicEndDate');
    if (!employeeEl || !nameEl || !requestEl || !typeEl || !startEl || !endEl) return;

    const employeeNumber = normalizeEmployeeNumber(employeeEl.value);
    const matchedPerson = findLicenciaPlantillaByEmployeeNumber(employeeNumber);
    if (matchedPerson && !String(nameEl.value || '').trim()) nameEl.value = matchedPerson.name || '';
    const name = String(nameEl.value || '').trim();
    const requestDate = requestEl.value;
    const type = typeEl.value || 'Licencia sin sueldo';
    const startDate = startEl.value;
    if (isAldType(type) && startDate) endEl.value = addYearsToDateInput(startDate, 5);
    const endDate = endEl.value;

    if (!employeeNumber || !name || !requestDate || !startDate || !endDate) {
      alert('Introduce Nº empleado, nombre, fecha de solicitud, inicio y fin del permiso.');
      return;
    }
    if (typeof isValidDateInput === 'function' && (![requestDate, startDate, endDate].every(isValidDateInput))) {
      alert('Revisa las fechas introducidas. Alguna no es válida.');
      return;
    }
    const dateValidation = validateLicenseDates(type, startDate, endDate);
    if (dateValidation) {
      alert(dateValidation);
      return;
    }

    const now = new Date().toISOString();
    const id = (window.crypto && typeof window.crypto.randomUUID === 'function') ? window.crypto.randomUUID() : `lic-${Date.now()}`;
    const items = getLicencias();
    items.push({ id, employeeNumber, name, requestDate, type, startDate, endDate, status: 'pending_approval', updates: [], createdAt: now, updatedAt: now });
    setLicencias(items);

    employeeEl.value = '';
    nameEl.value = '';
    requestEl.value = '';
    typeEl.value = 'Licencia sin sueldo';
    startEl.value = '';
    endEl.value = '';
    syncLicenciaEndDate('create');
    toggleLicenciaCreateForm(false);
    refreshLicenciasDependents();
  }

  function findLicencia(id) {
    return getLicencias().find(item => item.id === id) || null;
  }

  function updateLicencia(id, updater) {
    const items = getLicencias();
    const index = items.findIndex(item => item.id === id);
    if (index < 0) return null;
    const next = { ...items[index] };
    updater(next);
    next.updatedAt = new Date().toISOString();
    items[index] = next;
    setLicencias(items);
    return next;
  }

  function appendLicenseUpdate(item, text, action) {
    const value = String(text || '').trim();
    if (!value && !action) return;
    item.updates = Array.isArray(item.updates) ? item.updates : [];
    item.updates.push({
      id: (window.crypto && typeof window.crypto.randomUUID === 'function') ? window.crypto.randomUUID() : `lic-upd-${Date.now()}`,
      text: value || action,
      action: action || '',
      createdAt: new Date().toISOString()
    });
  }

  function deleteLicencia(id) {
    const items = getLicencias();
    const item = items.find(i => i.id === id);
    if (item && typeof moveToTrash === 'function') moveToTrash('licencias', item);
    setLicencias(items.filter(i => i.id !== id));
    refreshLicenciasDependents();
  }

  function updatesHtml(item) {
    const updates = Array.isArray(item.updates) ? item.updates : [];
    if (!updates.length) return '<p class="muted">No hay actualizaciones anteriores.</p>';
    return updates.map(update => `<div class="update-line"><strong>${escapeHtml(formatLicDate((update.createdAt || '').slice(0, 10)))}</strong>: ${escapeHtml(update.text || update.action || '')}</div>`).join('');
  }

  function openLicenciaModal(id) {
    const item = findLicencia(id);
    if (!item) return;
    activeLicenseId = id;
    const modal = document.getElementById('licenseUpdateModal');
    const title = document.getElementById('licenseModalTitle');
    const meta = document.getElementById('licenseModalMeta');
    const updates = document.getElementById('licenseExistingUpdates');
    const text = document.getElementById('licenseUpdateText');
    const accept = document.getElementById('licenseAcceptButton');
    const finalize = document.getElementById('licenseFinalizeButton');
    const employeeInput = document.getElementById('licenseEditEmployeeNumber');
    const nameInput = document.getElementById('licenseEditName');
    const requestInput = document.getElementById('licenseEditRequestDate');
    const typeInput = document.getElementById('licenseEditType');
    const startInput = document.getElementById('licenseEditStartDate');
    const endInput = document.getElementById('licenseEditEndDate');
    if (title) title.textContent = `${item.type || 'Solicitud'} · ${item.name || 'Sin nombre'}`;
    if (meta) meta.textContent = `Nº ${item.employeeNumber || ''} · ${licenseDisplayStatus(item)} · ${formatLicDate(item.startDate)} - ${formatLicDate(item.endDate)}`;
    if (employeeInput) employeeInput.value = item.employeeNumber || '';
    if (nameInput) nameInput.value = item.name || '';
    if (requestInput) requestInput.value = item.requestDate || '';
    if (typeInput) typeInput.value = item.type || 'Licencia sin sueldo';
    if (startInput) startInput.value = item.startDate || '';
    if (endInput) endInput.value = item.endDate || '';
    syncLicenciaEndDate('modal');
    if (updates) updates.innerHTML = updatesHtml(item);
    if (text) text.value = '';
    if (accept) accept.style.display = item.status === 'pending_approval' ? 'inline-flex' : 'none';
    if (finalize) finalize.style.display = item.status === 'pending_signature' ? 'inline-flex' : 'none';
    hideLicenciaModalSuggestions();
    if (modal) modal.classList.add('open');
  }

  function closeLicenciaModal() {
    activeLicenseId = null;
    hideLicenciaModalSuggestions();
    const modal = document.getElementById('licenseUpdateModal');
    if (modal) modal.classList.remove('open');
  }

  function readLicenseModalFields() {
    const employeeNumber = normalizeEmployeeNumber(document.getElementById('licenseEditEmployeeNumber')?.value || '');
    const name = String(document.getElementById('licenseEditName')?.value || '').trim();
    const requestDate = document.getElementById('licenseEditRequestDate')?.value || '';
    const type = document.getElementById('licenseEditType')?.value || 'Licencia sin sueldo';
    const startDate = document.getElementById('licenseEditStartDate')?.value || '';
    const endEl = document.getElementById('licenseEditEndDate');
    if (isAldType(type) && startDate && endEl) endEl.value = addYearsToDateInput(startDate, 5);
    const endDate = endEl?.value || '';
    if (!employeeNumber || !name || !requestDate || !startDate || !endDate) {
      alert('Introduce Nº empleado, nombre, fecha de solicitud, inicio y fin del permiso.');
      return null;
    }
    if (typeof isValidDateInput === 'function' && (![requestDate, startDate, endDate].every(isValidDateInput))) {
      alert('Revisa las fechas introducidas. Alguna no es válida.');
      return null;
    }
    const dateValidation = validateLicenseDates(type, startDate, endDate);
    if (dateValidation) {
      alert(dateValidation);
      return null;
    }
    return { employeeNumber, name, requestDate, type, startDate, endDate };
  }

  function applyLicenseModalFields(item) {
    const values = readLicenseModalFields();
    if (!values) return false;
    Object.assign(item, values);
    return true;
  }

  function saveLicenciaUpdateOnly() {
    if (!activeLicenseId) return;
    const text = document.getElementById('licenseUpdateText');
    let ok = true;
    updateLicencia(activeLicenseId, item => {
      ok = applyLicenseModalFields(item);
      if (ok) appendLicenseUpdate(item, text ? text.value : '', '');
    });
    if (!ok) return;
    closeLicenciaModal();
    refreshLicenciasDependents();
  }

  function acceptLicenciaFromModal() {
    if (!activeLicenseId) return;
    const text = document.getElementById('licenseUpdateText');
    let ok = true;
    updateLicencia(activeLicenseId, item => {
      ok = applyLicenseModalFields(item);
      if (!ok) return;
      appendLicenseUpdate(item, text ? text.value : '', 'Aceptada y pasada a pendiente de firma');
      item.status = 'pending_signature';
    });
    if (!ok) return;
    closeLicenciaModal();
    refreshLicenciasDependents();
  }

  function finalizeLicenciaFromModal() {
    if (!activeLicenseId) return;
    const text = document.getElementById('licenseUpdateText');
    let ok = true;
    updateLicencia(activeLicenseId, item => {
      ok = applyLicenseModalFields(item);
      if (!ok) return;
      appendLicenseUpdate(item, text ? text.value : '', 'Solicitud finalizada y pasada a vigente');
      item.status = 'active';
    });
    if (!ok) return;
    closeLicenciaModal();
    refreshLicenciasDependents();
  }

  function deleteLicenciaFromModal() {
    if (!activeLicenseId) return;
    if (!confirm('La solicitud se moverá a la papelera. ¿Continuar?')) return;
    const id = activeLicenseId;
    closeLicenciaModal();
    deleteLicencia(id);
  }

  function typeBadgeClass(type) {
    if (isAldType(type)) return 'success';
    return String(type || '').toLowerCase().includes('exced') ? 'warning' : 'info';
  }

  function rowHtml(item) {
    return `
      <tr id="rrll-lic-${item.id}" class="rrll-pro-row licencias-row" ondblclick="openLicenciaModal('${item.id}')" title="Doble clic para actualizar">
        <td><strong>${escapeHtml(item.employeeNumber || '')}</strong></td>
        <td class="rrll-pro-main-cell"><div class="rrll-pro-title">${escapeHtml(item.name || 'Sin nombre')}</div><span class="rrll-pro-subtitle">Solicitud: ${escapeHtml(formatLicDate(item.requestDate))}</span></td>
        <td><span class="rrll-status-pill ${typeBadgeClass(item.type)}">${escapeHtml(item.type || '')}</span></td>
        <td><span>${escapeHtml(formatLicDate(item.startDate))}</span><br><span class="rrll-pro-subtitle">hasta ${escapeHtml(formatLicDate(item.endDate))}</span></td>
      </tr>
    `;
  }

  function historyHtml(items) {
    if (!items.length) return '';
    const grouped = new Map();
    items.forEach(item => {
      const year = licenseYear(item);
      if (!grouped.has(year)) grouped.set(year, []);
      grouped.get(year).push(item);
    });
    return Array.from(grouped.keys()).sort((a, b) => b - a).map(year => {
      const rows = grouped.get(year).sort(compareByEmployeeNumber).map(rowHtml).join('');
      const safeYear = String(year).replace(/[^a-zA-Z0-9_-]/g, '-');
      return `
        <details class="licencias-year" id="licencias-year-${safeYear}" open>
          <summary><strong>${year}</strong><span>${grouped.get(year).length} registros</span></summary>
          <div class="rrll-pro-table-wrap"><table class="rrll-pro-table licencias-table"><thead><tr><th>Nº</th><th>Nombre</th><th>Tipo</th><th>Fechas</th></tr></thead><tbody>${rows}</tbody></table></div>
        </details>
      `;
    }).join('');
  }

  function renderLicencias() {
    const { pending, signature, active, history } = splitLicencias();
    const maps = [
      ['licPendingTableBody', pending, 'licPendingEmpty'],
      ['licSignatureTableBody', signature, 'licSignatureEmpty'],
      ['licActiveTableBody', active, 'licActiveEmpty']
    ];
    maps.forEach(([bodyId, rows, emptyId]) => {
      const body = document.getElementById(bodyId);
      const empty = document.getElementById(emptyId);
      if (body) body.innerHTML = rows.map(rowHtml).join('');
      if (empty) empty.style.display = rows.length ? 'none' : 'block';
    });
    const historyList = document.getElementById('licHistoryList');
    const historyEmpty = document.getElementById('licHistoryEmpty');
    if (historyList) historyList.innerHTML = historyHtml(history);
    if (historyEmpty) historyEmpty.style.display = history.length ? 'none' : 'block';

    const countPending = document.getElementById('count-lic-pending');
    const countSignature = document.getElementById('count-lic-signature');
    const countActive = document.getElementById('count-lic-active');
    const summary = document.getElementById('summary-count-licencias');
    if (countPending) countPending.textContent = pending.length;
    if (countSignature) countSignature.textContent = signature.length;
    if (countActive) countActive.textContent = active.length;
    if (summary) summary.textContent = `${pending.length} aprobar · ${signature.length} firma · ${active.length} vigentes`;
  }

  function printLicencias(scope) {
    const data = getLicenciasByScope(scope);
    const rowsHtml = data.rows.length ? data.rows.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${htmlEscapeForPrint(item.employeeNumber || '')}</td>
        <td>${htmlEscapeForPrint(item.name || '')}</td>
        <td>${htmlEscapeForPrint(item.type || '')}</td>
        <td>${htmlEscapeForPrint(formatLicDate(item.requestDate))}</td>
        <td>${htmlEscapeForPrint(formatLicDate(item.startDate))} - ${htmlEscapeForPrint(formatLicDate(item.endDate))}</td>
        <td>${htmlEscapeForPrint(licenseDisplayStatus(item))}</td>
      </tr>
    `).join('') : '<tr><td colspan="7">Sin registros.</td></tr>';
    const html = `<h1>${htmlEscapeForPrint(data.title)}</h1><div class="date">Generado: ${new Date().toLocaleString('es-ES')}</div><table><thead><tr><th>#</th><th>Nº empleado</th><th>Nombre</th><th>Tipo</th><th>Fecha solicitud</th><th>Permiso</th><th>Estado</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
    if (typeof openPrintPreviewWithHtml === 'function') openPrintPreviewWithHtml(html);
  }

  function exportLicenciasExcel(scope) {
    const data = getLicenciasByScope(scope);
    if (typeof exportExcelData !== 'function') return;
    exportExcelData({
      title: data.title,
      filename: data.filename,
      headers: ['Nº empleado', 'Nombre', 'Tipo solicitud', 'Fecha solicitud', 'Fecha inicio permiso', 'Fecha fin permiso', 'Estado'],
      rows: data.rows.map(item => [item.employeeNumber || '', item.name || '', item.type || '', formatLicDate(item.requestDate), formatLicDate(item.startDate), formatLicDate(item.endDate), licenseDisplayStatus(item)])
    });
  }

  window.LicenciasModule = { getLicencias, setLicencias, toggleLicenciaCreateForm, licenciaTypeChanged, licenciaStartDateChanged, licenciaModalTypeChanged, licenciaModalStartDateChanged, addLicencia, deleteLicencia, renderLicencias, openLicenciaModal, closeLicenciaModal, saveLicenciaUpdateOnly, acceptLicenciaFromModal, finalizeLicenciaFromModal, deleteLicenciaFromModal, printLicencias, exportLicenciasExcel, isLicenseExpired, licenseDisplayStatus, licenciaEmployeeNumberChanged, licenciaNameAutocomplete, selectLicenciaPerson, licenciaModalEmployeeNumberChanged, licenciaModalNameAutocomplete, selectLicenciaModalPerson };
  window.getLicencias = getLicencias;
  window.setLicencias = setLicencias;
  window.toggleLicenciaCreateForm = toggleLicenciaCreateForm;
  window.licenciaTypeChanged = licenciaTypeChanged;
  window.licenciaStartDateChanged = licenciaStartDateChanged;
  window.licenciaModalTypeChanged = licenciaModalTypeChanged;
  window.licenciaModalStartDateChanged = licenciaModalStartDateChanged;
  window.addLicencia = addLicencia;
  window.deleteLicencia = deleteLicencia;
  window.renderLicencias = renderLicencias;
  window.openLicenciaModal = openLicenciaModal;
  window.closeLicenciaModal = closeLicenciaModal;
  window.saveLicenciaUpdateOnly = saveLicenciaUpdateOnly;
  window.acceptLicenciaFromModal = acceptLicenciaFromModal;
  window.finalizeLicenciaFromModal = finalizeLicenciaFromModal;
  window.deleteLicenciaFromModal = deleteLicenciaFromModal;
  window.printLicencias = printLicencias;
  window.exportLicenciasExcel = exportLicenciasExcel;
  window.isLicenseExpired = isLicenseExpired;
  window.licenseDisplayStatus = licenseDisplayStatus;
  window.licenciaEmployeeNumberChanged = licenciaEmployeeNumberChanged;
  window.licenciaNameAutocomplete = licenciaNameAutocomplete;
  window.hideLicenciaSuggestionsDelayed = hideLicenciaSuggestionsDelayed;
  window.selectLicenciaPerson = selectLicenciaPerson;
  window.licenciaModalEmployeeNumberChanged = licenciaModalEmployeeNumberChanged;
  window.licenciaModalNameAutocomplete = licenciaModalNameAutocomplete;
  window.hideLicenciaModalSuggestionsDelayed = hideLicenciaModalSuggestionsDelayed;
  window.selectLicenciaModalPerson = selectLicenciaModalPerson;
})();
