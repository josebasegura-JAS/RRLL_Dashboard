// Gestor de Plantilla.
// Registro de personas de plantilla con datos básicos profesionales.
(function () {
  'use strict';

  const KEY = 'rrll_plantilla';
  const LEVELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'JU'];
  const PLANTILLA_PAGE_SIZE = 30;
  let plantillaCurrentPage = 1;
  const ELECTORAL_MESAS = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5'];
  let plantillaElectoralView = false;
  let electoralSelectedColegio = 'Todos';
  let electoralSelectedMesa = 'Todos';
  let electoralSelectedSindicato = 'Todos';
  let electoralSelectedRecorrido = 'Todos';
  let plantillaSchemaEnsured = false;
  let plantillaLoadDiagnosticsShown = false;
  const RRLL_IMPORT_KEY = 'rrll_recorridos_mesa';
  const MESAS_KEY = 'rrll_mesas_electorales';
  const PLANTILLA_MODEL_COLUMNS = [
    { key: 'employeeNumber', label: 'Nº empleado' },
    { key: 'nombreCompleto', label: 'Nombre completo' },
    { key: 'job', label: 'Puesto' },
    { key: 'sexo', label: 'Sexo' },
    { key: 'level', label: 'Nivel' },
    { key: 'colegioElectoral', label: 'Colegio electoral' },
    { key: 'mesaElectoral', label: 'Mesa electoral' },
    { key: 'sindicato', label: 'Sindicato' },
    { key: 'participacionEstimada', label: 'Participación estimada' },
    { key: 'recorridoActivo', label: 'Recorrido activo' },
    { key: 'estacionBase', label: 'Estación base' },
    { key: 'observacionesRecorrido', label: 'Observaciones recorrido' }
  ];


  function resolvePlantillaItems(raw) {
    if (Array.isArray(raw)) return { items: raw, source: 'array' };
    if (raw && typeof raw === 'object') {
      if (Array.isArray(raw.items)) return { items: raw.items, source: 'items' };
      if (Array.isArray(raw.data)) return { items: raw.data, source: 'data' };
      if (Array.isArray(raw.plantilla)) return { items: raw.plantilla, source: 'plantilla' };
    }
    return { items: [], source: 'empty' };
  }

  function collectPlantillaLikeKeysFromObject(source) {
    if (!source || typeof source !== 'object') return [];
    return Object.keys(source).filter(key => /plantilla|plant|employee|personal/i.test(String(key || '')));
  }

  function showPlantillaLoadDiagnostics(raw, resolved) {
    if (plantillaLoadDiagnosticsShown) return;
    const firstRecord = Array.isArray(resolved.items) && resolved.items[0] && typeof resolved.items[0] === 'object' ? resolved.items[0] : null;
    const cacheKeys = collectPlantillaLikeKeysFromObject(window.rrllDatabaseCache || (typeof rrllDatabaseCache !== 'undefined' ? rrllDatabaseCache : null));
    const localStorageKeys = [];
    try {
      for (let idx = 0; idx < window.localStorage.length; idx++) {
        const key = window.localStorage.key(idx);
        if (key && /plantilla|plant|employee|personal/i.test(key)) localStorageKeys.push(key);
      }
    } catch (error) {
      console.warn('[Plantilla][diagnóstico] No se pudo leer localStorage:', error);
    }
    console.groupCollapsed('[Plantilla][diagnóstico de carga]');
    console.info("load('rrll_plantilla', null) bruto:", raw);
    console.info('tipo de dato:', raw === null ? 'null' : typeof raw);
    console.info('es array:', Array.isArray(raw));
    console.info('registros detectados:', resolved.items.length);
    console.info('claves primer registro:', firstRecord ? Object.keys(firstRecord) : []);
    console.info('fuente usada:', resolved.source);
    console.info('rrllDatabaseCache existe:', !!(window.rrllDatabaseCache || (typeof rrllDatabaseCache !== 'undefined' ? rrllDatabaseCache : null)));
    console.info('claves cache relacionadas:', cacheKeys);
    console.info('claves localStorage relacionadas:', localStorageKeys);
    console.groupEnd();
    plantillaLoadDiagnosticsShown = true;
  }

  function findPlantillaFallbackRaw() {
    const sources = [];
    const cache = window.rrllDatabaseCache || (typeof rrllDatabaseCache !== 'undefined' ? rrllDatabaseCache : null);
    if (cache && typeof cache === 'object') sources.push({ sourceName: 'rrllDatabaseCache', source: cache });
    if (window.localStorage) {
      const localMap = {};
      for (let idx = 0; idx < window.localStorage.length; idx++) {
        const key = window.localStorage.key(idx);
        if (!key || !/plantilla|plant|employee|personal/i.test(key)) continue;
        localMap[key] = load(key, null);
      }
      sources.push({ sourceName: 'localStorage/load()', source: localMap });
    }
    for (const { sourceName, source } of sources) {
      const keys = collectPlantillaLikeKeysFromObject(source);
      for (const key of keys) {
        const candidate = source[key];
        const resolved = resolvePlantillaItems(candidate);
        if (resolved.items.length) return { items: resolved.items, source: `${sourceName}:${key}:${resolved.source}` };
      }
    }
    return { items: [], source: 'none' };
  }

  function getPlantilla() {
    const raw = load(KEY, null);
    let resolved = resolvePlantillaItems(raw);
    if (!resolved.items.length) {
      const fallback = findPlantillaFallbackRaw();
      if (fallback.items.length) resolved = fallback;
    }
    showPlantillaLoadDiagnostics(raw, resolved);
    return Array.isArray(resolved.items) ? resolved.items : [];
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

  function normalizeLevel(value) {
    return LEVELS.includes(value) ? value : 'A';
  }
  function normalizeBoolean(value) {
    const text = normalizeHeader(value);
    if (!text) return false;
    if (['si', 'sí', 's', 'true', '1', 'yes'].includes(text)) return true;
    if (['no', 'false', '0'].includes(text)) return false;
    return false;
  }
  function normalizeMesaElectoral(value) {
    const text = normalizeText(value);
    if (!text) return '';
    const match = normalizeHeader(text).match(/(?:mesa )?([1-5])$/);
    if (!match) return text;
    return `Mesa ${match[1]}`;
  }

  function getField(item, ...keys) {
    for (const key of keys) {
      if (item && Object.prototype.hasOwnProperty.call(item, key) && item[key] != null) return item[key];
    }
    return '';
  }


  function getPlantillaNombreCompleto(persona) {
    const fromCanonical = normalizeText(getField(persona, 'nombreCompleto'));
    const fromSnake = normalizeText(getField(persona, 'nombre_completo'));
    const fromFullName = normalizeText(getField(persona, 'fullName'));
    const fromSolicitante = normalizeText(getField(persona, 'solicitante'));
    const fromLegacyName = normalizeText(getField(persona, 'name', 'nombre'));
    const fromLegacyLastName = normalizeText(getField(persona, 'lastName', 'apellidos'));
    return fromCanonical || fromSnake || fromFullName || fromSolicitante || normalizeText([fromLegacyName, fromLegacyLastName].filter(Boolean).join(' ')) || '';
  }

  function normalizePlantillaPerson(persona) {
    if (!persona || typeof persona !== 'object') return persona;
    const nombreCompleto = getPlantillaNombreCompleto(persona);
    return {
      ...persona,
      ...(Object.prototype.hasOwnProperty.call(persona, 'nombreCompleto') ? {} : { nombreCompleto }),
      ...(Object.prototype.hasOwnProperty.call(persona, 'fullName') ? {} : { fullName: nombreCompleto }),
      ...(Object.prototype.hasOwnProperty.call(persona, 'name') ? {} : { name: nombreCompleto })
    };
  }

  function resolveNombreCompleto(item) {
    return getPlantillaNombreCompleto(item);
  }

  function resolveSexo(item) {
    return normalizeText(getField(item, 'sexo', 'unit', 'unidad'));
  }

  function normalizeSindicato(value) {
    return normalizeText(value) || 'Sin asignar';
  }
  function plantillaDisplayDefaults(item) {
    const colegio = normalizeText(getField(item, 'colegioElectoral', 'colegio_electoral')) || 'Sin definir';
    const mesa = normalizeText(getField(item, 'mesaElectoral', 'mesa_electoral')) || 'Sin definir';
    const sindicato = normalizeSindicato(getField(item, 'sindicato'));
    const participacion = normalizeText(getField(item, 'participacionEstimada', 'participacion_estimada')) || '—';
    const recorridoActivo = !!getField(item, 'recorridoActivo', 'recorrido_activo');
    const estacionBase = normalizeText(getField(item, 'estacionBase', 'estacion_base')) || '—';
    const observaciones = normalizeText(getField(item, 'observacionesRecorrido', 'observaciones_recorrido')) || '—';
    return { colegio, mesa, sindicato, participacion, recorridoActivo, estacionBase, observaciones };
  }
  function getConfiguredSindicatos() {
    const unions = load('rrll_allegation_unions', []);
    return (Array.isArray(unions) ? unions : []).map(normalizeText).filter(Boolean);
  }
  function ensurePlantillaSchema() {
    if (plantillaSchemaEnsured) return;

    const items = getPlantilla();
    if (!items.length) {
      plantillaSchemaEnsured = true;
      return;
    }

    let hasChanges = false;
    const normalizedItems = items.map(item => {
      const colegio = normalizeText(getField(item, 'colegioElectoral', 'colegio_electoral'));
      const mesa = normalizeText(getField(item, 'mesaElectoral', 'mesa_electoral'));
      const participacion = normalizeText(getField(item, 'participacionEstimada', 'participacion_estimada'));
      const recorrido = !!getField(item, 'recorridoActivo', 'recorrido_activo');
      const estacionBase = normalizeText(getField(item, 'estacionBase', 'estacion_base'));
      const observaciones = normalizeText(getField(item, 'observacionesRecorrido', 'observaciones_recorrido'));
      const nombreCompleto = resolveNombreCompleto(item);
      const sexo = resolveSexo(item);
      const normalizedItem = normalizePlantillaPerson({
        ...item,
        nombreCompleto,
        fullName: normalizeText(getField(item, 'fullName')) || nombreCompleto,
        name: normalizeText(getField(item, 'name')) || nombreCompleto,
        sexo,
        unit: normalizeText(getField(item, 'unit')) || sexo,
        ...(Object.prototype.hasOwnProperty.call(item, 'colegioElectoral') ? {} : { colegioElectoral: colegio }),
        ...(Object.prototype.hasOwnProperty.call(item, 'colegio_electoral') ? {} : { colegio_electoral: colegio }),
        ...(Object.prototype.hasOwnProperty.call(item, 'mesaElectoral') ? {} : { mesaElectoral: mesa }),
        ...(Object.prototype.hasOwnProperty.call(item, 'mesa_electoral') ? {} : { mesa_electoral: mesa }),
        ...(Object.prototype.hasOwnProperty.call(item, 'sindicato') ? {} : { sindicato: normalizeText(getField(item, 'sindicato')) }),
        ...(Object.prototype.hasOwnProperty.call(item, 'participacionEstimada') ? {} : { participacionEstimada: participacion }),
        ...(Object.prototype.hasOwnProperty.call(item, 'participacion_estimada') ? {} : { participacion_estimada: participacion }),
        ...(Object.prototype.hasOwnProperty.call(item, 'recorridoActivo') ? {} : { recorridoActivo: recorrido }),
        ...(Object.prototype.hasOwnProperty.call(item, 'recorrido_activo') ? {} : { recorrido_activo: recorrido }),
        ...(Object.prototype.hasOwnProperty.call(item, 'estacionBase') ? {} : { estacionBase }),
        ...(Object.prototype.hasOwnProperty.call(item, 'estacion_base') ? {} : { estacion_base: estacionBase }),
        ...(Object.prototype.hasOwnProperty.call(item, 'observacionesRecorrido') ? {} : { observacionesRecorrido: observaciones }),
        ...(Object.prototype.hasOwnProperty.call(item, 'observaciones_recorrido') ? {} : { observaciones_recorrido: observaciones })
      });
      if (!hasChanges) {
        hasChanges = ['colegioElectoral', 'colegio_electoral', 'mesaElectoral', 'mesa_electoral', 'participacionEstimada', 'participacion_estimada', 'recorridoActivo', 'recorrido_activo', 'estacionBase', 'estacion_base', 'observacionesRecorrido', 'observaciones_recorrido']
          .some(key => item[key] !== normalizedItem[key]);
      }
      return normalizedItem;
    });

    if (hasChanges && normalizedItems.length) setPlantilla(normalizedItems);

    if (!Array.isArray(load(MESAS_KEY, null))) save(MESAS_KEY, ELECTORAL_MESAS.map((nombre, idx) => ({ id: idx + 1, nombre_mesa: nombre, colegio_electoral: '' })));
    if (!Array.isArray(load(RRLL_IMPORT_KEY, null))) save(RRLL_IMPORT_KEY, []);

    plantillaSchemaEnsured = true;
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
    return String(resolveNombreCompleto(a) || '').localeCompare(String(resolveNombreCompleto(b) || ''), 'es', { sensitivity: 'base' });
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
    const nameEl = document.getElementById('newPlantNombreCompleto');
    const jobEl = document.getElementById('newPlantJob');
    const ageEl = document.getElementById('newPlantPositionSeniority');
    const levelEl = document.getElementById('newPlantLevel');
    if (!employeeEl || !nameEl || !jobEl || !levelEl) return;

    const employeeNumber = normalizeEmployeeNumber(employeeEl.value);
    const name = normalizeText(nameEl.value);
    const job = normalizeText(jobEl.value);
    const positionSeniority = normalizePlantillaDate(ageEl?.value);
    const level = normalizeLevel(levelEl.value);
    const colegioElectoral = normalizeText(document.getElementById('newPlantColegioElectoral')?.value);
    const mesaElectoral = normalizeText(document.getElementById('newPlantMesaElectoral')?.value);
    const sindicato = normalizeText(document.getElementById('newPlantSindicato')?.value);
    const participacionEstimada = normalizeText(document.getElementById('newPlantParticipacionEstimada')?.value);
    const recorridoActivo = !!document.getElementById('newPlantRecorridoActivo')?.checked;
    const estacionBase = normalizeText(document.getElementById('newPlantEstacionBase')?.value);
    const observacionesRecorrido = normalizeText(document.getElementById('newPlantObservacionesRecorrido')?.value);

    if (!employeeNumber || !name || !job) {
      alert('Introduce Nº empleado, nombre completo, y puesto de trabajo.');
      return;
    }

    const now = new Date().toISOString();
    const id = (window.crypto && typeof window.crypto.randomUUID === 'function') ? window.crypto.randomUUID() : `plant-${Date.now()}`;
    const items = getPlantilla();
    items.push({ id, employeeNumber, nombreCompleto: name, fullName: name, name, colegioElectoral, colegio_electoral: colegioElectoral, mesaElectoral, mesa_electoral: mesaElectoral, sindicato, participacionEstimada, participacion_estimada: participacionEstimada, recorridoActivo, recorrido_activo: recorridoActivo, estacionBase, estacion_base: estacionBase, observacionesRecorrido, observaciones_recorrido: observacionesRecorrido, job, positionSeniority, level, createdAt: now, updatedAt: now });
    setPlantilla(items);

    employeeEl.value = '';
    nameEl.value = '';
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
            <span>Nombre completo</span>
            <input id="editPlantNombreCompleto" placeholder="Nombre completo" />
          </label>
          <label class="rrll-pro-field"><span>Colegio electoral</span><input id="editPlantColegioElectoral" list="plantillaColegioElectoralOptions" /></label>
          <label class="rrll-pro-field"><span>Mesa electoral</span><select id="editPlantMesaElectoral">${ELECTORAL_MESAS.map(m => `<option value="${m}">${m}</option>`).join('')}</select></label>
          <label class="rrll-pro-field"><span>Sindicato</span><select id="editPlantSindicato"></select></label>
          <label class="rrll-pro-field"><span>Participación estimada (%)</span><input id="editPlantParticipacionEstimada" type="number" min="0" max="100" step="0.01" /></label>
          <label class="rrll-pro-field rrll-pro-field-checkbox"><span>Recorrido activo</span><input id="editPlantRecorridoActivo" type="checkbox" /></label>
          <label class="rrll-pro-field"><span>Estación base</span><input id="editPlantEstacionBase" /></label>
          <label class="rrll-pro-field full"><span>Observaciones recorrido</span><textarea id="editPlantObservacionesRecorrido"></textarea></label>
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
    fillSindicatoSelect('editPlantSindicato', getField(item, 'sindicato'));
    document.getElementById('editPlantEmployeeNumber').value = item.employeeNumber || '';
    document.getElementById('editPlantNombreCompleto').value = resolveNombreCompleto(item) || '';
    document.getElementById('editPlantColegioElectoral').value = getField(item, 'colegioElectoral', 'colegio_electoral') || '';
    document.getElementById('editPlantMesaElectoral').value = getField(item, 'mesaElectoral', 'mesa_electoral') || '';
    document.getElementById('editPlantSindicato').value = getField(item, 'sindicato') || '';
    document.getElementById('editPlantParticipacionEstimada').value = getField(item, 'participacionEstimada', 'participacion_estimada') || '';
    document.getElementById('editPlantRecorridoActivo').checked = !!getField(item, 'recorridoActivo', 'recorrido_activo');
    document.getElementById('editPlantEstacionBase').value = getField(item, 'estacionBase', 'estacion_base') || '';
    document.getElementById('editPlantObservacionesRecorrido').value = getField(item, 'observacionesRecorrido', 'observaciones_recorrido') || '';
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
    const name = normalizeText(document.getElementById('editPlantNombreCompleto')?.value);
    const job = normalizeText(document.getElementById('editPlantJob')?.value);
    const positionSeniorityInput = normalizeText(document.getElementById('editPlantPositionSeniority')?.value);
    const previousItem = getPlantilla().find(item => item.id === editingPlantillaId);
    const previousPositionSeniority = previousItem?.positionSeniority || '';
    const positionSeniority = positionSeniorityInput
      ? normalizePlantillaDate(positionSeniorityInput)
      : (normalizePlantillaDate(previousPositionSeniority) ? '' : previousPositionSeniority);
    const level = normalizeLevel(document.getElementById('editPlantLevel')?.value);
    const colegioElectoral = normalizeText(document.getElementById('editPlantColegioElectoral')?.value);
    const mesaElectoral = normalizeText(document.getElementById('editPlantMesaElectoral')?.value);
    const sindicato = normalizeText(document.getElementById('editPlantSindicato')?.value);
    const participacionEstimada = normalizeText(document.getElementById('editPlantParticipacionEstimada')?.value);
    const recorridoActivo = !!document.getElementById('editPlantRecorridoActivo')?.checked;
    const estacionBase = normalizeText(document.getElementById('editPlantEstacionBase')?.value);
    const observacionesRecorrido = normalizeText(document.getElementById('editPlantObservacionesRecorrido')?.value);
    if (!employeeNumber || !name || !job) {
      alert('Introduce Nº empleado, nombre completo, y puesto de trabajo.');
      return;
    }
    setPlantilla(getPlantilla().map(item => item.id === editingPlantillaId ? {
      ...item,
      employeeNumber,
      nombreCompleto: name,
      fullName: name,
      name,
      colegioElectoral, colegio_electoral: colegioElectoral, mesaElectoral, mesa_electoral: mesaElectoral, sindicato, participacionEstimada, participacion_estimada: participacionEstimada, recorridoActivo, recorrido_activo: recorridoActivo, estacionBase, estacion_base: estacionBase, observacionesRecorrido, observaciones_recorrido: observacionesRecorrido,
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
    const nombreCompleto = resolveNombreCompleto(item);
    return `
      <tr id="rrll-plant-${item.id}" class="rrll-pro-row plantilla-row" ondblclick="event.preventDefault(); event.stopPropagation(); openPlantillaEditModal('${item.id}')" title="Doble clic para editar">
        <td><strong>${escapeHtml(item.employeeNumber || '')}</strong></td>
        <td class="plantilla-col-nombre-completo rrll-pro-main-cell"><div class="rrll-pro-title">${escapeHtml(nombreCompleto || 'Sin nombre')}</div></td>
        <td>${escapeHtml(item.job || '—')}</td>
        <td>${escapeHtml(resolveSexo(item) || '—')}</td>
        <td><span class="rrll-status-pill progress">${escapeHtml(item.level || '—')}</span></td>
        <td class="rrll-pro-actions plantilla-actions-cell"><button class="small danger rrll-delete-icon-button rrll-danger-icon-button" type="button" onclick="event.stopPropagation(); deletePlantilla('${item.id}')" title="Eliminar" aria-label="Eliminar"><span aria-hidden="true">🗑️</span></button></td>
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
    ensurePlantillaSchema();
    if (!options.preserveView) togglePlantillaElectoralView(false);
    fillSindicatoSelect('newPlantSindicato', document.getElementById('newPlantSindicato')?.value || "Sin asignar");
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
    const head = body?.closest('table')?.querySelector('thead');
    if (head) head.innerHTML = '<tr><th>Nº empleado</th><th>Nombre completo</th><th>Puesto</th><th>Sexo</th><th>Nivel</th><th>Acciones</th></tr>';
    if (body) body.innerHTML = visibleRows.map(rowHtml).join('');
    if (empty) empty.style.display = rows.length ? 'none' : 'block';
    if (count) count.textContent = rows.length;
    if (summary) summary.textContent = `${rows.length} personas`;
    document.querySelectorAll('#gestor-plantilla .plantilla-toolbar .rrll-pro-list-actions .rrll-pro-tool-button').forEach(button => {
      const label = normalizeText(button.textContent);
      const isTextAction = ['Elecciones sindicales', 'Importar RRLL', '+ Crear plantilla', 'Crear plantilla', 'Descargar modelo'].includes(label);
      button.classList.toggle('plantilla-text-action', isTextAction);
    });
    const tableContainer = document.querySelector('#plantillaMainListView .rrll-pro-table-wrap');
    if (tableContainer) tableContainer.style.overflowX = 'auto';
    ensurePlantillaModelDownloadButton();
    renderPlantillaPagination(rows.length);
    renderPlantillaElectoral();
  }
  function ensurePlantillaModelDownloadButton() {
    const toolbar = document.querySelector('#gestor-plantilla .plantilla-toolbar .rrll-pro-list-actions');
    if (!toolbar || toolbar.querySelector('[data-plantilla-model-download="1"]')) return;
    toolbar.insertAdjacentHTML('beforeend', '<button type="button" class="rrll-pro-tool-button plantilla-text-action" data-plantilla-model-download="1" onclick="downloadPlantillaModelExcel()">Descargar modelo</button>');
  }

  function getElectoralVisibleRows() {
    return getPlantilla()
      .filter(item => electoralSelectedColegio === 'Todos' || plantillaDisplayDefaults(item).colegio === electoralSelectedColegio)
      .filter(item => electoralSelectedMesa === 'Todos' || plantillaDisplayDefaults(item).mesa === electoralSelectedMesa)
      .filter(item => electoralSelectedSindicato === 'Todos' || plantillaDisplayDefaults(item).sindicato === electoralSelectedSindicato)
      .filter(item => {
        if (electoralSelectedRecorrido === 'Todos') return true;
        const isActive = !!getField(item, 'recorridoActivo', 'recorrido_activo');
        return electoralSelectedRecorrido === 'Sí' ? isActive : !isActive;
      });
  }

  function togglePlantillaElectoralView(open) {
    plantillaElectoralView = !!open;
    document.getElementById('plantillaMainListView')?.classList.toggle('hidden', plantillaElectoralView);
    document.getElementById('plantillaElectoralView')?.classList.toggle('hidden', !plantillaElectoralView);
    renderPlantillaElectoral();
  }

  function renderPlantillaElectoral() {
    const wrap = document.getElementById('plantillaElectoralView');
    if (!wrap || !plantillaElectoralView) return;
    const all = getPlantilla();
    const colegios = ['Todos', ...new Set(all.map(item => plantillaDisplayDefaults(item).colegio))];
    const mesas = ['Todos', ...new Set(all.map(item => plantillaDisplayDefaults(item).mesa))];
    const sindicatos = ['Todos', ...new Set(all.map(item => plantillaDisplayDefaults(item).sindicato))];
    if (!colegios.includes(electoralSelectedColegio)) electoralSelectedColegio = 'Todos';
    if (!sindicatos.includes(electoralSelectedSindicato)) electoralSelectedSindicato = 'Todos';
    const visibleRows = getElectoralVisibleRows().sort((a, b) => normalizeSindicato(getField(a, 'sindicato')).localeCompare(normalizeSindicato(getField(b, 'sindicato')), 'es') || normalizeText(resolveNombreCompleto(a)).localeCompare(normalizeText(resolveNombreCompleto(b)), 'es'));
    const bySind = new Map();
    visibleRows.forEach(item => {
      const k = normalizeSindicato(getField(item, 'sindicato'));
      bySind.set(k, (bySind.get(k) || 0) + 1);
    });
    const selectMesa = document.getElementById('electoralMesa');
    if (selectMesa) {
      selectMesa.innerHTML = mesas.map(v => `<option ${v === electoralSelectedMesa ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('');
      if (!mesas.includes(electoralSelectedMesa)) electoralSelectedMesa = 'Todos';
      selectMesa.value = electoralSelectedMesa;
    }
    const colegioSelect = document.getElementById('electoralColegio');
    if (colegioSelect) colegioSelect.innerHTML = colegios.map(v => `<option ${v === electoralSelectedColegio ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('');
    const extraFilters = document.getElementById('electoralExtraFilters');
    if (!extraFilters) {
      const filtersHtml = `
        <div id="electoralExtraFilters" class="rrll-pro-task-form">
          <label class="rrll-pro-field"><span>Sindicato</span><select id="electoralSindicato" onchange="setElectoralSindicato(this.value)"></select></label>
          <label class="rrll-pro-field"><span>Recorrido activo</span><select id="electoralRecorrido" onchange="setElectoralRecorrido(this.value)"><option value="Todos">Todos</option><option value="Sí">Sí</option><option value="No">No</option></select></label>
        </div>`;
      document.getElementById('electoralColegio')?.closest('.rrll-pro-task-form')?.insertAdjacentHTML('afterend', filtersHtml);
    }
    const sindicatoSelect = document.getElementById('electoralSindicato');
    if (sindicatoSelect) sindicatoSelect.innerHTML = sindicatos.map(v => `<option ${v === electoralSelectedSindicato ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('');
    const recorridoSelect = document.getElementById('electoralRecorrido');
    if (recorridoSelect) recorridoSelect.value = electoralSelectedRecorrido;
    const mesaButtons = [...wrap.querySelectorAll('.rrll-pro-list-actions button')].filter(btn => /^Mesa \d+$/i.test(normalizeText(btn.textContent)));
    mesaButtons.forEach(btn => btn.classList.toggle('rrll-pro-primary', normalizeText(btn.textContent) === electoralSelectedMesa));
    const mesaTitle = document.getElementById('electoralMesaTitle');
    if (mesaTitle) mesaTitle.textContent = `${electoralSelectedMesa} — Total personas: ${visibleRows.length}`;
    const electoralMainTable = document.getElementById('electoralTableBody')?.closest('table');
    const electoralSummaryTable = document.getElementById('electoralSummaryBody')?.closest('table');
    if (electoralMainTable) electoralMainTable.querySelector('thead').innerHTML = '<tr><th>Persona</th><th>Colegio electoral</th><th>Mesa electoral</th><th>Sindicato</th><th>Participación estimada</th><th>Recorrido activo</th><th>Estación base</th><th>Observaciones recorrido</th></tr>';
    if (electoralSummaryTable) electoralSummaryTable.querySelector('thead').innerHTML = '<tr><th>Sindicato</th><th>Personas</th><th>% sobre total visible</th></tr>';
    const tableBody = document.getElementById('electoralTableBody');
    if (tableBody) tableBody.innerHTML = visibleRows.map(item => {
      const defaults = plantillaDisplayDefaults(item);
      return `<tr><td>${escapeHtml(resolveNombreCompleto(item) || '—')}</td><td>${escapeHtml(defaults.colegio)}</td><td>${escapeHtml(defaults.mesa)}</td><td>${escapeHtml(defaults.sindicato)}</td><td>${escapeHtml(defaults.participacion)}</td><td>${defaults.recorridoActivo ? 'Sí' : 'No'}</td><td>${escapeHtml(defaults.estacionBase)}</td><td>${escapeHtml(defaults.observaciones)}</td></tr>`;
    }).join('');
    const summaryBody = document.getElementById('electoralSummaryBody');
    if (summaryBody) summaryBody.innerHTML = [...bySind.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es')).map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${v}</td><td>${visibleRows.length ? ((v / visibleRows.length) * 100).toFixed(1) : '0.0'}%</td></tr>`).join('');
  }

  function getPlantillaFieldAliases() {
    return {
      employeeNumber: ['no empleado', 'n empleado', 'numero empleado', 'num empleado', 'numero de empleado', 'no', 'n', 'numero', 'num'],
      name: ['nombre'],
      lastName: ['apellidos'],
      nombreCompleto: ['nombre completo', 'nombre y apellidos', 'apellidos y nombre', 'persona', 'empleado'],
      job: ['puesto', 'puesto de trabajo', 'cargo'],
      sexo: ['sexo', 'unidad'],
      positionSeniority: ['antiguedad en puesto', 'antiguedad puesto', 'antig puesto', 'fecha antiguedad puesto', 'antiguedad del puesto', 'antiguedad'],
      level: ['nivel', 'nivel retributivo', 'grupo'],
      colegioElectoral: ['colegio electoral'],
      mesaElectoral: ['mesa electoral'],
      sindicato: ['sindicato'],
      participacionEstimada: ['participacion estimada'],
      recorridoActivo: ['recorrido activo'],
      estacionBase: ['estacion base'],
      observacionesRecorrido: ['observaciones recorrido']
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

  function fillSindicatoSelect(selectId, selectedValue) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const unions = getConfiguredSindicatos();
    const values = ['Sin asignar', ...unions.filter(v => v !== 'Sin asignar')];
    const current = normalizeText(selectedValue);
    if (current && !values.includes(current)) values.push(current);
    select.innerHTML = values.map(v => `<option value="${escapeHtml(v)}"${v === current ? ' selected' : ''}>${escapeHtml(v)}</option>`).join('');
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
    const summary = { read: 0, created: 0, updated: 0, unchanged: 0, skipped: 0, errors: 0, total: 0 };
    if (!rows.length) return summary;
    const headers = rows[0];
    const map = buildPlantillaColumnMap(headers);
    const now = new Date().toISOString();
    const items = getPlantilla();
    const byEmployee = new Map(items.map((item, index) => [normalizeEmployeeKey(item.employeeNumber), index]));
    const byFullName = new Map(items.map((item, index) => {
      const fullName = normalizeHeader(getField(item, 'fullName') || [getField(item, 'name'), getField(item, 'lastName')].filter(Boolean).join(' '));
      return [fullName, index];
    }).filter(([k]) => k));
    rows.slice(1).forEach(row => {
      if (!row.some(Boolean)) {
        summary.skipped++;
        return;
      }
      summary.read++;
      const employeeNumber = map.employeeNumber == null ? '' : normalizeEmployeeNumber(row[map.employeeNumber]);
      const name = map.name == null ? '' : normalizeText(row[map.name]);
      const lastName = map.lastName == null ? '' : normalizeText(row[map.lastName]);
      const fullNameInput = map.nombreCompleto == null ? '' : normalizeText(row[map.nombreCompleto]);
      const fullName = fullNameInput || normalizeText([name, lastName].filter(Boolean).join(' '));
      if (!employeeNumber && !fullName) {
        summary.skipped++;
        return;
      }
      const imported = {
        employeeNumber,
        name,
        lastName,
        nombreCompleto: fullName,
        fullName,
        job: map.job == null ? '' : normalizeText(row[map.job]),
                sexo: map.sexo == null ? '' : normalizeText(row[map.sexo]),
        positionSeniority: map.positionSeniority == null ? '' : normalizePlantillaDateOrText(row[map.positionSeniority]),
        level: map.level == null ? '' : normalizeText(row[map.level]).toUpperCase()
        ,colegioElectoral: map.colegioElectoral == null ? '' : normalizeText(row[map.colegioElectoral])
        ,mesaElectoral: map.mesaElectoral == null ? '' : normalizeMesaElectoral(row[map.mesaElectoral])
        ,sindicato: map.sindicato == null ? '' : normalizeText(row[map.sindicato])
        ,participacionEstimada: map.participacionEstimada == null ? '' : normalizeText(row[map.participacionEstimada])
        ,recorridoActivo: map.recorridoActivo == null ? false : normalizeBoolean(row[map.recorridoActivo])
        ,estacionBase: map.estacionBase == null ? '' : normalizeText(row[map.estacionBase])
        ,observacionesRecorrido: map.observacionesRecorrido == null ? '' : normalizeText(row[map.observacionesRecorrido])
      };
      const key = normalizeEmployeeKey(employeeNumber);
      const existingIndex = byEmployee.get(key) ?? byFullName.get(normalizeHeader(fullName));
      if (existingIndex != null) {
        const current = items[existingIndex];
        const merged = {
          ...current,
          employeeNumber: imported.employeeNumber || current.employeeNumber || '',
          name: imported.nombreCompleto || imported.name || resolveNombreCompleto(current) || current.name || '',
          lastName: current.lastName || '',
          nombreCompleto: imported.nombreCompleto || current.nombreCompleto || current.fullName || '',
          fullName: imported.nombreCompleto || current.fullName || '',
          job: imported.job || current.job || '',
          area: imported.area || current.area || '',
          department: imported.department || current.department || '',
          sexo: imported.sexo || resolveSexo(current) || '',
          unit: imported.sexo || current.unit || '',
          positionSeniority: map.positionSeniority == null || !imported.positionSeniority ? (current.positionSeniority || '') : imported.positionSeniority,
          level: imported.level ? normalizeLevel(imported.level) : (current.level || ''),
          colegioElectoral: imported.colegioElectoral || normalizeText(getField(current, 'colegioElectoral', 'colegio_electoral')),
          colegio_electoral: imported.colegioElectoral || normalizeText(getField(current, 'colegioElectoral', 'colegio_electoral')),
          mesaElectoral: imported.mesaElectoral || normalizeText(getField(current, 'mesaElectoral', 'mesa_electoral')),
          mesa_electoral: imported.mesaElectoral || normalizeText(getField(current, 'mesaElectoral', 'mesa_electoral')),
          sindicato: imported.sindicato || normalizeText(getField(current, 'sindicato')),
          participacionEstimada: imported.participacionEstimada || normalizeText(getField(current, 'participacionEstimada', 'participacion_estimada')),
          participacion_estimada: imported.participacionEstimada || normalizeText(getField(current, 'participacionEstimada', 'participacion_estimada')),
          recorridoActivo: map.recorridoActivo == null ? !!getField(current, 'recorridoActivo', 'recorrido_activo') : imported.recorridoActivo,
          recorrido_activo: map.recorridoActivo == null ? !!getField(current, 'recorridoActivo', 'recorrido_activo') : imported.recorridoActivo,
          estacionBase: imported.estacionBase || normalizeText(getField(current, 'estacionBase', 'estacion_base')),
          estacion_base: imported.estacionBase || normalizeText(getField(current, 'estacionBase', 'estacion_base')),
          observacionesRecorrido: imported.observacionesRecorrido || normalizeText(getField(current, 'observacionesRecorrido', 'observaciones_recorrido')),
          observaciones_recorrido: imported.observacionesRecorrido || normalizeText(getField(current, 'observacionesRecorrido', 'observaciones_recorrido')),
          updatedAt: now
        };
        items[existingIndex] = merged;
        summary.updated++;
      } else {
        const id = (window.crypto && typeof window.crypto.randomUUID === 'function') ? window.crypto.randomUUID() : `plant-${Date.now()}-${summary.read}`;
        items.push({
          id,
          employeeNumber: imported.employeeNumber,
          nombreCompleto: imported.nombreCompleto,
          name: imported.nombreCompleto || imported.name,
          lastName: imported.lastName,
          fullName: imported.nombreCompleto,
          job: imported.job,
          area: imported.area,
          department: imported.department,
          sexo: imported.sexo,
          unit: imported.sexo,
          positionSeniority: imported.positionSeniority,
          level: imported.level ? normalizeLevel(imported.level) : '',
          colegioElectoral: imported.colegioElectoral,
          colegio_electoral: imported.colegioElectoral,
          mesaElectoral: imported.mesaElectoral,
          mesa_electoral: imported.mesaElectoral,
          sindicato: imported.sindicato,
          participacionEstimada: imported.participacionEstimada,
          participacion_estimada: imported.participacionEstimada,
          recorridoActivo: imported.recorridoActivo,
          recorrido_activo: imported.recorridoActivo,
          estacionBase: imported.estacionBase,
          estacion_base: imported.estacionBase,
          observacionesRecorrido: imported.observacionesRecorrido,
          observaciones_recorrido: imported.observacionesRecorrido,
          createdAt: now,
          updatedAt: now
        });
        if (key) byEmployee.set(key, items.length - 1);
        if (normalizeHeader(fullName)) byFullName.set(normalizeHeader(fullName), items.length - 1);
        summary.created++;
      }
    });
    if (items.length) setPlantilla(items);
    summary.total = items.length;
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
      const message = `Importación completada. Creadas: ${summary.created}. Actualizadas: ${summary.updated}. Sin cambios: ${summary.unchanged}. Filas ignoradas: ${summary.skipped}. Errores: ${summary.errors}. Total final guardado: ${summary.total}.`;
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



  async function importPlantillaRrllFromInput(event) {
    const input = event?.target; const file = input?.files?.[0]; if (!file) return;
    const summaryEl = document.getElementById('plantillaImportSummary');
    try {
      const rows = await readPlantillaSpreadsheet(file);
      const message = `Importación RRLL completada: ${Math.max(rows.length-1,0)} filas procesadas.`;
      if (summaryEl) summaryEl.textContent = message; alert(message);
    } catch (error) {
      const message = `No se pudo importar RRLL: ${error.message || error}`;
      if (summaryEl) summaryEl.textContent = message; alert(message);
    } finally { if (input) input.value = ''; }
  }

  function printPlantilla() {
    const rows = sortedPlantilla();
    const rowsHtml = rows.length
      ? rows.map((item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${htmlEscapeForPrint(item.employeeNumber || '')}</td>
          <td>${htmlEscapeForPrint(resolveNombreCompleto(item) || '')}</td>
          <td>${htmlEscapeForPrint(item.job || '')}</td>
          <td>${htmlEscapeForPrint(formatPlantillaDate(item.positionSeniority))}</td>
          <td>${htmlEscapeForPrint(item.level || '')}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="6">Sin registros.</td></tr>`;
    const html = `<h1>Plantilla</h1><div class="date">Generado: ${new Date().toLocaleString('es-ES')}</div><table><thead><tr><th>#</th><th>Nº empleado</th><th>Nombre completo</th><th>Puesto de trabajo</th><th>Antig. Puesto</th><th>Nivel retributivo</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
    if (typeof openPrintPreviewWithHtml === 'function') openPrintPreviewWithHtml(html);
  }

  function exportPlantillaExcel() {
    const rows = sortedPlantilla();
    const excelData = {
      title: 'Plantilla',
      filename: 'plantilla',
      headers: ['Nº empleado', 'Nombre completo', 'Colegio electoral', 'Mesa electoral', 'Sindicato', 'Puesto de trabajo', 'Antig. Puesto', 'Nivel retributivo'],
      rows: rows.map(item => [item.employeeNumber || '', resolveNombreCompleto(item) || '', item.job || '', resolveSexo(item) || '', item.level || '', getField(item, 'colegioElectoral', 'colegio_electoral') || '', getField(item, 'mesaElectoral', 'mesa_electoral') || '', getField(item, 'sindicato') || '', item.job || '', formatPlantillaDate(item.positionSeniority), item.level || ''])
    };
    if (typeof exportExcelData === 'function') exportExcelData(excelData);
  }
  function downloadPlantillaModelExcel() {
    if (typeof exportExcelData !== 'function') return;
    exportExcelData({
      title: 'Modelo Plantilla RRLL',
      filename: 'modelo_plantilla_rrll',
      headers: PLANTILLA_MODEL_COLUMNS.map(column => column.label),
      rows: []
    });
  }

  function setElectoralColegio(value) { electoralSelectedColegio = value || 'Todos'; renderPlantillaElectoral(); }
  function setElectoralMesa(value) { electoralSelectedMesa = value || 'Todos'; renderPlantillaElectoral(); }
  function setElectoralSindicato(value) { electoralSelectedSindicato = value || 'Todos'; renderPlantillaElectoral(); }
  function setElectoralRecorrido(value) { electoralSelectedRecorrido = value || 'Todos'; renderPlantillaElectoral(); }

  function exportPlantillaElectoralExcel() {
    const visible = getElectoralVisibleRows();
    const bySind = {};
    const byMesaColegio = {};
    visible.forEach(i => { const k = plantillaDisplayDefaults(i).sindicato; bySind[k] = (bySind[k] || 0) + 1; });
    visible.forEach(i => {
      const defaults = plantillaDisplayDefaults(i);
      const colegio = defaults.colegio;
      const mesa = defaults.mesa;
      const key = `${colegio}|||${mesa}`;
      byMesaColegio[key] = (byMesaColegio[key] || 0) + 1;
    });
    if (typeof exportExcelData === 'function') exportExcelData({
      title: `Elecciones sindicales ${electoralSelectedMesa}`,
      sheets: [
        { name: 'Resumen general', columns: ['Filtro colegio', 'Mesa', 'Total visible'], rows: [[electoralSelectedColegio, electoralSelectedMesa, visible.length]] },
        { name: 'Resumen sindicato', columns: ['Sindicato', 'Personas', '%'], rows: Object.entries(bySind).map(([k, v]) => [k, v, visible.length ? ((v * 100) / visible.length).toFixed(1) : '0.0']) },
        { name: 'Resumen mesa-colegio', columns: ['Colegio', 'Mesa', 'Personas'], rows: Object.entries(byMesaColegio).map(([k, v]) => { const [colegio, mesa] = k.split('|||'); return [colegio, mesa, v]; }) },
        { name: 'Listado visible', columns: ['Persona', 'Colegio electoral', 'Mesa electoral', 'Sindicato', 'Participación estimada', 'Recorrido activo'], rows: visible.map(i => { const d = plantillaDisplayDefaults(i); return [resolveNombreCompleto(i) || '', d.colegio, d.mesa, d.sindicato, d.participacion, d.recorridoActivo ? 'Sí' : 'No']; }) }
      ]
    });
  }

  window.PlantillaModule = { getPlantilla, setPlantilla, togglePlantillaCreateForm, addPlantilla, deletePlantilla, openPlantillaEditModal, closePlantillaEditModal, saveEditingPlantilla, deleteEditingPlantilla, renderPlantilla, plantillaPreviousPage, plantillaNextPage, importPlantillaExcelFromInput, importPlantillaRrllFromInput, printPlantilla, exportPlantillaExcel, downloadPlantillaModelExcel, togglePlantillaElectoralView, setElectoralColegio, setElectoralMesa, setElectoralSindicato, setElectoralRecorrido, exportPlantillaElectoralExcel };
  window.getPlantilla = getPlantilla;
  window.setPlantilla = setPlantilla;

  window.getPlantillaNombreCompleto = getPlantillaNombreCompleto;
  window.normalizePlantillaPerson = normalizePlantillaPerson;
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
  window.importPlantillaRrllFromInput = importPlantillaRrllFromInput;
  window.printPlantilla = printPlantilla;
  window.exportPlantillaExcel = exportPlantillaExcel;
  window.downloadPlantillaModelExcel = downloadPlantillaModelExcel;
  window.togglePlantillaElectoralView = togglePlantillaElectoralView;
  window.setElectoralColegio = setElectoralColegio;
  window.setElectoralMesa = setElectoralMesa;
  window.setElectoralSindicato = setElectoralSindicato;
  window.setElectoralRecorrido = setElectoralRecorrido;
  window.exportPlantillaElectoralExcel = exportPlantillaElectoralExcel;
})();
