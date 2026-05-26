(function () {
  'use strict';

  const DRAWS_KEY = 'rrll_draws';
  const EXCLUSIONS_KEY = 'rrll_draw_exclusions';
  let lastDrawResult = null;
  let drawSearchInputBound = false;

  function getPlantillaItems() {
    if (window.PlantillaModule && typeof window.PlantillaModule.getPlantilla === 'function') {
      const data = window.PlantillaModule.getPlantilla();
      return Array.isArray(data) ? data : [];
    }
    return [];
  }

  function getDraws() { return Array.isArray(load(DRAWS_KEY, [])) ? load(DRAWS_KEY, []) : []; }
  function setDraws(v) { save(DRAWS_KEY, Array.isArray(v) ? v : []); }
  function getExclusions() { return Array.isArray(load(EXCLUSIONS_KEY, [])) ? load(EXCLUSIONS_KEY, []) : []; }
  function setExclusions(v) { save(EXCLUSIONS_KEY, Array.isArray(v) ? v : []); }

  function readAny(person, fields) {
    for (const field of fields) {
      const value = person?.[field];
      if (value !== undefined && value !== null) {
        const text = String(value).trim();
        if (text) return text;
      }
    }
    return '';
  }

  function normalizeDrawPerson(person) {
    const employeeNumber = readAny(person, ['employeeNumber', 'employee_number', 'numeroEmpleado', 'numEmpleado', 'nEmpleado', 'empleado', 'idEmpleado', 'employeeId', 'id']);
    const rawFull = readAny(person, ['nombreApellidos', 'fullName', 'employeeName', 'name', 'persona', 'trabajador', 'nombreCompleto']);
    const nombre = readAny(person, ['nombre', 'firstName', 'givenName']);
    const apellidos = readAny(person, ['apellidos', 'lastName', 'surname', 'apellido1', 'apellido2']);
    const fullName = (nombre && apellidos ? `${nombre} ${apellidos}` : (nombre || rawFull || 'Sin nombre')).trim() || 'Sin nombre';
    return { employeeNumber: employeeNumber || 'Sin nº', fullName, raw: person || {} };
  }

  function normalizedEmployeeNumber(person) {
    return normalizeDrawPerson(person).employeeNumber;
  }

  function normalizedFullName(person) {
    return normalizeDrawPerson(person).fullName;
  }

  function employeeKey(person) {
    return (normalizedEmployeeNumber(person) || normalizedFullName(person)).toLowerCase();
  }

  function renderSorteos() {
    ensureDrawSearchInputEditable();
    bindDrawSearchInput();
    const plantilla = getPlantillaItems();
    const exclusions = getExclusions();
    const excludedKeys = new Set(exclusions.map(e => String(e.key || '').toLowerCase()));
    const available = plantilla.filter(p => !excludedKeys.has(employeeKey(p)));

    const totalEl = document.getElementById('drawsTotalTemplate');
    const exEl = document.getElementById('drawsTotalExcluded');
    const avEl = document.getElementById('drawsTotalAvailable');
    if (totalEl) totalEl.textContent = String(plantilla.length);
    if (exEl) exEl.textContent = String(exclusions.length);
    if (avEl) avEl.textContent = String(available.length);

    const exToggle = document.getElementById('drawExclusionsToggle');
    if (exToggle) exToggle.textContent = `Exclusiones (${exclusions.length}) ▾`;
    const historyToggle = document.getElementById('drawHistoryToggle');
    const draws = getDraws();
    if (historyToggle) historyToggle.textContent = `Histórico de sorteos (${draws.length}) ▾`;

    const emptyWarn = document.getElementById('drawsNoTemplateWarning');
    if (emptyWarn) emptyWarn.style.display = plantilla.length ? 'none' : 'block';

    renderExclusionsTable();
    renderDrawHistory();
  }


  function ensureDrawSearchInputEditable() {
    const input = document.getElementById('drawSearchInput');
    if (!input) return null;
    input.disabled = false;
    input.readOnly = false;
    input.removeAttribute('disabled');
    input.removeAttribute('readonly');
    input.style.pointerEvents = 'auto';
    if (!input.hasAttribute('tabindex')) input.tabIndex = 0;
    return input;
  }

  function runDrawSearch() {
    const q = String(document.getElementById('drawSearchInput')?.value || '').trim().toLowerCase();
    const rows = document.getElementById('drawSearchResults');
    if (!rows) return;
    const plantilla = getPlantillaItems();
    const exclusions = getExclusions();
    const excluded = new Set(exclusions.map(e => e.key));
    if (!q || q.length < 2) { rows.innerHTML = '<tr><td colspan="3" class="muted">Escribe al menos 2 caracteres para buscar por nº empleado, nombre o apellidos.</td></tr>'; return; }

    const matches = plantilla.filter(p => {
      const normalized = normalizeDrawPerson(p);
      const num = String(normalized.employeeNumber || '').toLowerCase();
      const name = String(normalized.fullName || '').toLowerCase();
      const raw = normalized.raw || {};
      const fields = [
        num,
        name,
        String(readAny(raw, ['nombre', 'apellidos', 'nombreApellidos', 'fullName', 'name', 'employeeName', 'persona', 'trabajador'])).toLowerCase(),
        `${String(readAny(raw, ['nombre'])).toLowerCase()} ${String(readAny(raw, ['apellidos'])).toLowerCase()}`.trim(),
        String(readAny(raw, ['employeeNumber', 'numeroEmpleado', 'numEmpleado', 'empleado', 'idEmpleado', 'id'])).toLowerCase()
      ];
      return fields.some(v => v.includes(q));
    }).slice(0, 30);

    if (!matches.length) { rows.innerHTML = '<tr><td colspan="3" class="muted">Sin coincidencias.</td></tr>'; return; }
    rows.innerHTML = matches.map(p => {
      const normalized = normalizeDrawPerson(p);
      const key = employeeKey(p);
      return `<tr><td><b>${escapeHtml(normalized.employeeNumber || 'Sin nº')}</b></td><td>${escapeHtml(normalized.fullName || 'Sin nombre')}</td><td><button type="button" class="secondary small" onclick="excludePersonFromDraw('${encodeURIComponent(key)}')" ${excluded.has(key) ? 'disabled' : ''}>Excluir</button></td></tr>`;
    }).join('');
    window.__drawSearchMap = Object.fromEntries(matches.map(p => [employeeKey(p), p]));
  }

  function excludePersonFromDraw(encodedKey) {
    const key = decodeURIComponent(encodedKey || '');
    const person = window.__drawSearchMap?.[key];
    if (!person) return;
    const current = getExclusions();
    if (current.some(e => e.key === key)) { alert('La persona ya está excluida.'); return; }
    const normalized = normalizeDrawPerson(person);
    const duplicate = current.some(e => {
      const normalizedExclusion = normalizeDrawPerson(e);
      if (normalized.employeeNumber && normalized.employeeNumber !== 'Sin nº' && normalizedExclusion.employeeNumber && normalizedExclusion.employeeNumber !== 'Sin nº') {
        return normalizedExclusion.employeeNumber.toLowerCase() === normalized.employeeNumber.toLowerCase();
      }
      return normalizedExclusion.fullName.toLowerCase() === normalized.fullName.toLowerCase();
    });
    if (duplicate) { alert('La persona ya está excluida.'); return; }
    current.push({
      key,
      employeeNumber: normalized.employeeNumber,
      fullName: normalized.fullName,
      motivo: 'Manual',
      createdAt: new Date().toISOString(),
      excludedAt: new Date().toISOString(),
      raw: normalized.raw
    });
    setExclusions(current);
    renderSorteos();
    runDrawSearch();
  }

  function removeDrawExclusion(key) {
    setExclusions(getExclusions().filter(e => e.key !== key));
    renderSorteos();
    runDrawSearch();
  }

  function resetDrawWinnerExclusions() { setExclusions(getExclusions().filter(e => e.motivo !== 'Ganador sorteo')); renderSorteos(); }
  function resetAllDrawExclusions() { if (confirm('¿Seguro que quieres resetear todas las exclusiones?')) { setExclusions([]); renderSorteos(); } }

  function renderExclusionsTable() {
    const el = document.getElementById('drawExclusionsTable');
    if (!el) return;
    const items = getExclusions();
    if (!items.length) { el.innerHTML = '<tr><td colspan="5" class="muted">No hay exclusiones.</td></tr>'; return; }
    el.innerHTML = items.map(e => {
      const normalized = normalizeDrawPerson(e);
      return `<tr><td>${escapeHtml(normalized.employeeNumber || 'Sin nº')}</td><td>${escapeHtml(normalized.fullName || 'Sin nombre')}</td><td>${escapeHtml(e.motivo || '')}</td><td>${new Date(e.excludedAt || e.createdAt).toLocaleString('es-ES')}</td><td><button type="button" class="secondary small" onclick="removeDrawExclusion('${encodeURIComponent(e.key)}')">Quitar</button></td></tr>`;
    }).join('');
  }

  function shuffleArray(list) { const arr = [...list]; for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

  function runDraw() {
    const title = String(document.getElementById('drawTitle')?.value || '').trim();
    const date = String(document.getElementById('drawDate')?.value || '').trim();
    const winnersRequested = Number(document.getElementById('drawWinnersCount')?.value || 0);
    if (!title) return alert('Debes indicar el título del sorteo.');
    if (!date) return alert('Debes indicar la fecha del sorteo.');
    if (!Number.isInteger(winnersRequested) || winnersRequested <= 0) return alert('El número de ganadores debe ser mayor que 0.');

    const plantilla = getPlantillaItems();
    if (!plantilla.length) return alert('No hay personas en plantilla para realizar el sorteo');

    const exclusions = getExclusions();
    const excludedKeys = new Set(exclusions.map(e => e.key));
    const available = plantilla.filter(p => !excludedKeys.has(employeeKey(p)));
    if (winnersRequested > available.length) return alert('El número de ganadores supera las personas disponibles.');

    const winners = shuffleArray(available).slice(0, winnersRequested).map((p, idx) => {
      const normalized = normalizeDrawPerson(p);
      return {
      position: idx + 1,
      employeeNumber: normalized.employeeNumber,
      fullName: normalized.fullName,
      raw: normalized.raw
    };
    });

    const draw = { id: (crypto.randomUUID ? crypto.randomUUID() : `draw-${Date.now()}`), title, date, createdAt: new Date().toISOString(), winnersRequested, totalTemplate: plantilla.length, totalExcludedBefore: exclusions.length, totalAvailable: available.length, winners };
    const draws = getDraws(); draws.unshift(draw); setDraws(draws);

    const nextExclusions = [...exclusions];
    winners.forEach(w => {
      const normalizedWinner = normalizeDrawPerson(w);
      const key = (String(normalizedWinner.employeeNumber || '').trim() || String(normalizedWinner.fullName || '').trim()).toLowerCase();
      if (!nextExclusions.some(e => e.key === key)) nextExclusions.push({ key, employeeNumber: w.employeeNumber, fullName: w.fullName, motivo: 'Ganador sorteo', drawId: draw.id, excludedAt: new Date().toISOString() });
    });
    setExclusions(nextExclusions);

    lastDrawResult = draw;
    renderDrawWinners(draw);
    renderSorteos();
    alert('Sorteo completado.');
  }

  function renderDrawWinners(draw) {
    const el = document.getElementById('drawWinnersTable');
    if (!el) return;
    if (!draw || !Array.isArray(draw.winners) || !draw.winners.length) { el.innerHTML = '<tr><td colspan="5" class="muted">Sin resultados todavía.</td></tr>'; return; }
    el.innerHTML = draw.winners.map(w => {
      const normalized = normalizeDrawPerson(w);
      return `<tr><td>${w.position}</td><td>${escapeHtml(normalized.employeeNumber || 'Sin nº')}</td><td>${escapeHtml(normalized.fullName || 'Sin nombre')}</td><td>${escapeHtml(draw.title)}</td><td>${escapeHtml(draw.date)}</td></tr>`;
    }).join('');
  }

  function exportDrawWinners(draw) {
    const source = draw || lastDrawResult;
    if (!source || !Array.isArray(source.winners) || !source.winners.length) return alert('No hay ganadores visibles para exportar.');
    if (typeof exportExcelData !== 'function') return;
    exportExcelData({ filename: `sorteo-${source.date || 'sin-fecha'}`, sheetName: 'Sorteo', headers: ['Título sorteo', 'Fecha', 'Posición', 'Nº empleado', 'Nombre y apellidos'], rows: source.winners.map(w => {
      const normalized = normalizeDrawPerson(w);
      return [source.title, source.date, w.position, normalized.employeeNumber || 'Sin nº', normalized.fullName || 'Sin nombre'];
    }) });
  }

  function bindDrawSearchInput() {
    const input = ensureDrawSearchInputEditable();
    if (!input || drawSearchInputBound) return;
    input.addEventListener('input', runDrawSearch);
    input.addEventListener('focus', runDrawSearch);
    drawSearchInputBound = true;
  }

  function renderDrawHistory() {
    const el = document.getElementById('drawHistoryTable');
    if (!el) return;
    const draws = getDraws();
    if (!draws.length) { el.innerHTML = '<tr><td colspan="4" class="muted">Sin histórico.</td></tr>'; return; }
    el.innerHTML = draws.map(d => `<tr><td>${escapeHtml(d.date || '')}</td><td>${escapeHtml(d.title || '')}</td><td>${Number(d.winnersRequested || 0)}</td><td><button type="button" class="secondary small" onclick="showDrawWinnersById('${d.id}')">Ver ganadores</button> <button type="button" class="secondary small" onclick="exportDrawById('${d.id}')">Exportar</button> <button type="button" class="secondary small" onclick="deleteDrawById('${d.id}')">Eliminar</button></td></tr>`).join('');
  }

  async function deleteDrawById(id) {
    try {
      const draws = getDraws();
      const draw = draws.find(d => d.id === id);
      if (!draw) return;

      const confirmedDelete = confirm('Vas a eliminar este sorteo del histórico. Esta acción no afecta a la plantilla. ¿Quieres continuar?');
      if (!confirmedDelete) return;

      const currentExclusions = getExclusions();
      const winnerExclusions = currentExclusions.filter(e => e.motivo === 'Ganador sorteo' && e.drawId === id);
      const hasLinkedWinnerExclusions = winnerExclusions.length > 0;

      let nextExclusions = currentExclusions;
      if (hasLinkedWinnerExclusions) {
        const removeWinnerExclusions = confirm('¿Quieres quitar también de exclusiones a las personas ganadoras de este sorteo?');
        if (removeWinnerExclusions) {
          nextExclusions = currentExclusions.filter(e => !(e.motivo === 'Ganador sorteo' && e.drawId === id));
        }
      } else {
        alert('Este sorteo no tiene vínculo técnico con sus exclusiones. Se eliminará solo el histórico.');
      }

      const nextDraws = draws.filter(d => d.id !== id);
      setDraws(nextDraws);
      if (nextExclusions !== currentExclusions) setExclusions(nextExclusions);

      if (lastDrawResult && lastDrawResult.id === id) {
        lastDrawResult = null;
        renderDrawWinners(null);
      }

      if (typeof waitForPendingSaves === 'function') {
        await waitForPendingSaves();
      }

      renderSorteos();
    } catch (error) {
      console.error('[RRLL DRAWS] error eliminando sorteo', error);
      alert('No se pudo eliminar el sorteo. Revisa la consola para más detalle y vuelve a intentarlo.');
      try {
        renderSorteos();
      } catch (_) {
        // no-op
      }
    }
  }

  function showDrawWinnersById(id) { const draw = getDraws().find(d => d.id === id); if (!draw) return; lastDrawResult = draw; renderDrawWinners(draw); }
  function exportDrawById(id) { const draw = getDraws().find(d => d.id === id); if (draw) exportDrawWinners(draw); }

  function toggleDrawSection(section) {
    const cfg = section === 'exclusions'
      ? { bodyId: 'drawExclusionsBody', btnId: 'drawExclusionsToggle', base: 'Exclusiones', count: getExclusions().length }
      : { bodyId: 'drawHistoryBody', btnId: 'drawHistoryToggle', base: 'Histórico de sorteos', count: getDraws().length };
    const body = document.getElementById(cfg.bodyId);
    const button = document.getElementById(cfg.btnId);
    if (!body || !button) return;
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? '' : 'none';
    button.textContent = `${cfg.base} (${cfg.count}) ${isHidden ? '▾' : '▸'}`;
  }

  window.renderSorteos = renderSorteos;
  window.runDrawSearch = runDrawSearch;
  window.excludePersonFromDraw = excludePersonFromDraw;
  window.removeDrawExclusion = key => removeDrawExclusion(decodeURIComponent(key || ''));
  window.resetDrawWinnerExclusions = resetDrawWinnerExclusions;
  window.resetAllDrawExclusions = resetAllDrawExclusions;
  window.runDraw = runDraw;
  window.exportDrawWinners = () => exportDrawWinners();
  window.showDrawWinnersById = showDrawWinnersById;
  window.exportDrawById = exportDrawById;
  window.deleteDrawById = deleteDrawById;
  window.toggleDrawSection = toggleDrawSection;
})();
