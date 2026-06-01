// Accesos rápidos y configuración de enlaces.
// Mantiene funciones globales para compatibilidad con botones inline y arranque existente.

const RRLL_DEFAULT_LINKS_FALLBACK = [{ name: "Firma Digital", url: "https://apps.docusign.com/send" }];

function rrllDefaultLinks() {
  return Array.isArray(window.DEFAULT_LINKS) ? window.DEFAULT_LINKS : RRLL_DEFAULT_LINKS_FALLBACK;
}

function getLinks() {
  const links = load("rrll_links", rrllDefaultLinks());
  return Array.isArray(links) ? links : rrllDefaultLinks();
}

function renderLinks() {
  const links = getLinks();
  const container = document.getElementById("quickLinks");
  if (!container) return;
  container.innerHTML = "";

  links.forEach(link => {
    const btn = document.createElement("button");
    btn.className = "launch-button";
    btn.textContent = link.name;
    btn.onclick = () => openExternalUrl(link.url);
    container.appendChild(btn);
  });
}

function renderLinkConfig() {
  const links = getLinks();
  const container = document.getElementById("linkConfig");
  if (!container) return;
  container.innerHTML = "";

  links.forEach((link, index) => {
    const item = document.createElement("div");
    item.className = "access-config-item";

    const nameRow = document.createElement("div");
    nameRow.className = "config-row";
    nameRow.innerHTML = `<label>Nombre</label><input id="link-name-${index}" value="${escapeHtml(link.name)}" />`;

    const urlRow = document.createElement("div");
    urlRow.className = "config-row";
    urlRow.innerHTML = `<label>URL</label><input id="link-url-${index}" value="${escapeHtml(link.url)}" />`;

    const actions = document.createElement("div");
    actions.className = "two-buttons";
    actions.innerHTML = `<button class="small danger" onclick="deleteCustomAccess(${index})">Eliminar</button>`;

    item.appendChild(nameRow);
    item.appendChild(urlRow);
    item.appendChild(actions);
    container.appendChild(item);
  });
}

function addCustomAccess() {
  const nameEl = document.getElementById("newAccessName");
  const urlEl = document.getElementById("newAccessUrl");

  const name = nameEl.value.trim();
  const url = urlEl.value.trim();

  if (!name || !url) {
    alert("Introduce nombre y URL/ruta del acceso.");
    return;
  }

  const links = getLinks();
  links.push({ name, url });
  save("rrll_links", links);

  nameEl.value = "";
  urlEl.value = "";

  renderLinks();
  renderLinkConfig();
}

function deleteCustomAccess(index) {
  const links = getLinks();
  links.splice(index, 1);
  save("rrll_links", links);
  renderLinks();
  renderLinkConfig();
}

function saveLinks() {
  const current = getLinks();
  const links = current.map((_, index) => ({
    name: document.getElementById(`link-name-${index}`).value.trim(),
    url: document.getElementById(`link-url-${index}`).value.trim()
  })).filter(link => link.name && link.url);

  save("rrll_links", links);
  renderLinks();
  renderLinkConfig();
}

function restoreDefaultLinks() {
  save("rrll_links", rrllDefaultLinks());
  renderLinks();
  renderLinkConfig();
}



window.getLinks = getLinks;
window.renderLinks = renderLinks;
window.renderLinkConfig = renderLinkConfig;
window.addCustomAccess = addCustomAccess;
window.deleteCustomAccess = deleteCustomAccess;
window.saveLinks = saveLinks;
window.restoreDefaultLinks = restoreDefaultLinks;
