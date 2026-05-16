// Módulo independiente de Criterios RRLL.
// Base interna de criterios, decisiones y antecedentes con búsqueda local.
(function () {
  'use strict';

  const STORAGE_KEY = 'rrll_criteria';
  const ORIGINS = ['Comité', 'Paritaria', 'Convenio', 'Dirección', 'Jurisprudencia', 'Criterio interno', 'Otro'];
  let editingCriteriaId = null;

  function getCriteria() {
    const items = load(STORAGE_KEY, []);
    return Array.isArray(items) ? items : [];
  }

  function setCriteria(items) {
    save(STORAGE_KEY, Array.isArray(items) ? items : []);
  }

  function normalizeCriteriaText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function criteriaValue(id) {
    return String(document.getElementById(id)?.value || '').trim();
  }

  function formatCriteriaDate(value) {
    if (!value) return 'Sin fecha';
    try {
      const date = new Date(`${value}T00:00:00`);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleDateString('es-ES');
    } catch {
      return String(value);
    }
  }

  function criteriaExcerpt(value, maxLength = 130) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1).trim()}…`;
  }

  function sortedCriteria(items) {
    return [...items].sort((a, b) => {
      const byDate = String(b.date || '').localeCompare(String(a.date || ''));
      if (byDate !== 0) return byDate;
      return String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''));
    });
  }

  function getCriteriaSearchQuery() {
    return normalizeCriteriaText(document.getElementById('criteriaSearchInput')?.value || '');
  }

  function matchesCriteriaSearch(item, query) {
    if (!query) return true;
    const haystack = normalizeCriteriaText([
      item.subject,
      item.generalCriterion,
      item.observations,
      item.tags,
      item.origin
    ].join(' '));
    return haystack.includes(query);
  }

  function getVisibleCriteria() {
    const query = getCriteriaSearchQuery();
    return sortedCriteria(getCriteria()).filter(item => matchesCriteriaSearch(item, query));
  }

  function resetCriteriaCreateForm() {
    ['newCriteriaDate', 'newCriteriaSubject', 'newCriteriaGeneral', 'newCriteriaObservations', 'newCriteriaTags', 'newCriteriaOrigin'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = '';
    });
  }

  function toggleCriteriaCreateForm(forceOpen) {
    const form = document.getElementById('criteriaCreateForm');
    if (!form) return;
    const open = typeof forceOpen === 'boolean' ? forceOpen : form.classList.contains('rrll-create-form-collapsed');
    form.classList.toggle('rrll-create-form-collapsed', !open);
    if (open) setTimeout(() => document.getElementById('newCriteriaDate')?.focus(), 0);
    if (!open) resetCriteriaCreateForm();
  }

  function buildCriteriaFromForm(prefix) {
    return {
      date: criteriaValue(`${prefix}CriteriaDate`),
      subject: criteriaValue(`${prefix}CriteriaSubject`),
      generalCriterion: criteriaValue(`${prefix}CriteriaGeneral`),
      observations: criteriaValue(`${prefix}CriteriaObservations`),
      tags: criteriaValue(`${prefix}CriteriaTags`),
      origin: criteriaValue(`${prefix}CriteriaOrigin`)
    };
  }

  function validateCriteriaPayload(payload) {
    if (!payload.date || !payload.subject || !payload.generalCriterion) {
      alert('Fecha, Motivo / asunto y Criterio general son obligatorios.');
      return false;
    }
    return true;
  }

  function addCriteria() {
    const payload = buildCriteriaFromForm('new');
    if (!validateCriteriaPayload(payload)) return;
    const now = new Date().toISOString();
    const item = {
      id: crypto.randomUUID ? crypto.randomUUID() : `criteria-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...payload,
      createdAt: now,
      updatedAt: now
    };
    setCriteria([item, ...getCriteria()]);
    toggleCriteriaCreateForm(false);
    renderCriteria();
  }

  function originOptions(selectedValue) {
    const selected = String(selectedValue || '').trim();
    const values = ORIGINS.includes(selected) || !selected ? ORIGINS : [...ORIGINS, selected];
    return ['<option value="">Seleccionar origen</option>']
      .concat(values.map(value => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`))
      .join('');
  }

  function ensureCriteriaEditModal() {
    let modal = document.getElementById('criteriaEditModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'criteriaEditModal';
    modal.className = 'modal-backdrop criteria-modal';
    modal.innerHTML = `
      <div class="modal-box rrll-pro-modal-box criteria-modal-box">
        <div class="modal-header">
          <h3>Editar criterio RRLL</h3>
          <button type="button" class="icon-button" onclick="closeCriteriaEditModal()">×</button>
        </div>
        <div class="rrll-pro-task-form criteria-form criteria-edit-form">
          <label class="rrll-pro-field">
            <span>Fecha *</span>
            <input id="editCriteriaDate" type="date" />
          </label>
          <label class="rrll-pro-field">
            <span>Motivo / asunto *</span>
            <input id="editCriteriaSubject" placeholder="Asunto del criterio" />
          </label>
          <label class="rrll-pro-field criteria-full-field">
            <span>Criterio general *</span>
            <textarea id="editCriteriaGeneral" rows="6" placeholder="Criterio acordado o decisión general"></textarea>
          </label>
          <label class="rrll-pro-field criteria-full-field">
            <span>Observaciones</span>
            <textarea id="editCriteriaObservations" rows="4" placeholder="Antecedentes, matices o notas internas"></textarea>
          </label>
          <label class="rrll-pro-field">
            <span>Etiquetas / palabras clave</span>
            <input id="editCriteriaTags" placeholder="Ej. jornada, permisos, sanción" />
          </label>
          <label class="rrll-pro-field">
            <span>Origen</span>
            <select id="editCriteriaOrigin"></select>
          </label>
          <div class="rrll-pro-form-actions criteria-full-field">
            <button type="button" class="rrll-pro-primary" onclick="saveEditingCriteria()">Guardar cambios</button>
            <button type="button" class="secondary" onclick="closeCriteriaEditModal()">Cancelar</button>
            <button type="button" class="small danger" onclick="deleteEditingCriteria()">Eliminar</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
      if (event.target === modal) closeCriteriaEditModal();
    });
    return modal;
  }

  function openCriteriaEditModal(criteriaId) {
    const item = getCriteria().find(criteria => criteria.id === criteriaId);
    if (!item) return;
    editingCriteriaId = criteriaId;
    const modal = ensureCriteriaEditModal();
    document.getElementById('editCriteriaDate').value = item.date || '';
    document.getElementById('editCriteriaSubject').value = item.subject || '';
    document.getElementById('editCriteriaGeneral').value = item.generalCriterion || '';
    document.getElementById('editCriteriaObservations').value = item.observations || '';
    document.getElementById('editCriteriaTags').value = item.tags || '';
    document.getElementById('editCriteriaOrigin').innerHTML = originOptions(item.origin || '');
    modal.classList.add('open');
    setTimeout(() => document.getElementById('editCriteriaSubject')?.focus(), 0);
  }

  function closeCriteriaEditModal() {
    const modal = document.getElementById('criteriaEditModal');
    if (modal) modal.classList.remove('open');
    editingCriteriaId = null;
  }

  function saveEditingCriteria() {
    if (!editingCriteriaId) return;
    const payload = buildCriteriaFromForm('edit');
    if (!validateCriteriaPayload(payload)) return;
    const now = new Date().toISOString();
    const items = getCriteria().map(item => item.id === editingCriteriaId ? { ...item, ...payload, updatedAt: now } : item);
    setCriteria(items);
    closeCriteriaEditModal();
    renderCriteria();
  }

  function deleteCriteria(criteriaId) {
    if (!criteriaId) return;
    if (!confirm('¿Seguro que quieres eliminar este criterio?')) return;
    setCriteria(getCriteria().filter(item => item.id !== criteriaId));
    if (editingCriteriaId === criteriaId) closeCriteriaEditModal();
    renderCriteria();
  }

  function deleteEditingCriteria() {
    if (editingCriteriaId) deleteCriteria(editingCriteriaId);
  }

  function criteriaRowHtml(item) {
    return `
      <tr class="rrll-pro-row criteria-row" ondblclick="event.preventDefault(); event.stopPropagation(); openCriteriaEditModal('${escapeHtml(item.id)}')" title="Doble clic para editar">
        <td>${escapeHtml(formatCriteriaDate(item.date))}</td>
        <td class="rrll-pro-main-cell"><div class="rrll-pro-title">${escapeHtml(item.subject || 'Sin asunto')}</div></td>
        <td class="criteria-excerpt-cell">${escapeHtml(criteriaExcerpt(item.generalCriterion || ''))}</td>
        <td>${escapeHtml(item.origin || '')}</td>
        <td>${escapeHtml(item.tags || '')}</td>
        <td class="rrll-pro-actions"><button class="small danger" type="button" onclick="event.stopPropagation(); deleteCriteria('${escapeHtml(item.id)}')" title="Eliminar criterio" aria-label="Eliminar criterio">Eliminar</button></td>
      </tr>`;
  }

  function renderCriteria() {
    const rows = getVisibleCriteria();
    const body = document.getElementById('criteriaTableBody');
    const empty = document.getElementById('criteriaEmptyState');
    const count = document.getElementById('criteriaCount');
    const summary = document.getElementById('summary-count-criteria');
    const total = getCriteria().length;

    if (body) body.innerHTML = rows.map(criteriaRowHtml).join('');
    if (empty) empty.style.display = rows.length ? 'none' : 'block';
    if (count) count.textContent = `${rows.length} de ${total}`;
    if (summary) summary.textContent = `${total} criterios`;
  }

  function printCriteria() {
    const rows = getVisibleCriteria();
    const rowsHtml = rows.length
      ? rows.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${htmlEscapeForPrint(formatCriteriaDate(item.date))}</td>
          <td>${htmlEscapeForPrint(item.subject || '')}</td>
          <td>${htmlEscapeForPrint(item.generalCriterion || '')}</td>
          <td>${htmlEscapeForPrint(item.origin || '')}</td>
          <td>${htmlEscapeForPrint(item.tags || '')}</td>
          <td>${htmlEscapeForPrint(item.observations || '')}</td>
        </tr>`).join('')
      : '<tr><td colspan="7">Sin criterios.</td></tr>';
    const html = `<h1>Criterios RRLL</h1><div class="date">Generado: ${new Date().toLocaleString('es-ES')}</div><table><thead><tr><th>#</th><th>Fecha</th><th>Motivo / asunto</th><th>Criterio general</th><th>Origen</th><th>Etiquetas</th><th>Observaciones</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
    if (typeof openPrintPreviewWithHtml === 'function') openPrintPreviewWithHtml(html);
  }

  function exportCriteriaExcel() {
    if (typeof exportExcelData !== 'function') return;
    exportExcelData({
      title: 'Criterios RRLL',
      filename: 'criterios-rrll',
      headers: ['Fecha', 'Motivo / asunto', 'Criterio general', 'Origen', 'Etiquetas', 'Observaciones', 'Creado', 'Actualizado'],
      rows: getVisibleCriteria().map(item => [
        formatCriteriaDate(item.date),
        item.subject || '',
        item.generalCriterion || '',
        item.origin || '',
        item.tags || '',
        item.observations || '',
        item.createdAt || '',
        item.updatedAt || ''
      ])
    });
  }

  window.CriteriaModule = {
    getCriteria,
    setCriteria,
    getVisibleCriteria,
    toggleCriteriaCreateForm,
    addCriteria,
    renderCriteria,
    openCriteriaEditModal,
    closeCriteriaEditModal,
    saveEditingCriteria,
    deleteCriteria,
    printCriteria,
    exportCriteriaExcel
  };

  window.getCriteria = getCriteria;
  window.setCriteria = setCriteria;
  window.getVisibleCriteria = getVisibleCriteria;
  window.toggleCriteriaCreateForm = toggleCriteriaCreateForm;
  window.addCriteria = addCriteria;
  window.renderCriteria = renderCriteria;
  window.openCriteriaEditModal = openCriteriaEditModal;
  window.closeCriteriaEditModal = closeCriteriaEditModal;
  window.saveEditingCriteria = saveEditingCriteria;
  window.deleteCriteria = deleteCriteria;
  window.deleteEditingCriteria = deleteEditingCriteria;
  window.printCriteria = printCriteria;
  window.exportCriteriaExcel = exportCriteriaExcel;
})();
