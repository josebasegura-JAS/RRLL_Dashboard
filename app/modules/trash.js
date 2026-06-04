// Papelera de registros.
// Mantiene funciones globales para compatibilidad con gestores y botones inline.
// Las referencias a módulos se resuelven en uso para no romper lazy-load.

const TRASH_MODULES = {
  tasks: { label: "Tareas", getter: "getTasks", setter: "setTasks", render: "renderTasks" },
  minutes: { label: "Actas", getter: "getMinutes", setter: "setMinutes", render: "renderMinutes" },
  agenda: { label: "Comité", getter: "getAgendaItems", setter: "setAgendaItems", render: "renderAgendaItems" },
  paritaria: { label: "Paritaria", getter: "getParitariaItems", setter: "setParitariaItems", render: "renderParitariaItems" },
  petitions: { label: "Peticiones", getter: "getPetitions", setter: "setPetitions", render: "renderPetitions" },
  telework: { label: "Teletrabajo", getter: "getTeleworkItems", setter: "setTeleworkItems", render: "renderTelework" },
  vinculograma: { label: "Vinculograma", getter: "getVinculogramas", setter: "setVinculogramas", render: "renderVinculogramas" },
  licencias: { label: "Licencias y excedencias", getter: "getLicencias", setter: "setLicencias", render: "renderLicencias" },
  plantilla: { label: "Plantilla", getter: "getPlantilla", setter: "setPlantilla", render: "renderPlantilla" }
};

function getTrashModuleConfig(moduleKey) {
  const config = TRASH_MODULES[moduleKey];
  if (!config) return null;
  const getter = typeof config.getter === 'function' ? config.getter : window[config.getter];
  const setter = typeof config.setter === 'function' ? config.setter : window[config.setter];
  const render = typeof config.render === 'function' ? config.render : window[config.render];
  return { ...config, getter, setter, render };
}

function getTrashItems() {
  const items = load("rrll_trash", []);
  return Array.isArray(items) ? items : [];
}

function setTrashItems(items) {
  save("rrll_trash", Array.isArray(items) ? items : []);
}

function moveToTrash(module, item) {
  if (!item || !getTrashModuleConfig(module)) return;
  const trash = getTrashItems();
  trash.unshift({
    trashId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
    module,
    deletedAt: new Date().toISOString(),
    item: JSON.parse(JSON.stringify(item))
  });
  setTrashItems(trash);
}

function restoreTrashItem(trashId) {
  const trash = getTrashItems();
  const entry = trash.find(item => item.trashId === trashId);
  if (!entry) return;

  const module = getTrashModuleConfig(entry.module);
  if (!module || typeof module.getter !== 'function' || typeof module.setter !== 'function') {
    alert('No se puede restaurar este elemento porque el módulo no está disponible en este momento.');
    return;
  }
  const current = module.getter();
  const restored = { ...entry.item };
  if (current.some(item => item.id === restored.id)) {
    restored.id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  }

  module.setter([restored, ...current]);
  setTrashItems(trash.filter(item => item.trashId !== trashId));
  if (typeof module.render === 'function') module.render();
  renderTrash();
  restoreAlertsPanelState();
  renderAlertsPanel();
}

function deleteTrashItem(trashId) {
  if (!confirm("El elemento se eliminará definitivamente. ¿Continuar?")) return;
  setTrashItems(getTrashItems().filter(item => item.trashId !== trashId));
  renderTrash();
}

function emptyTrash() {
  const trash = getTrashItems();
  if (!trash.length) return;
  if (!confirm("Se vaciará la papelera definitivamente. ¿Continuar?")) return;
  save("rrll_trash_last_empty_backup", {
    emptiedAt: new Date().toISOString(),
    items: JSON.parse(JSON.stringify(trash))
  });
  setTrashItems([]);
  renderTrash();
}

function renderTrash() {
  const trash = getTrashItems();
  const lists = [document.getElementById("trashList"), document.getElementById("trashListModern")].filter(Boolean);
  const count = document.getElementById("trash-count");
  const countModern = document.getElementById("trash-count-modern");
  if (count) count.textContent = trash.length;
  if (countModern) countModern.textContent = trash.length;
  if (!lists.length) return;

  if (!trash.length) {
    lists.forEach(list => { list.innerHTML = `<p class="muted">La papelera está vacía.</p>`; });
    return;
  }

  const trashHtml = trash.map(entry => {
    const item = entry.item || {};
    const moduleLabel = getTrashModuleConfig(entry.module)?.label || entry.module;
    const title = item.title || item.name || "Sin título";
    const notes = item.notes || item.employeeNumber || item.requestDate || "";
    return `
      <div class="trash-item">
        <div class="trash-title">${escapeHtml(title)}</div>
        <div class="trash-meta">Módulo: ${escapeHtml(moduleLabel)} · Eliminado: ${formatTrashDate(entry.deletedAt)}${notes ? `<br>${escapeHtml(notes)}` : ""}</div>
        <div class="task-actions section-gap">
          <button class="small" type="button" onclick="restoreTrashItem('${entry.trashId}')">Restaurar</button>
          <button class="small danger" type="button" onclick="deleteTrashItem('${entry.trashId}')">Eliminar definitivo</button>
        </div>
      </div>
    `;
  }).join("");
  lists.forEach(list => { list.innerHTML = trashHtml; });
}

function openTrashModal() {
  const modal = document.getElementById("trashModal");
  if (!modal) return;
  renderTrash();
  modal.classList.add("open");
}

function closeTrashModal() {
  const modal = document.getElementById("trashModal");
  if (modal) modal.classList.remove("open");
}


window.getTrashItems = getTrashItems;
window.setTrashItems = setTrashItems;
window.moveToTrash = moveToTrash;
window.restoreTrashItem = restoreTrashItem;
window.deleteTrashItem = deleteTrashItem;
window.emptyTrash = emptyTrash;
window.renderTrash = renderTrash;
window.openTrashModal = openTrashModal;
window.closeTrashModal = closeTrashModal;
