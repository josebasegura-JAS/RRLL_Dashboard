(function () {
  'use strict';

  const DRAWS_KEY = 'rrll_draws';
  const EXCLUSIONS_KEY = 'rrll_draw_exclusions';
  let lastDrawResult = null;

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

  function employeeKey(person) {
    const num = String(person?.employeeNumber || person?.employee_number || '').trim();
    const name = String(person?.nombreCompleto || person?.name || person?.nombre || '').trim();
    return (num || name).toLowerCase();
  }

  function displayName(person) {
    return String(person?.nombreCompleto || person?.name || person?.nombre || '').trim();
  }

  function renderSorteos() {
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

    const emptyWarn = document.getElementById('drawsNoTemplateWarning');
    if (emptyWarn) emptyWarn.style.display = plantilla.length ? 'none' : 'block';

    renderExclusionsTable();
    renderDrawHistory();
  }

  function runDrawSearch() {
    const q = String(document.getElementById('drawSearchInput')?.value || '').trim().toLowerCase();
    const rows = document.getElementById('drawSearchResults');
    if (!rows) return;
    const plantilla = getPlantillaItems();
    const exclusions = getExclusions();
    const excluded = new Set(exclusions.map(e => e.key));
    if (!q) { rows.innerHTML = '<div class="muted">Escribe para buscar por nº empleado, nombre o apellidos.</div>'; return; }

    const matches = plantilla.filter(p => {
      const num = String(p.employeeNumber || '').toLowerCase();
      const name = displayName(p).toLowerCase();
      return num.includes(q) || name.includes(q);
    }).slice(0, 30);

    if (!matches.length) { rows.innerHTML = '<div class="muted">Sin coincidencias.</div>'; return; }
    rows.innerHTML = matches.map(p => {
      const key = employeeKey(p);
      return `<div class="rrll-pro-list-row"><div><b>${escapeHtml(String(p.employeeNumber || ''))}</b> · ${escapeHtml(displayName(p))}</div><button type="button" class="secondary small" onclick="excludePersonFromDraw('${encodeURIComponent(key)}')" ${excluded.has(key) ? 'disabled' : ''}>Excluir</button></div>`;
    }).join('');
    window.__drawSearchMap = Object.fromEntries(matches.map(p => [employeeKey(p), p]));
  }

  function excludePersonFromDraw(encodedKey) {
    const key = decodeURIComponent(encodedKey || '');
    const person = window.__drawSearchMap?.[key];
    if (!person) return;
    const current = getExclusions();
    if (current.some(e => e.key === key)) { alert('La persona ya está excluida.'); return; }
    current.push({
      key,
      employeeNumber: String(person.employeeNumber || '').trim(),
      fullName: displayName(person),
      motivo: 'Manual',
      excludedAt: new Date().toISOString()
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

  function resetDrawWinnerExclusions() {
    setExclusions(getExclusions().filter(e => e.motivo !== 'Ganador sorteo'));
    renderSorteos();
  }

  function resetAllDrawExclusions() {
    if (!confirm('¿Seguro que quieres resetear todas las exclusiones?')) return;
    setExclusions([]);
    renderSorteos();
  }

  function renderExclusionsTable() {
    const el = document.getElementById('drawExclusionsTable');
    if (!el) return;
    const items = getExclusions();
    if (!items.length) { el.innerHTML = '<div class="muted">No hay exclusiones.</div>'; return; }
    el.innerHTML = `<table class="rrll-pro-table"><thead><tr><th>Nº empleado</th><th>Nombre y apellidos</th><th>Motivo</th><th>Fecha de exclusión</th><th>Acciones</th></tr></thead><tbody>${items.map(e => `<tr><td>${escapeHtml(e.employeeNumber || '')}</td><td>${escapeHtml(e.fullName || '')}</td><td>${escapeHtml(e.motivo || '')}</td><td>${new Date(e.excludedAt).toLocaleString('es-ES')}</td><td><button type="button" class="secondary small" onclick="removeDrawExclusion('${encodeURIComponent(e.key)}')">Quitar</button></td></tr>`).join('')}</tbody></table>`;
  }

  function shuffleArray(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

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

    const winners = shuffleArray(available).slice(0, winnersRequested).map((p, idx) => ({
      position: idx + 1,
      employeeNumber: String(p.employeeNumber || '').trim(),
      fullName: displayName(p)
    }));

    const draw = {
      id: (crypto.randomUUID ? crypto.randomUUID() : `draw-${Date.now()}`),
      title,
      date,
      createdAt: new Date().toISOString(),
      winnersRequested,
      totalTemplate: plantilla.length,
      totalExcludedBefore: exclusions.length,
      totalAvailable: available.length,
      winners,
      user: (typeof getCurrentWindowsUser === 'function' ? undefined : undefined)
    };

    const draws = getDraws();
    draws.unshift(draw);
    setDraws(draws);

    const nextExclusions = [...exclusions];
    winners.forEach(w => {
      const key = (String(w.employeeNumber || '').trim() || String(w.fullName || '').trim()).toLowerCase();
      if (nextExclusions.some(e => e.key === key)) return;
      nextExclusions.push({ key, employeeNumber: w.employeeNumber, fullName: w.fullName, motivo: 'Ganador sorteo', excludedAt: new Date().toISOString() });
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
    if (!draw || !Array.isArray(draw.winners) || !draw.winners.length) { el.innerHTML = '<div class="muted">Sin resultados todavía.</div>'; return; }
    el.innerHTML = `<table class="rrll-pro-table"><thead><tr><th>Posición</th><th>Nº empleado</th><th>Nombre y apellidos</th><th>Título sorteo</th><th>Fecha sorteo</th></tr></thead><tbody>${draw.winners.map(w => `<tr><td>${w.position}</td><td>${escapeHtml(w.employeeNumber || '')}</td><td>${escapeHtml(w.fullName || '')}</td><td>${escapeHtml(draw.title)}</td><td>${escapeHtml(draw.date)}</td></tr>`).join('')}</tbody></table>`;
  }

  function exportDrawWinners(draw) {
    const source = draw || lastDrawResult;
    if (!source) return alert('No hay resultado visible para exportar.');
    if (typeof exportExcelData !== 'function') return;
    exportExcelData({
      filename: `sorteo-${source.date || 'sin-fecha'}`,
      sheetName: 'Sorteo',
      headers: ['Título sorteo', 'Fecha', 'Número ganadores', 'Posición', 'Nº empleado', 'Nombre y apellidos'],
      rows: source.winners.map(w => [source.title, source.date, source.winnersRequested, w.position, w.employeeNumber, w.fullName])
    });
  }

  function renderDrawHistory() {
    const el = document.getElementById('drawHistoryTable');
    if (!el) return;
    const draws = getDraws();
    if (!draws.length) { el.innerHTML = '<div class="muted">Sin histórico.</div>'; return; }
    el.innerHTML = `<table class="rrll-pro-table"><thead><tr><th>Fecha</th><th>Título</th><th>Nº ganadores</th><th>Acciones</th></tr></thead><tbody>${draws.map(d => `<tr><td>${escapeHtml(d.date || '')}</td><td>${escapeHtml(d.title || '')}</td><td>${Number(d.winnersRequested || 0)}</td><td><button type="button" class="secondary small" onclick="showDrawWinnersById('${d.id}')">Ver ganadores</button> <button type="button" class="secondary small" onclick="exportDrawById('${d.id}')">Exportar</button></td></tr>`).join('')}</tbody></table>`;
  }

  function showDrawWinnersById(id) {
    const draw = getDraws().find(d => d.id === id);
    if (!draw) return;
    lastDrawResult = draw;
    renderDrawWinners(draw);
  }

  function exportDrawById(id) {
    const draw = getDraws().find(d => d.id === id);
    if (!draw) return;
    exportDrawWinners(draw);
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
})();
