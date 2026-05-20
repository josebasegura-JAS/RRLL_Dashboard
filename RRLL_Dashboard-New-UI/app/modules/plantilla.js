// Gestor de Plantilla.
// Registro de personas de plantilla con datos básicos profesionales.
(function () {
  'use strict';

  const KEY = 'rrll_plantilla';
  const LEVELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'JU'];
  const SEX_VALUES = ['M', 'H'];
  const PLANTILLA_PAGE_SIZE = 30;
  let plantillaCurrentPage = 1;


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

  function padDatePart(value) {
    return String(value).padStart(2, '0');
  }

  function isValidDateParts(year, month, day) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
    if (year < 1900 || year > 2199 || month < 1 || month > 12 || day < 1 || day > 31) return false;
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  function datePartsToInputValue(year, month, day) {
    return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
  }

  function excelSerialToInputDate(value) {
    const serial = Number(value);
    if (!Number.isFinite(serial) || serial < 60 || serial > 109574) return '';
    const utcDays = Math.floor(serial) - 25569;
    const date = new Date(utcDays * 86400 * 1000);
    return datePartsToInputValue(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  function normalizePlantillaDate(value) {
    const raw = normalizeText(value);
    if (!raw) return '';
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(raw)) {
      const [year, month, day] = raw.split('-').map(Number);
      return isValidDateParts(year, month, day) ? datePartsToInputValue(year, month, day) : '';
    }
    const slashMatch = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch.map(Number);
      return isValidDateParts(year, month, day) ? datePartsToInputValue(year, month, day) : '';
    }
    if (/^\d+(?:[.,]\d+)?$/.test(raw)) return excelSerialToInputDate(raw.replace(',', '.'));
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return datePartsToInputValue(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
    }
    return '';
  }

  function formatPlantillaDate(value) {
    const normalized = normalizePlantillaDate(value);
    if (!normalized) return normalizeText(value);
    const [year, month, day] = normalized.split('-');
    return `${day}/${month}/${year}`;
  }

  function normalizePlantillaDateOrText(value) {
    const raw = normalizeText(value);
    return raw ? (normalizePlantillaDate(raw) || raw) : '';
  }

  function normalizeHeader(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/º|°/g, 'o')
      .replace(/&/g, ' y ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function normalizeEmployeeKey(value) {
    return normalizeEmployeeNumber(value).toLowerCase();
  }

  function normalizeSex(value) {
    const normalized = normalizeHeader(value);
    if (normalized === 'h' || normalized === 'hombre') return 'H';
    if (normalized === 'm' || normalized === 'mujer') return 'M';
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
    const ageEl = document.getElementById('newPlantPositionSeniority');
    const levelEl = document.getElementById('newPlantLevel');
    if (!employeeEl || !nameEl || !sexEl || !jobEl || !levelEl) return;

    const employeeNumber = normalizeEmployeeNumber(employeeEl.value);
    const name = normalizeText(nameEl.value);
    const sex = normalizeSex(sexEl.value);
    const job = normalizeText(jobEl.value);
    const positionSeniority = normalizePlantillaDate(ageEl?.value);
    const level = normalizeLevel(levelEl.value);

    if (!employeeNumber || !name || !job) {
      alert('Introduce Nº empleado, nombre y apellidos, y puesto de trabajo.');
      return;
    }

    const now = new Date().toISOString();
    const id = (window.crypto && typeof window.crypto.randomUUID === 'function') ? window.crypto.randomUUID() : `plant-${Date.now()}`;
    const items = getPlantilla();
    items.push({ id, employeeNumber, name, sex, job, positionSeniority, level, createdAt: now, updatedAt: now });
    setPlantilla(items);

    employeeEl.value = '';
    nameEl.value = '';
    sexEl.value = 'M';
    jobEl.value = '';
    if (ageEl) ageEl.value = '';
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
            <span>Antigüedad en puesto</span>
            <input id="editPlantPositionSeniority" type="date" />
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
    document.getElementById('editPlantPositionSeniority').value = normalizePlantillaDate(item.positionSeniority);
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
    const positionSeniorityInput = normalizeText(document.getElementById('editPlantPositionSeniority')?.value);
    const previousItem = getPlantilla().find(item => item.id === editingPlantillaId);
    const previousPositionSeniority = previousItem?.positionSeniority || '';
    const positionSeniority = positionSeniorityInput
      ? normalizePlantillaDate(positionSeniorityInput)
      : (normalizePlantillaDate(previousPositionSeniority) ? '' : previousPositionSeniority);
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
      positionSeniority,
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
        <td class="plantilla-col-sex"><span class="rrll-status-pill closed">${escapeHtml(item.sex || '')}</span></td>
        <td>${escapeHtml(item.job || '')}</td>
        <td class="plantilla-col-date">${escapeHtml(formatPlantillaDate(item.positionSeniority))}</td>
        <td><span class="rrll-status-pill progress">${escapeHtml(item.level || '')}</span></td>
        <td class="rrll-pro-actions plantilla-actions-cell"><button class="small danger rrll-delete-icon-button" type="button" onclick="event.stopPropagation(); deletePlantilla('${item.id}')" title="Eliminar persona" aria-label="Eliminar persona"><span aria-hidden="true">🗑️</span></button></td>
      </tr>
    `;
  }

  function renderPlantillaPagination(totalRows) {
    const pagination = document.getElementById('plantillaPagination');
    if (!pagination) return;
    const totalPages = Math.max(1, Math.ceil(totalRows / PLANTILLA_PAGE_SIZE));
    if (plantillaCurrentPage > totalPages) plantillaCurrentPage = totalPages;
    if (plantillaCurrentPage < 1) plantillaCurrentPage = 1;
    pagination.innerHTML = `
      <button type="button" class="rrll-pro-tool-button plantilla-page-button plantilla-pagination-btn" onclick="plantillaPreviousPage()" ${plantillaCurrentPage <= 1 ? 'disabled' : ''}>Anterior</button>
      <span class="plantilla-pagination-info">Página ${plantillaCurrentPage} de ${totalPages} · ${totalRows} registros</span>
      <button type="button" class="rrll-pro-tool-button plantilla-page-button plantilla-pagination-btn" onclick="plantillaNextPage()" ${plantillaCurrentPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
    `;
  }

  function setPlantillaPage(page) {
    const totalPages = Math.max(1, Math.ceil(sortedPlantilla().length / PLANTILLA_PAGE_SIZE));
    plantillaCurrentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
    renderPlantilla();
  }

  function plantillaPreviousPage() {
    setPlantillaPage(plantillaCurrentPage - 1);
  }

  function plantillaNextPage() {
    setPlantillaPage(plantillaCurrentPage + 1);
  }

  function renderPlantilla(options = {}) {
    const rows = sortedPlantilla();
    if (options.resetPage) plantillaCurrentPage = 1;
    const totalPages = Math.max(1, Math.ceil(rows.length / PLANTILLA_PAGE_SIZE));
    if (plantillaCurrentPage > totalPages) plantillaCurrentPage = totalPages;
    if (plantillaCurrentPage < 1) plantillaCurrentPage = 1;
    const start = (plantillaCurrentPage - 1) * PLANTILLA_PAGE_SIZE;
    const visibleRows = rows.slice(start, start + PLANTILLA_PAGE_SIZE);
    const body = document.getElementById('plantillaTableBody');
    const empty = document.getElementById('plantillaTableEmpty');
    const count = document.getElementById('count-plantilla-total');
    const summary = document.getElementById('summary-count-plantilla');
    if (body) body.innerHTML = visibleRows.map(rowHtml).join('');
    if (empty) empty.style.display = rows.length ? 'none' : 'block';
    if (count) count.textContent = rows.length;
    if (summary) summary.textContent = `${rows.length} personas`;
    renderPlantillaPagination(rows.length);
  }

  function getPlantillaFieldAliases() {
    return {
      employeeNumber: ['no empleado', 'n empleado', 'numero empleado', 'num empleado', 'numero de empleado', 'no', 'n', 'numero', 'num'],
      name: ['nombre', 'nombre y apellidos', 'apellidos y nombre', 'persona', 'empleado'],
      sex: ['sexo', 'genero'],
      job: ['puesto', 'puesto de trabajo', 'cargo'],
      positionSeniority: ['antiguedad en puesto', 'antiguedad puesto', 'antig puesto', 'fecha antiguedad puesto', 'antiguedad del puesto', 'antiguedad'],
      level: ['nivel', 'nivel retributivo', 'grupo']
    };
  }

  function buildPlantillaColumnMap(headers) {
    const aliases = getPlantillaFieldAliases();
    const normalizedHeaders = headers.map(normalizeHeader);
    const map = {};
    Object.entries(aliases).forEach(([field, fieldAliases]) => {
      const normalizedAliases = fieldAliases.map(normalizeHeader);
      const index = normalizedHeaders.findIndex(header => normalizedAliases.includes(header));
      if (index >= 0) map[field] = index;
    });
    return map;
  }

  function spreadsheetCellToText(cell) {
    if (cell == null) return '';
    return String(cell).replace(/\s+/g, ' ').trim();
  }

  function parseCsvRows(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];
      if (quoted && char === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (!quoted && (char === ',' || char === ';' || char === '\t')) {
        row.push(spreadsheetCellToText(cell));
        cell = '';
      } else if (!quoted && (char === '\n' || char === '\r')) {
        if (char === '\r' && next === '\n') i++;
        row.push(spreadsheetCellToText(cell));
        if (row.some(Boolean)) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
    row.push(spreadsheetCellToText(cell));
    if (row.some(Boolean)) rows.push(row);
    return rows;
  }

  function parseHtmlTableRows(text) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return [...doc.querySelectorAll('tr')]
      .map(tr => [...tr.children].map(cell => spreadsheetCellToText(cell.textContent)))
      .filter(row => row.some(Boolean));
  }

  function columnLettersToIndex(ref) {
    const letters = String(ref || '').replace(/[^A-Z]/gi, '').toUpperCase();
    let index = 0;
    for (const letter of letters) index = (index * 26) + letter.charCodeAt(0) - 64;
    return Math.max(index - 1, 0);
  }

  async function inflateZipEntry(bytes, compressionMethod) {
    if (compressionMethod === 0) return bytes;
    if (compressionMethod !== 8) throw new Error('El Excel usa un método de compresión no soportado.');
    if (typeof DecompressionStream !== 'function') throw new Error('Este entorno no permite descomprimir archivos .xlsx.');
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function decodeUtf8(bytes) {
    return new TextDecoder('utf-8').decode(bytes);
  }

  async function readZipEntries(buffer, wantedNames) {
    const data = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const entries = {};
    for (let i = data.length - 22; i >= 0; i--) {
      if (view.getUint32(i, true) !== 0x06054b50) continue;
      const total = view.getUint16(i + 10, true);
      let offset = view.getUint32(i + 16, true);
      for (let e = 0; e < total; e++) {
        if (view.getUint32(offset, true) !== 0x02014b50) break;
        const method = view.getUint16(offset + 10, true);
        const compressedSize = view.getUint32(offset + 20, true);
        const fileNameLength = view.getUint16(offset + 28, true);
        const extraLength = view.getUint16(offset + 30, true);
        const commentLength = view.getUint16(offset + 32, true);
        const localOffset = view.getUint32(offset + 42, true);
        const fileName = decodeUtf8(data.slice(offset + 46, offset + 46 + fileNameLength));
        if (wantedNames.has(fileName)) {
          const localNameLength = view.getUint16(localOffset + 26, true);
          const localExtraLength = view.getUint16(localOffset + 28, true);
          const dataStart = localOffset + 30 + localNameLength + localExtraLength;
          entries[fileName] = decodeUtf8(await inflateZipEntry(data.slice(dataStart, dataStart + compressedSize), method));
        }
        offset += 46 + fileNameLength + extraLength + commentLength;
      }
      return entries;
    }
    throw new Error('No se pudo abrir el archivo Excel.');
  }

  function parseSharedStrings(xmlText) {
    if (!xmlText) return [];
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    return [...doc.querySelectorAll('si')].map(si => [...si.querySelectorAll('t')].map(t => t.textContent || '').join(''));
  }

  function parseWorksheetRows(xmlText, sharedStrings) {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    return [...doc.querySelectorAll('sheetData row')].map(rowNode => {
      const row = [];
      [...rowNode.querySelectorAll('c')].forEach(cell => {
        const index = columnLettersToIndex(cell.getAttribute('r'));
        const type = cell.getAttribute('t');
        let value = '';
        if (type === 'inlineStr') {
          value = [...cell.querySelectorAll('is t')].map(t => t.textContent || '').join('');
        } else {
          value = cell.querySelector('v')?.textContent || '';
          if (type === 's') value = sharedStrings[Number(value)] || '';
        }
        row[index] = spreadsheetCellToText(value);
      });
      return row.map(cell => cell || '');
    }).filter(row => row.some(Boolean));
  }

  async function readPlantillaSpreadsheet(file) {
    const name = String(file?.name || '').toLowerCase();
    const buffer = await file.arrayBuffer();
    if (name.endsWith('.xlsx')) {
      const entries = await readZipEntries(buffer, new Set(['xl/sharedStrings.xml', 'xl/worksheets/sheet1.xml']));
      if (!entries['xl/worksheets/sheet1.xml']) throw new Error('No se encontró la primera hoja del Excel.');
      return parseWorksheetRows(entries['xl/worksheets/sheet1.xml'], parseSharedStrings(entries['xl/sharedStrings.xml']));
    }
    const text = new TextDecoder('utf-8').decode(buffer);
    if (/<table|<tr|<html/i.test(text)) return parseHtmlTableRows(text);
    return parseCsvRows(text);
  }

  function applyPlantillaImport(rows) {
    const summary = { read: 0, saved: 0, skipped: 0 };
    if (!rows.length) return summary;
    const headers = rows[0];
    const map = buildPlantillaColumnMap(headers);
    if (map.employeeNumber == null) throw new Error('No se encontró cabecera de Nº empleado.');
    const now = new Date().toISOString();
    const items = getPlantilla();
    const byEmployee = new Map(items.map((item, index) => [normalizeEmployeeKey(item.employeeNumber), index]));
    rows.slice(1).forEach(row => {
      if (!row.some(Boolean)) return;
      summary.read++;
      const employeeNumber = normalizeEmployeeNumber(row[map.employeeNumber]);
      if (!employeeNumber) {
        summary.skipped++;
        return;
      }
      const imported = {
        employeeNumber,
        name: map.name == null ? '' : normalizeText(row[map.name]),
        sex: map.sex == null ? '' : normalizeText(row[map.sex]).toUpperCase(),
        job: map.job == null ? '' : normalizeText(row[map.job]),
        positionSeniority: map.positionSeniority == null ? '' : normalizePlantillaDateOrText(row[map.positionSeniority]),
        level: map.level == null ? '' : normalizeText(row[map.level]).toUpperCase()
      };
      const key = normalizeEmployeeKey(employeeNumber);
      const existingIndex = byEmployee.get(key);
      if (existingIndex != null) {
        const current = items[existingIndex];
        items[existingIndex] = {
          ...current,
          employeeNumber: imported.employeeNumber || current.employeeNumber || '',
          name: map.name == null ? (current.name || '') : imported.name,
          sex: map.sex == null ? (current.sex || '') : (imported.sex ? normalizeSex(imported.sex) : ''),
          job: map.job == null ? (current.job || '') : imported.job,
          positionSeniority: map.positionSeniority == null || !imported.positionSeniority ? (current.positionSeniority || '') : imported.positionSeniority,
          level: map.level == null ? (current.level || '') : (imported.level ? normalizeLevel(imported.level) : ''),
          updatedAt: now
        };
      } else {
        const id = (window.crypto && typeof window.crypto.randomUUID === 'function') ? window.crypto.randomUUID() : `plant-${Date.now()}-${summary.saved}`;
        items.push({
          id,
          employeeNumber: imported.employeeNumber,
          name: imported.name,
          sex: imported.sex ? normalizeSex(imported.sex) : '',
          job: imported.job,
          positionSeniority: imported.positionSeniority,
          level: imported.level ? normalizeLevel(imported.level) : '',
          createdAt: now,
          updatedAt: now
        });
        byEmployee.set(key, items.length - 1);
      }
      summary.saved++;
    });
    setPlantilla(items);
    return summary;
  }

  async function importPlantillaExcelFromInput(event) {
    const input = event?.target;
    const file = input?.files?.[0];
    if (!file) return;
    const summaryEl = document.getElementById('plantillaImportSummary');
    try {
      const rows = await readPlantillaSpreadsheet(file);
      const summary = applyPlantillaImport(rows);
      renderPlantilla({ resetPage: true });
      if (typeof updateQuickCounts === 'function') updateQuickCounts();
      if (typeof renderHomeDashboard === 'function') renderHomeDashboard();
      const message = `Importación completada: ${summary.read} registros leídos · ${summary.saved} importados/actualizados · ${summary.skipped} omitidos por error.`;
      if (summaryEl) summaryEl.textContent = message;
      alert(message);
    } catch (error) {
      const message = `No se pudo importar la plantilla: ${error.message || error}`;
      if (summaryEl) summaryEl.textContent = message;
      alert(message);
    } finally {
      if (input) input.value = '';
    }
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
          <td>${htmlEscapeForPrint(formatPlantillaDate(item.positionSeniority))}</td>
          <td>${htmlEscapeForPrint(item.level || '')}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="7">Sin registros.</td></tr>`;
    const html = `<h1>Plantilla</h1><div class="date">Generado: ${new Date().toLocaleString('es-ES')}</div><table><thead><tr><th>#</th><th>Nº empleado</th><th>Nombre y apellidos</th><th>Sexo</th><th>Puesto de trabajo</th><th>Antig. Puesto</th><th>Nivel retributivo</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
    if (typeof openPrintPreviewWithHtml === 'function') openPrintPreviewWithHtml(html);
  }

  function exportPlantillaExcel() {
    const rows = sortedPlantilla();
    const excelData = {
      title: 'Plantilla',
      filename: 'plantilla',
      headers: ['Nº empleado', 'Nombre y apellidos', 'Sexo', 'Puesto de trabajo', 'Antig. Puesto', 'Nivel retributivo'],
      rows: rows.map(item => [item.employeeNumber || '', item.name || '', item.sex || '', item.job || '', formatPlantillaDate(item.positionSeniority), item.level || ''])
    };
    if (typeof exportExcelData === 'function') exportExcelData(excelData);
  }

  window.PlantillaModule = { getPlantilla, setPlantilla, togglePlantillaCreateForm, addPlantilla, deletePlantilla, openPlantillaEditModal, closePlantillaEditModal, saveEditingPlantilla, deleteEditingPlantilla, renderPlantilla, plantillaPreviousPage, plantillaNextPage, importPlantillaExcelFromInput, printPlantilla, exportPlantillaExcel };
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
  window.plantillaPreviousPage = plantillaPreviousPage;
  window.plantillaNextPage = plantillaNextPage;
  window.importPlantillaExcelFromInput = importPlantillaExcelFromInput;
  window.printPlantilla = printPlantilla;
  window.exportPlantillaExcel = exportPlantillaExcel;
})();
