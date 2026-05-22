// Gestor de Vinculograma.
// Registro simple con vigencia automática a 3 años desde la fecha de solicitud.
(function () {
  'use strict';

  let editingVinculogramaId = null;

  function getVinculogramas() {
    const items = load('rrll_vinculogramas', []);
    return Array.isArray(items) ? items : [];
  }

  function setVinculogramas(items) {
    save('rrll_vinculogramas', Array.isArray(items) ? items : []);
  }

  function toggleVinculogramaCreateForm(forceOpen) {
    const form = document.getElementById('vinculogramaCreateForm');
    if (!form) return;
    const open = typeof forceOpen === 'boolean' ? forceOpen : form.classList.contains('rrll-create-form-collapsed');
    form.classList.toggle('rrll-create-form-collapsed', !open);
    if (open) setTimeout(() => document.getElementById('newVincEmployeeNumber')?.focus(), 0);
  }

  function isVinculogramaExpiredColumnOpen() {
    try { return localStorage.getItem('rrll_vinculograma_expired_open') === '1'; } catch { return false; }
  }

  function setVinculogramaExpiredColumnOpen(open) {
    try { localStorage.setItem('rrll_vinculograma_expired_open', open ? '1' : '0'); } catch {}
    const column = document.getElementById('vincExpiredColumn');
    const button = document.getElementById('vincExpiredToggleButton');
    if (column) column.classList.toggle('vinculograma-collapsed', !open);
    if (button) button.textContent = open ? 'Ocultar' : 'Mostrar';
  }

  function toggleVinculogramaExpiredColumn() {
    setVinculogramaExpiredColumnOpen(!isVinculogramaExpiredColumnOpen());
  }


  function getPlantillaForVinculograma() {
    try {
      if (typeof getPlantilla !== 'function') return [];
      const items = getPlantilla();
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  function vinculogramaPersonFullName(person) {
    if (typeof getPlantillaNombreCompleto === 'function') return getPlantillaNombreCompleto(person);
    if (!person || typeof person !== 'object') return '';
    const legacyName = String(person.name || person.nombre || '').trim();
    const legacyLastName = String(person.lastName || person.apellidos || '').trim();
    return `${legacyName} ${legacyLastName}`.trim() || legacyName;
  }

  function normalizeVincLookup(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function findVincPlantillaByEmployeeNumber(value) {
    const target = String(value || '').trim();
    if (!target) return null;
    return getPlantillaForVinculograma().find(person => String(person.employeeNumber || '').trim() === target) || null;
  }

  function fillVinculogramaPerson(person) {
    if (!person) return;
    const employeeEl = document.getElementById('newVincEmployeeNumber');
    const nameEl = document.getElementById('newVincName');
    if (employeeEl) employeeEl.value = person.employeeNumber || '';
    if (nameEl) nameEl.value = vinculogramaPersonFullName(person) || '';
    hideVinculogramaSuggestions();
  }

  function vinculogramaEmployeeNumberChanged() {
    const employeeEl = document.getElementById('newVincEmployeeNumber');
    if (!employeeEl) return;
    const person = findVincPlantillaByEmployeeNumber(employeeEl.value);
    if (person) fillVinculogramaPerson(person);
  }

  function hideVinculogramaSuggestions() {
    const box = document.getElementById('vinculogramaPersonSuggestions');
    if (!box) return;
    box.classList.remove('open');
    box.innerHTML = '';
  }

  function hideVinculogramaSuggestionsDelayed() {
    setTimeout(hideVinculogramaSuggestions, 180);
  }

  function vinculogramaNameAutocomplete() {
    const input = document.getElementById('newVincName');
    const box = document.getElementById('vinculogramaPersonSuggestions');
    if (!input || !box) return;
    const query = normalizeVincLookup(input.value);
    if (query.length < 2) {
      hideVinculogramaSuggestions();
      return;
    }
    const results = getPlantillaForVinculograma()
      .filter(person => {
        const name = normalizeVincLookup(vinculogramaPersonFullName(person));
        const employee = normalizeVincLookup(person.employeeNumber);
        return name.includes(query) || employee.includes(query);
      })
      .sort((a, b) => String(vinculogramaPersonFullName(a) || '').localeCompare(String(vinculogramaPersonFullName(b) || ''), 'es', { sensitivity: 'base' }))
      .slice(0, 8);

    if (!results.length) {
      box.innerHTML = '<div class="rrll-autocomplete-empty">Sin coincidencias en Plantilla</div>';
      box.classList.add('open');
      return;
    }

    box.innerHTML = results.map(person => `
      <button type="button" class="rrll-autocomplete-option" onmousedown="event.preventDefault(); selectVinculogramaPerson('${person.id}')">
        <strong>${escapeHtml(vinculogramaPersonFullName(person) || 'Sin nombre')}</strong>
        <span>Nº ${escapeHtml(person.employeeNumber || '')} · ${escapeHtml(person.job || 'Sin puesto')}</span>
      </button>
    `).join('');
    box.classList.add('open');
  }

  function selectVinculogramaPerson(personId) {
    const person = getPlantillaForVinculograma().find(item => item.id === personId);
    if (person) fillVinculogramaPerson(person);
  }

  function addYearsToDate(value, years) {
    if (!value) return '';
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return '';
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return '';
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return '';
    date.setFullYear(date.getFullYear() + years);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatVincDate(value) {
    if (!value) return 'Sin fecha';
    try {
      const date = new Date(`${value}T00:00:00`);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleDateString('es-ES');
    } catch {
      return String(value);
    }
  }

  function updateVincVigenciaPreview() {
    const requestEl = document.getElementById('newVincRequestDate');
    const expiryEl = document.getElementById('newVincExpiryDate');
    if (!requestEl || !expiryEl) return;
    expiryEl.value = addYearsToDate(requestEl.value, 3);
  }

  function normalizeEmployeeNumber(value) {
    return String(value || '').trim();
  }

  function compareByEmployeeNumber(a, b) {
    const aRaw = normalizeEmployeeNumber(a.employeeNumber);
    const bRaw = normalizeEmployeeNumber(b.employeeNumber);
    const aNum = Number(aRaw.replace(/\D/g, ''));
    const bNum = Number(bRaw.replace(/\D/g, ''));
    const aHasNum = Number.isFinite(aNum) && aRaw.replace(/\D/g, '') !== '';
    const bHasNum = Number.isFinite(bNum) && bRaw.replace(/\D/g, '') !== '';
    if (aHasNum && bHasNum && aNum !== bNum) return aNum - bNum;
    const byRaw = aRaw.localeCompare(bRaw, 'es', { numeric: true, sensitivity: 'base' });
    if (byRaw !== 0) return byRaw;
    return String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' });
  }

  function todayDateOnly() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  function isVinculogramaExpired(item) {
    if (!item || !item.expiryDate) return false;
    const expiry = new Date(`${item.expiryDate}T00:00:00`);
    if (Number.isNaN(expiry.getTime())) return false;
    return expiry < todayDateOnly();
  }

  function splitVinculogramas() {
    const active = [];
    const expired = [];
    getVinculogramas().forEach(item => {
      (isVinculogramaExpired(item) ? expired : active).push(item);
    });
    active.sort(compareByEmployeeNumber);
    expired.sort(compareByEmployeeNumber);
    return { active, expired };
  }

  function ensureVinculogramaEditModal() {
    let modal = document.getElementById('vinculogramaEditModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'vinculogramaEditModal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-box rrll-pro-modal-box vinculograma-edit-modal">
        <div class="modal-header">
          <h3>Editar vinculograma</h3>
          <button type="button" class="icon-button" onclick="closeVinculogramaEditModal()">×</button>
        </div>
        <div class="rrll-pro-task-form rrll-pro-vinculograma-form rrll-pro-edit-form">
          <label class="rrll-pro-field">
            <span>Nº empleado</span>
            <input id="editVincEmployeeNumber" placeholder="Ej. 12345" oninput="vinculogramaEditEmployeeNumberChanged()" onchange="vinculogramaEditEmployeeNumberChanged()" />
          </label>
          <label class="rrll-pro-field rrll-autocomplete-field">
            <span>Nombre</span>
            <input id="editVincName" placeholder="Nombre y apellidos" autocomplete="off" />
          </label>
          <label class="rrll-pro-field">
            <span>Persona vinculada</span>
            <input id="editVincLinkedPerson" placeholder="Persona vinculada" />
          </label>
          <label class="rrll-pro-field">
            <span>Fecha solicitud</span>
            <input id="editVincRequestDate" type="date" onchange="updateEditVincVigenciaPreview()" oninput="updateEditVincVigenciaPreview()" />
          </label>
          <label class="rrll-pro-field">
            <span>Fecha vigencia</span>
            <input id="editVincExpiryDate" type="date" disabled />
          </label>
        </div>
        <div class="modal-actions">
          <button type="button" class="secondary" onclick="closeVinculogramaEditModal()">Cancelar</button>
          <button type="button" class="danger" onclick="deleteEditingVinculograma()">Eliminar</button>
          <button type="button" class="primary" onclick="saveEditingVinculograma()">Guardar cambios</button>
        </div>
      </div>`;
    modal.addEventListener('click', event => {
      if (event.target === modal) closeVinculogramaEditModal();
    });
    document.body.appendChild(modal);
    return modal;
  }

  async function openVinculogramaEditModal(id) {
    const lock = await window.acquireEditingLock?.("vinculograma", id);
    if (lock && lock.allowed === false) return;
    const item = getVinculogramas().find(entry => entry.id === id);
    if (!item) return;
    editingVinculogramaId = id;
    const modal = ensureVinculogramaEditModal();
    const employeeEl = document.getElementById('editVincEmployeeNumber');
    const nameEl = document.getElementById('editVincName');
    const linkedEl = document.getElementById('editVincLinkedPerson');
    const requestEl = document.getElementById('editVincRequestDate');
    const expiryEl = document.getElementById('editVincExpiryDate');
    if (employeeEl) employeeEl.value = item.employeeNumber || '';
    if (nameEl) nameEl.value = item.nombreCompleto || item.name || '';
    if (linkedEl) linkedEl.value = item.linkedPerson || '';
    if (requestEl) requestEl.value = item.requestDate || '';
    if (expiryEl) expiryEl.value = item.expiryDate || addYearsToDate(item.requestDate, 3);
    modal.classList.add('open');
    setTimeout(() => employeeEl?.focus(), 0);
  }

  function closeVinculogramaEditModal() {
    const modal = document.getElementById('vinculogramaEditModal');
    if (modal) modal.classList.remove('open');
    editingVinculogramaId = null;
  }

  function updateEditVincVigenciaPreview() {
    const requestEl = document.getElementById('editVincRequestDate');
    const expiryEl = document.getElementById('editVincExpiryDate');
    if (!requestEl || !expiryEl) return;
    expiryEl.value = addYearsToDate(requestEl.value, 3);
  }

  function vinculogramaEditEmployeeNumberChanged() {
    const employeeEl = document.getElementById('editVincEmployeeNumber');
    const nameEl = document.getElementById('editVincName');
    if (!employeeEl || !nameEl) return;
    const person = findVincPlantillaByEmployeeNumber(employeeEl.value);
    if (person) nameEl.value = vinculogramaPersonFullName(person) || '';
  }

  function saveEditingVinculograma() {
    if (!editingVinculogramaId) return;
    const employeeEl = document.getElementById('editVincEmployeeNumber');
    const nameEl = document.getElementById('editVincName');
    const linkedEl = document.getElementById('editVincLinkedPerson');
    const requestEl = document.getElementById('editVincRequestDate');
    const employeeNumber = normalizeEmployeeNumber(employeeEl?.value);
    const matchedPerson = findVincPlantillaByEmployeeNumber(employeeNumber);
    if (matchedPerson && !String(nameEl?.value || '').trim()) nameEl.value = vinculogramaPersonFullName(matchedPerson) || '';
    const nombreCompleto = String(nameEl?.value || '').trim();
    const linkedPerson = String(linkedEl?.value || '').trim();
    const requestDate = requestEl?.value || '';
    const expiryDate = addYearsToDate(requestDate, 3);
    if (!employeeNumber || !nombreCompleto || !requestDate) {
      alert('Introduce Nº empleado, nombre y fecha de solicitud.');
      return;
    }
    if (!expiryDate) {
      alert('La fecha de solicitud no es válida.');
      return;
    }
    const items = getVinculogramas();
    const next = items.map(item => item.id === editingVinculogramaId
      ? { ...item, employeeNumber, nombreCompleto, name: nombreCompleto, linkedPerson, requestDate, expiryDate, updatedAt: new Date().toISOString() }
      : item
    );
    setVinculogramas(next);
    closeVinculogramaEditModal();
    renderVinculogramas();
    if (typeof updateQuickCounts === 'function') updateQuickCounts();
    if (typeof renderHomeDashboard === 'function') renderHomeDashboard();
  }

  function deleteEditingVinculograma() {
    if (!editingVinculogramaId) return;
    const id = editingVinculogramaId;
    closeVinculogramaEditModal();
    deleteVinculograma(id);
  }

  function addVinculograma() {
    const employeeEl = document.getElementById('newVincEmployeeNumber');
    const nameEl = document.getElementById('newVincName');
    const linkedEl = document.getElementById('newVincLinkedPerson');
    const requestEl = document.getElementById('newVincRequestDate');
    const expiryEl = document.getElementById('newVincExpiryDate');
    if (!employeeEl || !nameEl || !requestEl) return;

    const employeeNumber = normalizeEmployeeNumber(employeeEl.value);
    const matchedPerson = findVincPlantillaByEmployeeNumber(employeeNumber);
    if (matchedPerson && !String(nameEl.value || '').trim()) nameEl.value = vinculogramaPersonFullName(matchedPerson) || '';
    const nombreCompleto = String(nameEl.value || '').trim();
    const linkedPerson = String(linkedEl?.value || '').trim();
    const requestDate = requestEl.value;
    const expiryDate = addYearsToDate(requestDate, 3);

    if (!employeeNumber || !nombreCompleto || !requestDate) {
      alert('Introduce Nº empleado, nombre y fecha de solicitud.');
      return;
    }
    if (!expiryDate) {
      alert('La fecha de solicitud no es válida.');
      return;
    }

    const now = new Date().toISOString();
    const id = (window.crypto && typeof window.crypto.randomUUID === 'function') ? window.crypto.randomUUID() : `vinc-${Date.now()}`;
    const items = getVinculogramas();
    items.push({ id, employeeNumber, nombreCompleto, name: nombreCompleto, linkedPerson, requestDate, expiryDate, createdAt: now });
    setVinculogramas(items);

    employeeEl.value = '';
    nameEl.value = '';
    if (linkedEl) linkedEl.value = '';
    requestEl.value = '';
    if (expiryEl) expiryEl.value = '';
    toggleVinculogramaCreateForm(false);

    renderVinculogramas();
    if (typeof updateQuickCounts === 'function') updateQuickCounts();
    if (typeof renderHomeDashboard === 'function') renderHomeDashboard();
    if (typeof refreshDatabaseInfo === 'function') refreshDatabaseInfo();
  }

  function deleteVinculograma(id) {
    if (!confirm('El vinculograma se moverá a la papelera. ¿Continuar?')) return;
    const items = getVinculogramas();
    const item = items.find(i => i.id === id);
    if (item && typeof moveToTrash === 'function') moveToTrash('vinculograma', item);
    setVinculogramas(items.filter(i => i.id !== id));
    renderVinculogramas();
    if (typeof renderTrash === 'function') renderTrash();
    if (typeof updateQuickCounts === 'function') updateQuickCounts();
    if (typeof renderHomeDashboard === 'function') renderHomeDashboard();
  }

  function rowHtml(item) {
    const statusClass = isVinculogramaExpired(item) ? 'danger' : 'closed';
    const statusText = isVinculogramaExpired(item) ? 'Vencido' : 'Vigente';
    return `
      <tr id="rrll-vinc-${item.id}" class="rrll-pro-row vinculograma-row status-${statusClass}" ondblclick="event.preventDefault(); event.stopPropagation(); openVinculogramaEditModal('${item.id}')" title="Doble clic para editar">
        <td><strong>${escapeHtml(item.employeeNumber || '')}</strong></td>
        <td class="rrll-pro-main-cell"><div class="rrll-pro-title">${escapeHtml(item.nombreCompleto || item.name || 'Sin nombre')}</div></td>
        <td>${escapeHtml(item.linkedPerson || '')}</td>
        <td><span class="rrll-status-pill ${statusClass}">${escapeHtml(statusText)}</span><br><span class="rrll-pro-subtitle">${escapeHtml(formatVincDate(item.expiryDate))}</span></td>
        <td class="rrll-pro-actions vinculograma-actions-cell"><button class="small danger rrll-delete-icon-button rrll-danger-icon-button vinculograma-delete-btn" type="button" onclick="event.stopPropagation(); deleteVinculograma('${item.id}')" title="Eliminar" aria-label="Eliminar"><svg class="vinculograma-delete-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg></button></td>
      </tr>
    `;
  }

  function renderVinculogramas() {
    updateVincVigenciaPreview();
    const { active, expired } = splitVinculogramas();
    const activeBody = document.getElementById('vincActiveTableBody');
    const expiredBody = document.getElementById('vincExpiredTableBody');
    const activeEmpty = document.getElementById('vincActiveEmpty');
    const expiredEmpty = document.getElementById('vincExpiredEmpty');
    if (activeBody) activeBody.innerHTML = active.map(rowHtml).join('');
    if (expiredBody) expiredBody.innerHTML = expired.map(rowHtml).join('');
    if (activeEmpty) activeEmpty.style.display = active.length ? 'none' : 'block';
    if (expiredEmpty) expiredEmpty.style.display = expired.length ? 'none' : 'block';
    setVinculogramaExpiredColumnOpen(isVinculogramaExpiredColumnOpen());

    const countActive = document.getElementById('count-vinc-active');
    const countExpired = document.getElementById('count-vinc-expired');
    const summary = document.getElementById('summary-count-vinculograma');
    if (countActive) countActive.textContent = active.length;
    if (countExpired) countExpired.textContent = expired.length;
    if (summary) summary.textContent = `${active.length} vigentes · ${expired.length} vencidos`;
  }

  function dataFor(scope) {
    const { active, expired } = splitVinculogramas();
    const rows = scope === 'expired' ? expired : active;
    const title = scope === 'expired' ? 'Vinculogramas vencidos' : 'Vinculogramas vigentes';
    const filename = scope === 'expired' ? 'vinculogramas-vencidos' : 'vinculogramas-vigentes';
    return { title, filename, rows };
  }

  function printVinculogramas(scope) {
    const data = dataFor(scope);
    const rowsHtml = data.rows.length
      ? data.rows.map((item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${htmlEscapeForPrint(item.employeeNumber || '')}</td>
          <td>${htmlEscapeForPrint(item.nombreCompleto || item.name || '')}</td>
          <td>${htmlEscapeForPrint(item.linkedPerson || '')}</td>
          <td>${htmlEscapeForPrint(formatVincDate(item.requestDate))}</td>
          <td>${htmlEscapeForPrint(formatVincDate(item.expiryDate))}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="6">Sin registros.</td></tr>`;
    const html = `<h1>${htmlEscapeForPrint(data.title)}</h1><div class="date">Generado: ${new Date().toLocaleString('es-ES')}</div><table><thead><tr><th>#</th><th>Nº empleado</th><th>Nombre</th><th>Persona vinculada</th><th>Fecha solicitud</th><th>Fecha vigencia</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
    if (typeof openPrintPreviewWithHtml === 'function') openPrintPreviewWithHtml(html);
  }

  function exportVinculogramasExcel(scope) {
    const data = dataFor(scope);
    const excelData = {
      title: data.title,
      filename: data.filename,
      headers: ['Nº empleado', 'Nombre', 'Persona vinculada', 'Fecha solicitud', 'Fecha vigencia'],
      rows: data.rows.map(item => [item.employeeNumber || '', item.nombreCompleto || item.name || '', item.linkedPerson || '', formatVincDate(item.requestDate), formatVincDate(item.expiryDate)])
    };
    if (typeof exportExcelData === 'function') exportExcelData(excelData);
  }

  window.VinculogramaModule = {
    getVinculogramas,
    setVinculogramas,
    toggleVinculogramaCreateForm,
    addVinculograma,
    deleteVinculograma,
    renderVinculogramas,
    updateVincVigenciaPreview,
    isVinculogramaExpired,
    printVinculogramas,
    exportVinculogramasExcel,
    toggleVinculogramaExpiredColumn,
    openVinculogramaEditModal,
    closeVinculogramaEditModal,
    saveEditingVinculograma
  };

  window.getVinculogramas = getVinculogramas;
  window.setVinculogramas = setVinculogramas;
  window.toggleVinculogramaCreateForm = toggleVinculogramaCreateForm;
  window.addVinculograma = addVinculograma;
  window.deleteVinculograma = deleteVinculograma;
  window.renderVinculogramas = renderVinculogramas;
  window.updateVincVigenciaPreview = updateVincVigenciaPreview;
  window.isVinculogramaExpired = isVinculogramaExpired;
  window.printVinculogramas = printVinculogramas;
  window.exportVinculogramasExcel = exportVinculogramasExcel;
  window.toggleVinculogramaExpiredColumn = toggleVinculogramaExpiredColumn;
  window.openVinculogramaEditModal = openVinculogramaEditModal;
  window.closeVinculogramaEditModal = closeVinculogramaEditModal;
  window.saveEditingVinculograma = saveEditingVinculograma;
  window.deleteEditingVinculograma = deleteEditingVinculograma;
  window.updateEditVincVigenciaPreview = updateEditVincVigenciaPreview;
  window.vinculogramaEditEmployeeNumberChanged = vinculogramaEditEmployeeNumberChanged;
  window.vinculogramaEmployeeNumberChanged = vinculogramaEmployeeNumberChanged;
  window.vinculogramaNameAutocomplete = vinculogramaNameAutocomplete;
  window.hideVinculogramaSuggestionsDelayed = hideVinculogramaSuggestionsDelayed;
  window.selectVinculogramaPerson = selectVinculogramaPerson;
})();
