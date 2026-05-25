// Módulo independiente de Criterios RRLL.
// Base interna de criterios, decisiones y antecedentes con búsqueda local.
(function () {
  'use strict';

  const STORAGE_KEY = 'rrll_criteria';
  const ORIGINS = ['Comité', 'Paritaria', 'Convenio', 'Dirección', 'Jurisprudencia', 'Criterio interno', 'Otro'];
  const CRITERIA_PAGE_SIZE = 50;
  let editingCriteriaId = null;
  let criteriaCurrentPage = 1;
  let criteriaLastSearchQuery = '';

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
      const aDate = String(a.date || '');
      const bDate = String(b.date || '');
      if (aDate && !bDate) return -1;
      if (!aDate && bDate) return 1;
      if (aDate && bDate) {
        const byDate = bDate.localeCompare(aDate);
        if (byDate !== 0) return byDate;
      }
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

  function getCriteriaPageCount(totalRows) {
    return Math.max(1, Math.ceil(totalRows / CRITERIA_PAGE_SIZE));
  }

  function getCriteriaPageRows(rows) {
    const pageCount = getCriteriaPageCount(rows.length);
    criteriaCurrentPage = Math.min(Math.max(criteriaCurrentPage, 1), pageCount);
    const start = (criteriaCurrentPage - 1) * CRITERIA_PAGE_SIZE;
    return rows.slice(start, start + CRITERIA_PAGE_SIZE);
  }

  function updateCriteriaPagination(filteredCount) {
    const pagination = document.getElementById('criteriaPagination');
    if (!pagination) return;
    const pageCount = getCriteriaPageCount(filteredCount);
    const shouldPaginate = filteredCount > CRITERIA_PAGE_SIZE;
    pagination.style.display = shouldPaginate ? 'flex' : 'none';
    pagination.innerHTML = `
      <button class="criteria-page-btn" type="button" onclick="changeCriteriaPage(-1)" ${criteriaCurrentPage <= 1 ? 'disabled' : ''} title="Página anterior" aria-label="Página anterior">←</button>
      <span class="criteria-page-info">Página ${criteriaCurrentPage} de ${pageCount}</span>
      <button class="criteria-page-btn" type="button" onclick="changeCriteriaPage(1)" ${criteriaCurrentPage >= pageCount ? 'disabled' : ''} title="Página siguiente" aria-label="Página siguiente">→</button>`;
  }

  function changeCriteriaPage(delta) {
    const rows = getVisibleCriteria();
    const pageCount = getCriteriaPageCount(rows.length);
    criteriaCurrentPage = Math.min(Math.max(criteriaCurrentPage + Number(delta || 0), 1), pageCount);
    renderCriteria({ preservePage: true });
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

  function criteriaImportSummaryMessage(summary) {
    return `Importación finalizada:\n- ${summary.imported} criterios importados.\n- ${summary.incomplete} filas omitidas por datos incompletos.\n- ${summary.duplicates} duplicados.`;
  }

  function normalizeCriteriaHeader(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function criteriaFieldAliases() {
    return {
      date: ['Fecha', 'Date'],
      subject: ['Motivo', 'Asunto', 'Motivo / asunto', 'Motivo asunto'],
      generalCriterion: ['Criterio general', 'Criterio', 'Decisión', 'Decision'],
      observations: ['Observaciones', 'Notas'],
      tags: ['Etiquetas', 'Palabras clave', 'Tags'],
      origin: ['Origen', 'Fuente']
    };
  }

  function buildCriteriaImportColumnMap(headers) {
    const normalizedHeaders = headers.map(normalizeCriteriaHeader);
    const map = {};
    Object.entries(criteriaFieldAliases()).forEach(([field, aliases]) => {
      const normalizedAliases = aliases.map(normalizeCriteriaHeader);
      const index = normalizedHeaders.findIndex(header => normalizedAliases.includes(header));
      if (index >= 0) map[field] = index;
    });
    return map;
  }

  function criteriaSpreadsheetCellToText(value) {
    return String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function parseCriteriaDelimitedRows(text) {
    const sample = String(text || '').split(/\r?\n/).slice(0, 5).join('\n');
    const delimiterCounts = {
      ';': (sample.match(/;/g) || []).length,
      '\t': (sample.match(/\t/g) || []).length,
      ',': (sample.match(/,/g) || []).length
    };
    const delimiter = Object.entries(delimiterCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || ';';
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (quoted && char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (!quoted && char === delimiter) {
        row.push(criteriaSpreadsheetCellToText(cell));
        cell = '';
      } else if (!quoted && (char === '\n' || char === '\r')) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(criteriaSpreadsheetCellToText(cell));
        if (row.some(Boolean)) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
    row.push(criteriaSpreadsheetCellToText(cell));
    if (row.some(Boolean)) rows.push(row);
    return rows;
  }

  function criteriaColumnLettersToIndex(ref) {
    const letters = String(ref || '').replace(/[^A-Z]/gi, '').toUpperCase();
    let index = 0;
    for (const letter of letters) index = (index * 26) + letter.charCodeAt(0) - 64;
    return Math.max(index - 1, 0);
  }

  function criteriaColumnIndexToLetters(index) {
    let number = index + 1;
    let letters = '';
    while (number > 0) {
      const remainder = (number - 1) % 26;
      letters = String.fromCharCode(65 + remainder) + letters;
      number = Math.floor((number - 1) / 26);
    }
    return letters;
  }

  async function inflateCriteriaZipEntry(bytes, compressionMethod) {
    if (compressionMethod === 0) return bytes;
    if (compressionMethod !== 8) throw new Error('El Excel usa un método de compresión no soportado.');
    if (typeof DecompressionStream !== 'function') throw new Error('Este entorno no permite descomprimir archivos .xlsx.');
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function decodeCriteriaUtf8(bytes) {
    return new TextDecoder('utf-8').decode(bytes);
  }

  async function readCriteriaZipEntries(buffer) {
    const data = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const entries = {};
    for (let i = data.length - 22; i >= 0; i -= 1) {
      if (view.getUint32(i, true) !== 0x06054b50) continue;
      const total = view.getUint16(i + 10, true);
      let offset = view.getUint32(i + 16, true);
      for (let e = 0; e < total; e += 1) {
        if (view.getUint32(offset, true) !== 0x02014b50) break;
        const method = view.getUint16(offset + 10, true);
        const compressedSize = view.getUint32(offset + 20, true);
        const fileNameLength = view.getUint16(offset + 28, true);
        const extraLength = view.getUint16(offset + 30, true);
        const commentLength = view.getUint16(offset + 32, true);
        const localOffset = view.getUint32(offset + 42, true);
        const fileName = decodeCriteriaUtf8(data.slice(offset + 46, offset + 46 + fileNameLength));
        const localNameLength = view.getUint16(localOffset + 26, true);
        const localExtraLength = view.getUint16(localOffset + 28, true);
        const dataStart = localOffset + 30 + localNameLength + localExtraLength;
        entries[fileName] = decodeCriteriaUtf8(await inflateCriteriaZipEntry(data.slice(dataStart, dataStart + compressedSize), method));
        offset += 46 + fileNameLength + extraLength + commentLength;
      }
      return entries;
    }
    throw new Error('No se pudo abrir el archivo Excel.');
  }

  function parseCriteriaSharedStrings(xmlText) {
    if (!xmlText) return [];
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    return [...doc.querySelectorAll('si')].map(si => [...si.querySelectorAll('t')].map(t => t.textContent || '').join(''));
  }

  function getFirstCriteriaWorksheetPath(entries) {
    const workbook = entries['xl/workbook.xml'];
    const rels = entries['xl/_rels/workbook.xml.rels'];
    if (!workbook || !rels) return 'xl/worksheets/sheet1.xml';
    const workbookDoc = new DOMParser().parseFromString(workbook, 'application/xml');
    const firstSheet = workbookDoc.querySelector('sheet');
    const relId = firstSheet?.getAttribute('r:id');
    if (!relId) return 'xl/worksheets/sheet1.xml';
    const relsDoc = new DOMParser().parseFromString(rels, 'application/xml');
    const relationship = [...relsDoc.querySelectorAll('Relationship')].find(rel => rel.getAttribute('Id') === relId);
    const target = relationship?.getAttribute('Target') || 'worksheets/sheet1.xml';
    return `xl/${target.replace(/^\//, '').replace(/^xl\//, '')}`;
  }

  function parseCriteriaWorksheetRows(xmlText, sharedStrings) {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    return [...doc.querySelectorAll('sheetData row')].map(rowNode => {
      const row = [];
      [...rowNode.querySelectorAll('c')].forEach(cell => {
        const index = criteriaColumnLettersToIndex(cell.getAttribute('r'));
        const type = cell.getAttribute('t');
        let value = '';
        if (type === 'inlineStr') {
          value = [...cell.querySelectorAll('is t')].map(t => t.textContent || '').join('');
        } else {
          value = cell.querySelector('v')?.textContent || '';
          if (type === 's') value = sharedStrings[Number(value)] || '';
        }
        row[index] = criteriaSpreadsheetCellToText(value);
      });
      return row.map(cell => cell || '');
    }).filter(row => row.some(Boolean));
  }

  async function readCriteriaImportRows(file) {
    const name = String(file?.name || '').toLowerCase();
    const buffer = await file.arrayBuffer();
    if (name.endsWith('.xlsx')) {
      const entries = await readCriteriaZipEntries(buffer);
      const worksheetPath = getFirstCriteriaWorksheetPath(entries);
      if (!entries[worksheetPath]) throw new Error('No se encontró la primera hoja del Excel.');
      return parseCriteriaWorksheetRows(entries[worksheetPath], parseCriteriaSharedStrings(entries['xl/sharedStrings.xml']));
    }
    return parseCriteriaDelimitedRows(new TextDecoder('utf-8').decode(buffer));
  }

  function normalizeCriteriaImportDate(value) {
    const raw = criteriaSpreadsheetCellToText(value);
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const dmy = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, '0');
      const month = dmy[2].padStart(2, '0');
      const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
      return `${year}-${month}-${day}`;
    }
    const serial = Number(raw.replace(',', '.'));
    if (Number.isFinite(serial) && serial > 1 && serial < 60000) {
      const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
      if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return raw;
  }

  function criteriaDuplicateKey(item) {
    return [
      normalizeCriteriaImportDate(item.date),
      normalizeCriteriaText(item.subject).replace(/\s+/g, ' '),
      normalizeCriteriaText(item.generalCriterion).replace(/\s+/g, ' ')
    ].join('|');
  }

  function createCriteriaId() {
    return crypto.randomUUID ? crypto.randomUUID() : `criteria-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function applyCriteriaImport(rows) {
    const summary = { imported: 0, incomplete: 0, duplicates: 0 };
    if (!rows.length) return summary;
    const map = buildCriteriaImportColumnMap(rows[0]);
    if (map.date == null || map.subject == null || map.generalCriterion == null) {
      throw new Error('No se encontraron las cabeceras obligatorias: Fecha, Motivo / asunto y Criterio general.');
    }
    const now = new Date().toISOString();
    const existing = getCriteria();
    const duplicateKeys = new Set(existing.map(criteriaDuplicateKey));
    const imported = [];

    rows.slice(1).forEach(row => {
      if (!row.some(Boolean)) return;
      const payload = {
        date: normalizeCriteriaImportDate(row[map.date]),
        subject: criteriaSpreadsheetCellToText(row[map.subject]),
        generalCriterion: criteriaSpreadsheetCellToText(row[map.generalCriterion]),
        observations: map.observations == null ? '' : criteriaSpreadsheetCellToText(row[map.observations]),
        tags: map.tags == null ? '' : criteriaSpreadsheetCellToText(row[map.tags]),
        origin: map.origin == null ? '' : criteriaSpreadsheetCellToText(row[map.origin])
      };
      if (!payload.date || !payload.subject || !payload.generalCriterion) {
        summary.incomplete += 1;
        return;
      }
      const key = criteriaDuplicateKey(payload);
      if (duplicateKeys.has(key)) {
        summary.duplicates += 1;
        return;
      }
      duplicateKeys.add(key);
      imported.push({ id: createCriteriaId(), ...payload, createdAt: now, updatedAt: now });
      summary.imported += 1;
    });

    if (imported.length) setCriteria([...imported, ...existing]);
    renderCriteria();
    return summary;
  }

  function ensureCriteriaImportModal() {
    let modal = document.getElementById('criteriaImportModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'criteriaImportModal';
    modal.className = 'modal-backdrop criteria-modal';
    modal.innerHTML = `
      <div class="modal-box rrll-pro-modal-box criteria-modal-box">
        <div class="modal-header">
          <h3>Importar criterios RRLL</h3>
          <button type="button" class="icon-button" onclick="closeCriteriaImportModal()">×</button>
        </div>
        <p class="rrll-pro-subtitle">Carga un fichero con criterios o descarga el modelo oficial para Excel.</p>
        <div class="rrll-pro-form-actions criteria-full-field">
          <button type="button" class="rrll-pro-primary" onclick="criteriaImportChooseFile()">Cargar fichero</button>
          <button type="button" class="rrll-pro-tool-button" onclick="downloadCriteriaImportTemplate()">Generar modelo</button>
          <button type="button" class="secondary" onclick="closeCriteriaImportModal()">Cancelar</button>
        </div>
        <input id="criteriaImportFileInput" type="file" accept=".xlsx,.csv,.txt,.tsv,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden />
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
      if (event.target === modal) closeCriteriaImportModal();
    });
    modal.querySelector('#criteriaImportFileInput')?.addEventListener('change', importCriteriaFromInput);
    return modal;
  }

  function openCriteriaImportModal() {
    ensureCriteriaImportModal().classList.add('open');
  }

  function closeCriteriaImportModal() {
    const modal = document.getElementById('criteriaImportModal');
    if (modal) modal.classList.remove('open');
  }

  function criteriaImportChooseFile() {
    const input = ensureCriteriaImportModal().querySelector('#criteriaImportFileInput');
    if (input) input.click();
  }

  async function importCriteriaFromInput(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const rows = await readCriteriaImportRows(file);
      const summary = applyCriteriaImport(rows);
      closeCriteriaImportModal();
      alert(criteriaImportSummaryMessage(summary));
    } catch (error) {
      console.error('Error importando criterios RRLL:', error);
      alert(`No se pudo importar el fichero. Detalle: ${error && error.message ? error.message : 'error desconocido'}`);
    } finally {
      event.target.value = '';
    }
  }

  function criteriaXmlEscape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildCriteriaWorksheetXml(rows) {
    const sheetRows = rows.map((row, rowIndex) => {
      const cells = row.map((value, columnIndex) => {
        const ref = `${criteriaColumnIndexToLetters(columnIndex)}${rowIndex + 1}`;
        return `<c r="${ref}" t="inlineStr"><is><t>${criteriaXmlEscape(value)}</t></is></c>`;
      }).join('');
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`;
  }

  function criteriaCrc32(bytes) {
    let crc = -1;
    for (const byte of bytes) {
      crc ^= byte;
      for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ -1) >>> 0;
  }

  function criteriaUint16(value) {
    return [value & 255, (value >>> 8) & 255];
  }

  function criteriaUint32(value) {
    return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];
  }

  function buildCriteriaXlsxBlob(sheetName, rows) {
    const enc = new TextEncoder();
    const files = [
      ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
      ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
      ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${criteriaXmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
      ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ['xl/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="1"><xf xfId="0"/></cellXfs></styleSheet>`],
      ['xl/worksheets/sheet1.xml', buildCriteriaWorksheetXml(rows)]
    ].map(([name, content]) => ({ name, nameBytes: enc.encode(name), bytes: enc.encode(content) }));
    const chunks = [];
    const central = [];
    let offset = 0;
    files.forEach(file => {
      const crc = criteriaCrc32(file.bytes);
      const local = new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...criteriaUint16(20), ...criteriaUint16(0), ...criteriaUint16(0), ...criteriaUint16(0), ...criteriaUint16(0), ...criteriaUint32(crc), ...criteriaUint32(file.bytes.length), ...criteriaUint32(file.bytes.length), ...criteriaUint16(file.nameBytes.length), ...criteriaUint16(0)]);
      chunks.push(local, file.nameBytes, file.bytes);
      central.push({ ...file, crc, offset });
      offset += local.length + file.nameBytes.length + file.bytes.length;
    });
    const centralStart = offset;
    central.forEach(file => {
      const header = new Uint8Array([0x50, 0x4b, 0x01, 0x02, ...criteriaUint16(20), ...criteriaUint16(20), ...criteriaUint16(0), ...criteriaUint16(0), ...criteriaUint16(0), ...criteriaUint16(0), ...criteriaUint32(file.crc), ...criteriaUint32(file.bytes.length), ...criteriaUint32(file.bytes.length), ...criteriaUint16(file.nameBytes.length), ...criteriaUint16(0), ...criteriaUint16(0), ...criteriaUint16(0), ...criteriaUint16(0), ...criteriaUint32(0), ...criteriaUint32(file.offset)]);
      chunks.push(header, file.nameBytes);
      offset += header.length + file.nameBytes.length;
    });
    const centralSize = offset - centralStart;
    chunks.push(new Uint8Array([0x50, 0x4b, 0x05, 0x06, ...criteriaUint16(0), ...criteriaUint16(0), ...criteriaUint16(files.length), ...criteriaUint16(files.length), ...criteriaUint32(centralSize), ...criteriaUint32(centralStart), ...criteriaUint16(0)]));
    return new Blob(chunks, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  function downloadCriteriaImportTemplate() {
    const rows = [[
      'Fecha',
      'Motivo / asunto',
      'Criterio general',
      'Observaciones',
      'Etiquetas',
      'Origen'
    ], [
      '16/05/2026',
      'Vales de comida',
      'La actualización queda condicionada a los límites aplicables y al criterio acordado en Comisión Paritaria.',
      'Revisar antecedentes y actas relacionadas.',
      'vales comida; masa salarial; paritaria',
      'Paritaria'
    ]];
    const url = URL.createObjectURL(buildCriteriaXlsxBlob('Criterios RRLL', rows));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_criterios_rrll.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
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

  async function openCriteriaEditModal(criteriaId) {
    const lock = await window.acquireEditingLock?.("criterio", criteriaId);
    if (lock && lock.allowed === false) {
      window.showEditingLockBlockedMessage?.(lock.lock);
      return;
    }
    const item = getCriteria().find(criteria => criteria.id === criteriaId);
    if (!item) return;
    editingCriteriaId = criteriaId;
    window.startEditingLockHeartbeat?.("criterio", criteriaId);
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
    const closingId = editingCriteriaId;
    editingCriteriaId = null;
    if (closingId) {
      window.clearEditingLockHeartbeat?.("criterio", closingId);
      try { window.clearEditingLock?.("criterio", closingId); } catch (error) { console.warn("No se pudo liberar lock al cerrar modal de criterio:", error); }
    }
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
    try { window.clearEditingLock?.("criterio", criteriaId); } catch (error) { console.warn("No se pudo liberar lock al eliminar criterio:", error); }
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
        <td class="rrll-pro-actions criteria-actions-cell"><button class="small danger rrll-delete-icon-button" type="button" onclick="event.stopPropagation(); deleteCriteria('${escapeHtml(item.id)}')" title="Eliminar criterio" aria-label="Eliminar criterio"><svg class="rrll-delete-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg></button></td>
      </tr>`;
  }

  function renderCriteria(options = {}) {
    const query = getCriteriaSearchQuery();
    if (!options.preservePage && query !== criteriaLastSearchQuery) {
      criteriaCurrentPage = 1;
    }
    criteriaLastSearchQuery = query;

    const rows = getVisibleCriteria();
    const pageRows = getCriteriaPageRows(rows);
    const body = document.getElementById('criteriaTableBody');
    const empty = document.getElementById('criteriaEmptyState');
    const count = document.getElementById('criteriaCount');
    const summary = document.getElementById('summary-count-criteria');
    const total = getCriteria().length;

    if (body) body.innerHTML = pageRows.map(criteriaRowHtml).join('');
    if (empty) empty.style.display = rows.length ? 'none' : 'block';
    if (count) count.textContent = `${rows.length} de ${total}`;
    if (summary) summary.textContent = `${total} criterios`;
    updateCriteriaPagination(rows.length);
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
    changeCriteriaPage,
    openCriteriaEditModal,
    closeCriteriaEditModal,
    saveEditingCriteria,
    deleteCriteria,
    printCriteria,
    exportCriteriaExcel,
    openCriteriaImportModal,
    closeCriteriaImportModal,
    criteriaImportChooseFile,
    importCriteriaFromInput,
    downloadCriteriaImportTemplate,
    applyCriteriaImport,
    readCriteriaImportRows,
    buildCriteriaXlsxBlob
  };

  window.getCriteria = getCriteria;
  window.setCriteria = setCriteria;
  window.getVisibleCriteria = getVisibleCriteria;
  window.toggleCriteriaCreateForm = toggleCriteriaCreateForm;
  window.addCriteria = addCriteria;
  window.renderCriteria = renderCriteria;
  window.changeCriteriaPage = changeCriteriaPage;
  window.openCriteriaEditModal = openCriteriaEditModal;
  window.closeCriteriaEditModal = closeCriteriaEditModal;
  window.saveEditingCriteria = saveEditingCriteria;
  window.deleteCriteria = deleteCriteria;
  window.deleteEditingCriteria = deleteEditingCriteria;
  window.printCriteria = printCriteria;
  window.exportCriteriaExcel = exportCriteriaExcel;
  window.openCriteriaImportModal = openCriteriaImportModal;
  window.closeCriteriaImportModal = closeCriteriaImportModal;
  window.criteriaImportChooseFile = criteriaImportChooseFile;
  window.importCriteriaFromInput = importCriteriaFromInput;
  window.downloadCriteriaImportTemplate = downloadCriteriaImportTemplate;
})();
