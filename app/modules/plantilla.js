// Gestor de Plantilla.
// Registro de personas de plantilla con datos básicos profesionales.
(function () {
  'use strict';

  const KEY = 'rrll_plantilla';
  const LEVELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'JU'];
  const SEX_VALUES = ['M', 'H'];

  function getPlantilla() {
    const items = load(KEY, []);
    return Array.isArray(items) ? items : [];
  }

  function setPlantilla(items) {
    save(KEY, Array.isArray(items) ? items : []);
  }

  function normalizeEmployeeNumber(value) {
    return String(value || '').trim();
  }

  function normalizeText(value) {
    return String(value || '').trim();
  }

  function normalizeSex(value) {
    return SEX_VALUES.includes(value) ? value : 'M';
  }

  function normalizeLevel(value) {
    return LEVELS.includes(value) ? value : 'A';
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

  function sortedPlantilla() {
    return [...getPlantilla()].sort(compareByEmployeeNumber);
  }

  function togglePlantillaCreateForm(forceOpen) {
    const form = document.getElementById('plantillaCreateForm');
    if (!form) return;
    const open = typeof forceOpen === 'boolean' ? forceOpen : form.classList.contains('rrll-create-form-collapsed');
    form.classList.toggle('rrll-create-form-collapsed', !open);
    if (open) setTimeout(() => document.getElementById('newPlantEmployeeNumber')?.focus(), 0);
  }

  function addPlantilla() {
    const employeeEl = document.getElementById('newPlantEmployeeNumber');
    const nameEl = document.getElementById('newPlantName');
    const sexEl = document.getElementById('newPlantSex');
    const jobEl = document.getElementById('newPlantJob');
    const levelEl = document.getElementById('newPlantLevel');
    if (!employeeEl || !nameEl || !sexEl || !jobEl || !levelEl) return;

    const employeeNumber = normalizeEmployeeNumber(employeeEl.value);
    const name = normalizeText(nameEl.value);
    const sex = normalizeSex(sexEl.value);
    const job = normalizeText(jobEl.value);
    const level = normalizeLevel(levelEl.value);

    if (!employeeNumber || !name || !job) {
      alert('Introduce Nº empleado, nombre y apellidos, y puesto de trabajo.');
      return;
    }

    const now = new Date().toISOString();
    const id = (window.crypto && typeof window.crypto.randomUUID === 'function') ? window.crypto.randomUUID() : `plant-${Date.now()}`;
    const items = getPlantilla();
    items.push({ id, employeeNumber, name, sex, job, level, createdAt: now, updatedAt: now });
    setPlantilla(items);

    employeeEl.value = '';
    nameEl.value = '';
    sexEl.value = 'M';
    jobEl.value = '';
    levelEl.value = 'A';
    togglePlantillaCreateForm(false);

    renderPlantilla();
    if (typeof updateQuickCounts === 'function') updateQuickCounts();
    if (typeof renderHomeDashboard === 'function') renderHomeDashboard();
  }

  function deletePlantilla(id) {
    if (!confirm('La persona se moverá a la papelera. ¿Continuar?')) return;
    const items = getPlantilla();
    const item = items.find(i => i.id === id);
    if (item && typeof moveToTrash === 'function') moveToTrash('plantilla', item);
    setPlantilla(items.filter(i => i.id !== id));
    renderPlantilla();
    if (typeof renderTrash === 'function') renderTrash();
    if (typeof updateQuickCounts === 'function') updateQuickCounts();
    if (typeof renderHomeDashboard === 'function') renderHomeDashboard();
  }



  let editingPlantillaId = null;

  function ensurePlantillaEditModal() {
    let modal = document.getElementById('plantillaEditModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'plantillaEditModal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-box rrll-pro-modal-box">
        <div class="modal-header">
          <h3>Editar persona de plantilla</h3>
          <button type="button" class="icon-button" onclick="closePlantillaEditModal()">×</button>
        </div>
        <div class="rrll-pro-task-form rrll-pro-edit-form">
          <label class="rrll-pro-field">
            <span>Nº empleado</span>
            <input id="editPlantEmployeeNumber" placeholder="Ej. 12345" />
          </label>
          <label class="rrll-pro-field">
            <span>Nombre y apellidos</span>
            <input id="editPlantName" placeholder="Nombre y apellidos" />
          </label>
          <label class="rrll-pro-field">
            <span>Sexo</span>
            <select id="editPlantSex">
              <option value="M">M</option>
              <option value="H">H</option>
            </select>
          </label>
          <label class="rrll-pro-field">
            <span>Puesto de trabajo</span>
            <input id="editPlantJob" placeholder="Puesto de trabajo" />
          </label>
          <label class="rrll-pro-field">
            <span>Nivel retributivo</span>
            <select id="editPlantLevel">
              ${LEVELS.map(level => `<option value="${level}">${level}</option>`).join('')}
            </select>
          </label>
        </div>
        <div class="modal-actions">
          <button type="button" class="secondary" onclick="closePlantillaEditModal()">Cancelar</button>
          <button type="button" class="danger" onclick="deleteEditingPlantilla()">Eliminar</button>
          <button type="button" class="primary" onclick="saveEditingPlantilla()">Guardar cambios</button>
        </div>
      </div>`;
    modal.addEventListener('click', event => {
      if (event.target === modal) closePlantillaEditModal();
    });
    document.body.appendChild(modal);
    return modal;
  }

  function openPlantillaEditModal(id) {
    const item = getPlantilla().find(entry => entry.id === id);
    if (!item) return;
    editingPlantillaId = id;
    const modal = ensurePlantillaEditModal();
    document.getElementById('editPlantEmployeeNumber').value = item.employeeNumber || '';
    document.getElementById('editPlantName').value = item.name || '';
    document.getElementById('editPlantSex').value = normalizeSex(item.sex);
    document.getElementById('editPlantJob').value = item.job || '';
    document.getElementById('editPlantLevel').value = normalizeLevel(item.level);
    modal.classList.add('open');
    setTimeout(() => document.getElementById('editPlantEmployeeNumber')?.focus(), 0);
  }

  function closePlantillaEditModal() {
    const modal = document.getElementById('plantillaEditModal');
    if (modal) modal.classList.remove('open');
    editingPlantillaId = null;
  }

  function saveEditingPlantilla() {
    if (!editingPlantillaId) return;
    const employeeNumber = normalizeEmployeeNumber(document.getElementById('editPlantEmployeeNumber')?.value);
    const name = normalizeText(document.getElementById('editPlantName')?.value);
    const sex = normalizeSex(document.getElementById('editPlantSex')?.value);
    const job = normalizeText(document.getElementById('editPlantJob')?.value);
    const level = normalizeLevel(document.getElementById('editPlantLevel')?.value);
    if (!employeeNumber || !name || !job) {
      alert('Introduce Nº empleado, nombre y apellidos, y puesto de trabajo.');
      return;
    }
    setPlantilla(getPlantilla().map(item => item.id === editingPlantillaId ? {
      ...item,
      employeeNumber,
      name,
      sex,
      job,
      level,
      updatedAt: new Date().toISOString()
    } : item));
    closePlantillaEditModal();
    renderPlantilla();
    if (typeof updateQuickCounts === 'function') updateQuickCounts();
    if (typeof renderHomeDashboard === 'function') renderHomeDashboard();
  }

  function deleteEditingPlantilla() {
    if (!editingPlantillaId) return;
    const id = editingPlantillaId;
    closePlantillaEditModal();
    deletePlantilla(id);
  }

  function rowHtml(item) {
    return `
      <tr id="rrll-plant-${item.id}" class="rrll-pro-row plantilla-row" ondblclick="event.preventDefault(); event.stopPropagation(); openPlantillaEditModal('${item.id}')" title="Doble clic para editar">
        <td><strong>${escapeHtml(item.employeeNumber || '')}</strong></td>
        <td class="rrll-pro-main-cell"><div class="rrll-pro-title">${escapeHtml(item.name || 'Sin nombre')}</div></td>
        <td><span class="rrll-status-pill closed">${escapeHtml(item.sex || '')}</span></td>
        <td>${escapeHtml(item.job || '')}</td>
        <td><span class="rrll-status-pill progress">${escapeHtml(item.level || '')}</span></td>
        <td class="rrll-pro-actions"><button class="small danger" type="button" onclick="deletePlantilla('${item.id}')">Eliminar</button></td>
      </tr>
    `;
  }

  function renderPlantilla() {
    const rows = sortedPlantilla();
    const body = document.getElementById('plantillaTableBody');
    const empty = document.getElementById('plantillaTableEmpty');
    const count = document.getElementById('count-plantilla-total');
    const summary = document.getElementById('summary-count-plantilla');
    if (body) body.innerHTML = rows.map(rowHtml).join('');
    if (empty) empty.style.display = rows.length ? 'none' : 'block';
    if (count) count.textContent = rows.length;
    if (summary) summary.textContent = `${rows.length} personas`;
  }

  function printPlantilla() {
    const rows = sortedPlantilla();
    const rowsHtml = rows.length
      ? rows.map((item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${htmlEscapeForPrint(item.employeeNumber || '')}</td>
          <td>${htmlEscapeForPrint(item.name || '')}</td>
          <td>${htmlEscapeForPrint(item.sex || '')}</td>
          <td>${htmlEscapeForPrint(item.job || '')}</td>
          <td>${htmlEscapeForPrint(item.level || '')}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="6">Sin registros.</td></tr>`;
    const html = `<h1>Plantilla</h1><div class="date">Generado: ${new Date().toLocaleString('es-ES')}</div><table><thead><tr><th>#</th><th>Nº empleado</th><th>Nombre y apellidos</th><th>Sexo</th><th>Puesto de trabajo</th><th>Nivel retributivo</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
    if (typeof openPrintPreviewWithHtml === 'function') openPrintPreviewWithHtml(html);
  }

  function exportPlantillaExcel() {
    const rows = sortedPlantilla();
    const excelData = {
      title: 'Plantilla',
      filename: 'plantilla',
      headers: ['Nº empleado', 'Nombre y apellidos', 'Sexo', 'Puesto de trabajo', 'Nivel retributivo'],
      rows: rows.map(item => [item.employeeNumber || '', item.name || '', item.sex || '', item.job || '', item.level || ''])
    };
    if (typeof exportExcelData === 'function') exportExcelData(excelData);
  }

  window.PlantillaModule = { getPlantilla, setPlantilla, togglePlantillaCreateForm, addPlantilla, deletePlantilla, openPlantillaEditModal, closePlantillaEditModal, saveEditingPlantilla, deleteEditingPlantilla, renderPlantilla, printPlantilla, exportPlantillaExcel };
  window.getPlantilla = getPlantilla;
  window.setPlantilla = setPlantilla;
  window.togglePlantillaCreateForm = togglePlantillaCreateForm;
  window.addPlantilla = addPlantilla;
  window.deletePlantilla = deletePlantilla;
  window.openPlantillaEditModal = openPlantillaEditModal;
  window.closePlantillaEditModal = closePlantillaEditModal;
  window.saveEditingPlantilla = saveEditingPlantilla;
  window.deleteEditingPlantilla = deleteEditingPlantilla;
  window.renderPlantilla = renderPlantilla;
  window.printPlantilla = printPlantilla;
  window.exportPlantillaExcel = exportPlantillaExcel;
})();
