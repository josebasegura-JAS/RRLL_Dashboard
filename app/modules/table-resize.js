(function () {
  "use strict";

  const STORAGE_PREFIX = "rrll_table_columns_v2";
  const MIN_WIDTH = 72;
  const ACTION_MIN_WIDTH = 150;
  const ACTION_PREFERRED_WIDTH = 220;
  const HANDLE_CLASS = "rrll-column-resize-handle";
  const ENHANCED_CLASS = "rrll-resizable-table";
  const ACTION_CELL_CLASS = "rrll-table-action-cell";
  const WRAP_CLASS = "rrll-table-wrap-enabled";
  let pendingEnhance = 0;
  let activeResize = null;

  function safeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeKey(value) {
    return safeText(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "col";
  }

  function closestModuleId(table) {
    const module = table.closest("details[id], section[id], article[id], div[id]");
    return module && module.id ? module.id : "global";
  }

  function tableKey(table) {
    if (table.dataset.rrllResizeKey) return table.dataset.rrllResizeKey;
    const moduleId = closestModuleId(table);
    const tableId = table.id || table.getAttribute("aria-label") || table.className || "table";
    const headerText = Array.from(table.tHead?.rows?.[0]?.cells || []).map(cell => normalizeKey(cell.textContent)).join("_");
    const key = `${STORAGE_PREFIX}:${normalizeKey(moduleId)}:${normalizeKey(tableId)}:${headerText}`;
    table.dataset.rrllResizeKey = key;
    return key;
  }

  function readWidths(table) {
    try {
      return JSON.parse(localStorage.getItem(tableKey(table)) || "{}");
    } catch (error) {
      return {};
    }
  }

  function writeWidths(table, widths) {
    try {
      localStorage.setItem(tableKey(table), JSON.stringify(widths || {}));
    } catch (error) {
      console.warn("[RRLL] No se pudieron guardar los anchos de tabla:", error);
    }
  }

  function isActionHeader(th) {
    const text = safeText(th.textContent).toLowerCase();
    return text === "acciones" || text.includes("acción") || text.includes("accion");
  }

  function minWidthForHeader(th) {
    return isActionHeader(th) ? ACTION_MIN_WIDTH : MIN_WIDTH;
  }

  function preferredWidthForHeader(th) {
    return isActionHeader(th) ? ACTION_PREFERRED_WIDTH : 0;
  }

  function ensureScrollableParent(table) {
    const parent = table.parentElement;
    if (parent && !parent.classList.contains("rrll-pro-table-wrap")) {
      parent.classList.add(WRAP_CLASS);
    }
  }

  function ensureColgroup(table, columnCount) {
    let colgroup = table.querySelector(":scope > colgroup[data-rrll-resize='1']");
    if (!colgroup) {
      colgroup = document.createElement("colgroup");
      colgroup.dataset.rrllResize = "1";
      table.insertBefore(colgroup, table.firstChild);
    }
    while (colgroup.children.length < columnCount) colgroup.appendChild(document.createElement("col"));
    while (colgroup.children.length > columnCount) colgroup.removeChild(colgroup.lastElementChild);
    return colgroup;
  }

  function cellsForColumn(table, index) {
    return Array.from(table.rows || [])
      .map(row => row.cells[index])
      .filter(Boolean);
  }

  function markActionColumn(table, headers) {
    const actionIndex = headers.findIndex(isActionHeader);
    table.classList.toggle("rrll-table-has-action-column", actionIndex >= 0);
    if (actionIndex < 0) return;
    cellsForColumn(table, actionIndex).forEach(cell => cell.classList.add(ACTION_CELL_CLASS));
  }

  function applyColumnWidth(table, index, width, persist) {
    const headers = Array.from(table.tHead?.rows?.[0]?.cells || []);
    const th = headers[index];
    if (!th) return;
    const finalWidth = Math.max(minWidthForHeader(th), Math.round(width));
    const colgroup = ensureColgroup(table, headers.length);
    const col = colgroup.children[index];
    if (col) {
      col.style.width = `${finalWidth}px`;
      col.style.minWidth = `${minWidthForHeader(th)}px`;
    }
    cellsForColumn(table, index).forEach(cell => {
      cell.style.width = `${finalWidth}px`;
      cell.style.minWidth = `${minWidthForHeader(th)}px`;
    });
    if (persist) {
      const widths = readWidths(table);
      widths[index] = finalWidth;
      writeWidths(table, widths);
    }
  }

  function applyStoredWidths(table) {
    const headers = Array.from(table.tHead?.rows?.[0]?.cells || []);
    if (!headers.length) return;
    ensureColgroup(table, headers.length);
    markActionColumn(table, headers);
    const widths = readWidths(table);
    headers.forEach((th, index) => {
      const storedWidth = Number(widths[index]);
      const fallbackWidth = preferredWidthForHeader(th);
      const minWidth = minWidthForHeader(th);
      if (storedWidth || fallbackWidth) applyColumnWidth(table, index, Math.max(minWidth, storedWidth || fallbackWidth), false);
      th.style.minWidth = `${minWidth}px`;
    });
  }

  function currentColumnWidth(table, index, th) {
    const col = table.querySelector(":scope > colgroup[data-rrll-resize='1']")?.children?.[index];
    const colWidth = col ? parseFloat(col.style.width || "0") : 0;
    return colWidth || th.getBoundingClientRect().width || minWidthForHeader(th);
  }

  function setColumnWidth(table, index, width) {
    applyColumnWidth(table, index, width, true);
  }

  function autoFitColumn(table, index) {
    const headers = Array.from(table.tHead?.rows?.[0]?.cells || []);
    const th = headers[index];
    if (!th) return;
    const minWidth = minWidthForHeader(th);
    const cells = [th, ...Array.from(table.tBodies || []).flatMap(tbody => Array.from(tbody.rows || []).map(row => row.cells[index]).filter(Boolean))];
    let width = minWidth;
    cells.slice(0, 100).forEach(cell => {
      const previousWidth = cell.style.width;
      cell.style.width = "auto";
      width = Math.max(width, Math.ceil(cell.scrollWidth + 30));
      cell.style.width = previousWidth;
    });
    setColumnWidth(table, index, Math.min(width, 560));
  }

  function removeExistingHandles(table) {
    table.querySelectorAll(`.${HANDLE_CLASS}`).forEach(handle => handle.remove());
  }

  function bindHeaders(table) {
    const headers = Array.from(table.tHead?.rows?.[0]?.cells || []);
    if (!headers.length) return;
    removeExistingHandles(table);
    headers.forEach((th, index) => {
      if (th.colSpan && th.colSpan > 1) return;
      th.classList.add("rrll-resizable-header");
      if (isActionHeader(th)) th.classList.add("rrll-resizable-action-header");
      const handle = document.createElement("span");
      handle.className = HANDLE_CLASS;
      handle.setAttribute("role", "separator");
      handle.setAttribute("aria-orientation", "vertical");
      handle.title = "Arrastrar para cambiar ancho · Doble clic para autoajustar";
      handle.addEventListener("mousedown", event => {
        event.preventDefault();
        event.stopPropagation();
        activeResize = {
          table,
          index,
          th,
          startX: event.clientX,
          startWidth: currentColumnWidth(table, index, th)
        };
        document.body.classList.add("rrll-column-resizing");
      });
      handle.addEventListener("click", event => event.stopPropagation());
      handle.addEventListener("dblclick", event => {
        event.preventDefault();
        event.stopPropagation();
        autoFitColumn(table, index);
      });
      th.appendChild(handle);
    });
  }

  function enhanceTable(table) {
    if (!table || table.dataset.rrllResizeDisabled === "1") return;
    if (!table.tHead || !table.tHead.rows.length || !table.tBodies.length) return;
    const headers = Array.from(table.tHead.rows[0].cells || []);
    if (headers.length < 2) return;
    table.classList.add(ENHANCED_CLASS);
    table.style.tableLayout = "fixed";
    table.style.minWidth = "max-content";
    ensureScrollableParent(table);
    ensureColgroup(table, headers.length);
    applyStoredWidths(table);
    bindHeaders(table);
  }

  function enhanceAllTables() {
    pendingEnhance = 0;
    document.querySelectorAll("table").forEach(enhanceTable);
  }

  function scheduleEnhance() {
    if (pendingEnhance) return;
    pendingEnhance = window.requestAnimationFrame(enhanceAllTables);
  }

  document.addEventListener("mousemove", event => {
    if (!activeResize) return;
    event.preventDefault();
    const delta = event.clientX - activeResize.startX;
    setColumnWidth(activeResize.table, activeResize.index, activeResize.startWidth + delta);
  });

  document.addEventListener("mouseup", () => {
    if (!activeResize) return;
    activeResize = null;
    document.body.classList.remove("rrll-column-resizing");
  });

  function initTableResize() {
    enhanceAllTables();
    const observer = new MutationObserver(mutations => {
      if (mutations.some(mutation => Array.from(mutation.addedNodes || []).some(node => node.nodeType === 1 && (node.matches?.("table, thead, tbody, tr, th, td") || node.querySelector?.("table, thead, tbody, tr, th, td"))))) {
        scheduleEnhance();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.rrllEnhanceResizableTables = enhanceAllTables;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTableResize);
  } else {
    initTableResize();
  }
}());
