/**
 * Búsqueda por módulo.
 * Cambio acotado: solo corrige apertura, indexación y navegación de la lupa.
 */
(function () {
  'use strict';

  function safeArray(fnName) {
    try {
      return typeof window[fnName] === 'function' ? (window[fnName]() || []) : [];
    } catch (error) {
      console.warn(`[RRLL] No se pudo leer ${fnName} para la búsqueda:`, error);
      return [];
    }
  }

  function labelStatus(value, fallback = '') {
    try {
      return typeof window.statusLabel === 'function' ? window.statusLabel(value) : (value || fallback || 'Sin estado');
    } catch {
      return value || fallback || 'Sin estado';
    }
  }

  function labelPriority(value) {
    try {
      return typeof window.priorityLabel === 'function' ? window.priorityLabel(value) : (value || 'Normal');
    } catch {
      return value || 'Normal';
    }
  }

  function searchText(parts) {
    const raw = typeof window.itemSearchText === 'function'
      ? window.itemSearchText(parts)
      : parts.filter(Boolean).join(' ').toLowerCase();
    return String(raw || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function escapeAttr(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  function html(value) {
    return typeof window.escapeHtml === 'function'
      ? window.escapeHtml(value || '')
      : String(value || '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  function buildSearchIndex() {
    const rows = [];
    const seen = new Set();

    function pushRow(row) {
      if (!row || !row.module) return;
      const normalizedTarget = String(row.targetId || '').trim();
      const normalizedTitle = String(row.title || '').trim();
      const normalizedStatus = String(row.status || '').trim();
      const dedupeKey = [row.module, row.anchor || '', normalizedTarget || normalizedTitle, normalizedStatus].join('||').toLowerCase();
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      rows.push(row);
    }

    safeArray('getTasks').forEach(item => pushRow({
      module: 'Tareas',
      title: item.title,
      status: labelStatus(item.status),
      notes: `${item.notes || ''} ${item.dueDate ? 'Fecha límite: ' + item.dueDate : ''} Prioridad: ${labelPriority(item.priority)}`,
      anchor: 'gestor-tareas',
      targetId: `rrll-task-${item.id}`,
      text: searchText([item.title, item.notes, item.status, item.dueDate, labelPriority(item.priority), ...(item.updates || []).map(u => u.text)])
    }));

    safeArray('getAgendaItems').forEach(item => pushRow({
      module: 'Comité',
      title: item.title,
      status: labelStatus(item.status),
      notes: `${item.petitioner || ''} ${item.notes || ''} ${item.committeeSessionCode || ''} ${item.committeeSessionDate || ''}`,
      anchor: 'gestor-puntos-comite',
      targetId: `rrll-agenda-${item.id}`,
      text: searchText([item.title, item.petitioner, item.notes, item.status, item.committeeSessionCode, item.committeeSessionDate, item.committeeSessionOrder, ...(item.updates || []).map(u => u.text)])
    }));

    safeArray('getCommitteeSessions').forEach(session => pushRow({
      module: 'Sesiones Comité',
      title: session.title || session.code || 'Sesión',
      status: session.status === 'closed' ? 'Histórico' : 'Abierta',
      notes: `${session.code || ''} ${session.date || session.rawDate || ''} ${session.notes || ''}`,
      anchor: 'gestor-sesiones-comite',
      targetId: `rrll-session-${session.id}`,
      text: searchText([session.title, session.code, session.date, session.rawDate, session.notes, session.status, ...(typeof window.getCommitteeSessionDisplayItems === 'function' ? window.getCommitteeSessionDisplayItems(session).map(item => `${item.title || ''} ${item.meta || ''}`) : [])])
    }));

    safeArray('getParitariaItems').forEach(item => pushRow({
      module: 'Paritaria',
      title: item.title,
      status: labelStatus(item.status),
      notes: `${item.petitioner || ''} ${item.notes || ''} ${item.paritariaSessionCode || ''} ${item.paritariaSessionDate || ''}`,
      anchor: 'gestor-puntos-paritaria',
      targetId: `rrll-paritaria-${item.id}`,
      text: searchText([item.title, item.petitioner, item.notes, item.status, item.paritariaSessionCode, item.paritariaSessionDate, item.paritariaSessionOrder, ...(item.updates || []).map(u => u.text)])
    }));

    safeArray('getParitariaSessions').forEach(session => pushRow({
      module: 'Sesiones Paritaria',
      title: session.title || session.code || 'Sesión',
      status: session.status === 'closed' ? 'Histórico' : 'Abierta',
      notes: `${session.code || ''} ${session.date || session.rawDate || ''} ${session.notes || ''}`,
      anchor: 'gestor-sesiones-paritaria',
      targetId: `rrll-paritaria-session-${session.id}`,
      text: searchText([session.title, session.code, session.date, session.rawDate, session.notes, session.status, ...(typeof window.getParitariaSessionDisplayItems === 'function' ? window.getParitariaSessionDisplayItems(session).map(item => `${item.title || ''} ${item.meta || ''}`) : [])])
    }));

    safeArray('getMinutes').forEach(item => pushRow({
      module: 'Actas', title: item.title, status: labelStatus(item.status), notes: item.notes,
      anchor: 'gestor-actas', targetId: `rrll-minute-${item.id}`,
      text: searchText([item.title, item.notes, item.status, item.dueDate])
    }));

    safeArray('getPetitions').forEach(item => pushRow({
      module: 'Peticiones', title: item.title, status: labelStatus(item.status),
      notes: `${(item.sources || []).join(', ')} ${item.notes || ''} ${item.dueDate ? 'Fecha límite: ' + item.dueDate : ''} Prioridad: ${labelPriority(item.priority)}`,
      anchor: 'gestor-peticiones', targetId: `rrll-petition-${item.id}`,
      text: searchText([item.title, item.notes, item.status, item.dueDate, labelPriority(item.priority), ...(item.sources || []), ...(item.updates || []).map(u => u.text)])
    }));

    safeArray('getTeleworkItems').forEach(item => pushRow({
      module: 'Teletrabajo', title: item.name, status: labelStatus(item.status),
      notes: `${item.employeeNumber || ''} ${item.period || ''} ${item.type || ''} ${(item.days || []).join(', ')}`,
      anchor: 'gestor-teletrabajo', targetId: `rrll-telework-${item.id}`,
      text: searchText([item.name, item.employeeNumber, item.period, item.type, item.status, ...(item.days || [])])
    }));


    safeArray('getCriteria').forEach(item => pushRow({
      module: 'Criterios RRLL',
      title: item.subject || item.generalCriterion || 'Sin asunto',
      status: item.origin || 'Criterio interno',
      notes: `Fecha: ${item.date || ''} ${item.generalCriterion || ''} ${item.observations || ''} ${item.tags || ''}`.trim(),
      anchor: 'gestor-criterios',
      targetId: '',
      text: searchText([item.date, item.subject, item.generalCriterion, item.observations, item.tags, item.origin])
    }));

    safeArray('getTicketRestaurantPeople').forEach(item => pushRow({
      module: 'Ticket Restaurante',
      title: [item.name, item.surname1, item.surname2].filter(Boolean).join(' ') || item.employeeNumber || 'Persona sin nombre',
      status: item.calendar || 'Sin calendario',
      notes: `Nº empleado: ${item.employeeNumber || ''} DNI: ${item.dni || ''} Puesto: ${item.position || ''} Calendario: ${item.calendar || ''}`,
      anchor: 'gestor-ticket-restaurante',
      targetId: '',
      text: searchText([item.employeeNumber, item.name, item.surname1, item.surname2, item.dni, item.position, item.calendar])
    }));

    safeArray('getTicketRestaurantAbsences').forEach(item => pushRow({
      module: 'Ticket Restaurante',
      title: item.employeeNumber ? `Ausencia ${item.employeeNumber}` : (item.fullName || 'Ausencia'),
      status: item.reason || item.source || 'Ausencia',
      notes: `Desde: ${item.from || ''} Hasta: ${item.to || item.from || ''} ${item.fullName || ''} ${item.reason || ''}`.trim(),
      anchor: 'gestor-ticket-restaurante',
      targetId: '',
      text: searchText([item.employeeNumber, item.fullName, item.from, item.to, item.reason, item.source, item.notes])
    }));

    safeArray('getTrashItems').forEach(entry => {
      const item = entry && entry.item ? entry.item : {};
      pushRow({
        module: 'Papelera',
        title: item.title || item.name || 'Elemento eliminado',
        status: entry && entry.module ? `Módulo: ${entry.module}` : 'Elemento eliminado',
        notes: `Eliminado: ${entry && entry.deletedAt ? entry.deletedAt : ''} ${item.notes || ''} ${item.employeeNumber || ''}`.trim(),
        anchor: 'trashModal',
        targetId: '',
        text: searchText([entry && entry.module, entry && entry.deletedAt, item.title, item.name, item.notes, item.employeeNumber, item.requestDate])
      });
    });

    safeArray('getVinculogramas').forEach(item => {
      const expired = typeof window.isVinculogramaExpired === 'function' ? window.isVinculogramaExpired(item) : false;
      pushRow({
        module: 'Vinculograma', title: item.name, status: expired ? 'Vencido' : 'Vigente',
        notes: `Nº empleado: ${item.employeeNumber || ''} Persona vinculada: ${item.linkedPerson || ''} Solicitud: ${item.requestDate || ''} Vigencia: ${item.expiryDate || ''}`,
        anchor: 'gestor-vinculograma', targetId: `rrll-vinc-${item.id}`,
        text: searchText([item.name, item.employeeNumber, item.linkedPerson, item.requestDate, item.expiryDate, expired ? 'vencido' : 'vigente'])
      });
    });

    safeArray('getLicencias').forEach(item => pushRow({
      module: 'Licencias y excedencias', title: item.name,
      status: typeof window.licenseDisplayStatus === 'function' ? window.licenseDisplayStatus(item) : (item.status || ''),
      notes: `Nº empleado: ${item.employeeNumber || ''} Tipo: ${item.type || ''} Solicitud: ${item.requestDate || ''} Inicio: ${item.startDate || ''} Fin: ${item.endDate || ''}`,
      anchor: 'gestor-licencias', targetId: `rrll-lic-${item.id}`,
      text: searchText([item.name, item.employeeNumber, item.type, item.requestDate, item.startDate, item.endDate, item.status, ...(item.updates || []).map(u => u.text)])
    }));

    safeArray('getPlantilla').forEach(item => pushRow({
      module: 'Plantilla', title: item.name, status: item.level || '',
      notes: `Nº empleado: ${item.employeeNumber || ''} Sexo: ${item.sex || ''} Puesto: ${item.job || ''} Nivel: ${item.level || ''}`,
      anchor: 'gestor-plantilla', targetId: `rrll-plant-${item.id}`,
      text: searchText([item.name, item.employeeNumber, item.sex, item.job, item.level])
    }));

    return rows;
  }

  function openParentFor(anchor) {
    const own = document.getElementById(anchor);
    if (own?.tagName?.toLowerCase() === 'details') own.open = true;

    if (anchor === 'gestor-puntos-comite' || anchor === 'gestor-sesiones-comite') {
      const parent = document.getElementById('gestor-comite');
      if (parent?.tagName?.toLowerCase() === 'details') parent.open = true;
      if (typeof window.openCommitteeSubsection === 'function') window.openCommitteeSubsection(anchor);
    }

    if (anchor === 'trashModal' && typeof window.openTrashModal === 'function') {
      window.openTrashModal();
    }

    if (anchor === 'gestor-puntos-paritaria' || anchor === 'gestor-sesiones-paritaria') {
      const parent = document.getElementById('gestor-paritaria');
      if (parent?.tagName?.toLowerCase() === 'details') parent.open = true;
      if (typeof window.openParitariaSubsection === 'function') window.openParitariaSubsection(anchor);
    }
  }

  function focusSearchResult(anchor, targetId) {
    openParentFor(anchor);

    if (anchor === 'gestor-sesiones-comite' && targetId && targetId.startsWith('rrll-session-') && typeof window.getCommitteeSessions === 'function') {
      const sessionId = targetId.replace('rrll-session-', '');
      const session = window.getCommitteeSessions().find(s => s.id === sessionId);
      if (session && typeof window.setCommitteeSessionView === 'function') window.setCommitteeSessionView(session.status === 'closed' ? 'history' : 'open');
    }

    if (anchor === 'gestor-sesiones-paritaria' && targetId && targetId.startsWith('rrll-paritaria-session-') && typeof window.getParitariaSessions === 'function') {
      const sessionId = targetId.replace('rrll-paritaria-session-', '');
      const session = window.getParitariaSessions().find(s => s.id === sessionId);
      if (session && typeof window.setParitariaSessionView === 'function') window.setParitariaSessionView(session.status === 'closed' ? 'history' : 'open');
    }

    closeModuleSearch(false);
    setTimeout(() => {
      const target = targetId ? document.getElementById(targetId) : document.getElementById(anchor);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('search-hit-highlight');
      setTimeout(() => target.classList.remove('search-hit-highlight'), 2200);
    }, 150);
  }

  const MODULE_SEARCH_CONFIG = {
    tasks: { title: 'Buscar en tareas', label: 'Tareas' },
    agenda: { title: 'Buscar en puntos del Comité', label: 'Comité' },
    committeeSessions: { title: 'Buscar en sesiones de Comité', label: 'Sesiones Comité' },
    paritaria: { title: 'Buscar en puntos de Paritaria', label: 'Paritaria' },
    paritariaSessions: { title: 'Buscar en sesiones de Paritaria', label: 'Sesiones Paritaria' },
    minutes: { title: 'Buscar en actas', label: 'Actas' },
    petitions: { title: 'Buscar en peticiones', label: 'Peticiones' },
    telework: { title: 'Buscar en teletrabajo', label: 'Teletrabajo' },
    vinculograma: { title: 'Buscar en vinculograma', label: 'Vinculograma' },
    licencias: { title: 'Buscar en licencias y excedencias', label: 'Licencias y excedencias' },
    plantilla: { title: 'Buscar en plantilla', label: 'Plantilla' },
    criterios: { title: 'Buscar en criterios RRLL', label: 'Criterios RRLL' },
    ticketRestaurante: { title: 'Buscar en ticket restaurante', label: 'Ticket Restaurante' },
    papelera: { title: 'Buscar en papelera', label: 'Papelera' }
  };

  let activeModuleSearchType = null;

  function buildModuleSearchRows(type) {
    const label = MODULE_SEARCH_CONFIG[type]?.label;
    if (!label) return [];
    return buildSearchIndex().filter(row => row.module === label);
  }

  function openModuleSearch(type) {
    activeModuleSearchType = type;
    const config = MODULE_SEARCH_CONFIG[type] || { title: 'Buscar en gestor' };
    const title = document.getElementById('moduleSearchTitle');
    const input = document.getElementById('moduleSearchInput');
    const results = document.getElementById('moduleSearchResults');
    const modal = document.getElementById('moduleSearchModal');
    if (!modal || !input || !results) return;
    if (title) title.textContent = config.title;
    input.value = '';
    results.innerHTML = '<p class="muted">Escribe al menos 2 caracteres para buscar solo en este gestor.</p>';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => input.focus(), 0);
  }

  function closeModuleSearch(clearType = true) {
    const modal = document.getElementById('moduleSearchModal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
    if (clearType) activeModuleSearchType = null;
  }

  function renderModuleSearch() {
    const input = document.getElementById('moduleSearchInput');
    const container = document.getElementById('moduleSearchResults');
    if (!input || !container || !activeModuleSearchType) return;

    const query = searchText([input.value.trim()]);
    if (query.length < 2) {
      container.innerHTML = query ? '<p class="muted">Escribe al menos 2 caracteres.</p>' : '<p class="muted">Escribe al menos 2 caracteres para buscar solo en este gestor.</p>';
      return;
    }

    const terms = query.split(/\s+/).filter(Boolean);
    const results = buildModuleSearchRows(activeModuleSearchType)
      .filter(row => terms.every(term => row.text.includes(term)))
      .slice(0, 50);

    if (!results.length) {
      container.innerHTML = '<p class="muted">Sin resultados.</p>';
      return;
    }

    container.innerHTML = results.map(row => `
      <div class="search-result-item module-search-result" role="button" tabindex="0" onclick="focusSearchResult('${escapeAttr(row.anchor)}', '${escapeAttr(row.targetId || '')}')">
        <div class="search-result-title"><span class="search-result-module">${html(row.module)}</span>${html(row.title || 'Sin título')}</div>
        <div class="search-result-meta">Estado: ${html(row.status || 'Sin estado')}<br>${html(row.notes || 'Sin notas')}</div>
      </div>
    `).join('');
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModuleSearch();
    if ((event.key === 'Enter' || event.key === ' ') && event.target?.classList?.contains('module-search-result')) {
      event.preventDefault();
      event.target.click();
    }
  });

  window.buildSearchIndex = buildSearchIndex;
  window.focusSearchResult = focusSearchResult;
  window.openModuleSearch = openModuleSearch;
  window.closeModuleSearch = closeModuleSearch;
  window.renderModuleSearch = renderModuleSearch;
  window.buildModuleSearchRows = buildModuleSearchRows;
})();
