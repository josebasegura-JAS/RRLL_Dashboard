const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync(require.resolve("./teletrabajo.js"), "utf8");

function createElement(id = "") {
  return {
    id,
    value: "",
    checked: false,
    textContent: "",
    innerHTML: "",
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {},
    addEventListener() {},
    focus() {},
    remove() {}
  };
}

function createTeleworkEditContext() {
  const storage = new Map();
  const persistedSnapshots = [];
  const elements = new Map();
  let uuid = 0;

  function ensureElement(id) {
    if (!elements.has(id)) elements.set(id, createElement(id));
    return elements.get(id);
  }

  const document = {
    body: { appendChild(element) { if (element.id) elements.set(element.id, element); } },
    getElementById: id => elements.get(id) || null,
    querySelectorAll: () => [],
    createElement: tag => {
      const element = createElement();
      element.tagName = String(tag || "").toUpperCase();
      element.addEventListener = () => {};
      Object.defineProperty(element, "innerHTML", {
        get() { return element._innerHTML || ""; },
        set(value) {
          element._innerHTML = String(value || "");
          const idPattern = /id="([^"]+)"/g;
          let match;
          while ((match = idPattern.exec(element._innerHTML))) ensureElement(match[1]);
        }
      });
      return element;
    }
  };

  [
    "teleworkCampaignSelector",
    "teleworkCampaignHint",
    "teleworkCampaignSummary",
    "teleworkHistoryList",
    "teleworkListBody",
    "teleworkTableEmpty",
    "teleworkInlineSearch"
  ].forEach(ensureElement);

  const context = {
    console,
    Date,
    Math,
    setTimeout: callback => callback(),
    alert: message => { throw new Error(`unexpected alert: ${message}`); },
    escapeHtml: value => String(value ?? ""),
    escapeJs: value => String(value ?? "").replace(/'/g, "\\'"),
    itemSearchText: parts => parts.flat().map(value => String(value || "").toLowerCase()).join(" "),
    load: (key, fallback) => storage.has(key) ? storage.get(key) : fallback,
    save: (key, value) => {
      storage.set(key, JSON.parse(JSON.stringify(value)));
      persistedSnapshots.push({ key, value: JSON.parse(JSON.stringify(value)) });
      return Promise.resolve(true);
    },
    document,
    window: { crypto: { randomUUID: () => `edit-${++uuid}` } }
  };
  context.window.window = context.window;
  context.window.waitForPendingSaves = async () => {};
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "teletrabajo.js" });
  return { context, storage, persistedSnapshots, elements };
}

async function run() {
  const { context, storage, persistedSnapshots, elements } = createTeleworkEditContext();
  const initial = {
    id: "tw-1",
    employeeNumber: "1001",
    nombreCompleto: "García López, Ana",
    name: "García López, Ana",
    job: "Técnico/a RRLL",
    period: "2026-2027",
    tipoSolicitud: "nueva",
    days: ["Martes", "Jueves"],
    diasTeletrabajoCast: "Martes y jueves",
    diasTeletrabajoEus: "Asteartea eta osteguna",
    porcentajeTeletrabajo: "40%",
    fechaInicioTeletrabajoCast: "2026-09-01",
    fechaFinTeletrabajoCast: "2027-06-30",
    fechaInicioTeletrabajoEus: "2026-09-01",
    fechaFinTeletrabajoEus: "2027-06-30",
    presenceValidation: "Pendiente",
    favorableReport: "Pendiente",
    security: "Pendiente",
    prevention: "Pendiente",
    previousYearTeleworked: "No aplica",
    unitHeadRepeatValidation: "No aplica",
    directionValidation: "Pendiente",
    resolutionDate: "",
    observations: "Observación inicial",
    status: "telework-entry",
    statusManual: false,
    createdAt: "2026-06-01T10:00:00.000Z"
  };
  storage.set("rrll_telework", [initial]);

  await context.window.TeletrabajoModule.openTeleworkEditModal("tw-1");
  elements.get("editTeleworkType").value = "renovacion";
  elements.get("editTeleworkDiasTeletrabajoCast").value = "Miércoles y jueves";
  elements.get("editTeleworkDiasTeletrabajoEus").value = "Asteazkena eta osteguna";
  elements.get("editTeleworkPorcentajeTeletrabajo").value = "50%";
  elements.get("editTeleworkFechaInicioTeletrabajoCast").value = "2026-10-01";
  elements.get("editTeleworkFechaFinTeletrabajoCast").value = "2027-07-31";
  elements.get("editTeleworkFechaInicioTeletrabajoEus").value = "2026-10-01";
  elements.get("editTeleworkFechaFinTeletrabajoEus").value = "2027-07-31";
  elements.get("editTeleworkPresenceValidation").value = "Sí";
  elements.get("editTeleworkFavorableReport").value = "Sí";
  elements.get("editTeleworkSecurity").value = "Sí";
  elements.get("editTeleworkPrevention").value = "Sí";
  elements.get("editTeleworkDirectionValidation").value = "Aprobada";
  elements.get("editTeleworkResolutionDate").value = "2026-06-03";
  elements.get("editTeleworkObservations").value = "Observación modificada";

  await context.window.TeletrabajoModule.saveEditingTelework();

  const stored = context.window.TeletrabajoModule.getTeleworkItems()[0];
  assert.equal(stored.tipoSolicitud, "renovacion");
  assert.equal(stored.type, "Renovación");
  assert.deepEqual(stored.days, ["Martes", "Jueves"], "conserva días importados cuando no hay controles de días en el formulario");
  assert.equal(stored.diasTeletrabajoCast, "Miércoles y jueves");
  assert.equal(stored.diasTeletrabajoEus, "Asteazkena eta osteguna");
  assert.equal(stored.porcentajeTeletrabajo, "50%");
  assert.equal(stored.fechaInicioTeletrabajoCast, "2026-10-01");
  assert.equal(stored.fechaFinTeletrabajoCast, "2027-07-31");
  assert.equal(stored.fechaInicioTeletrabajoEus, "2026-10-01");
  assert.equal(stored.fechaFinTeletrabajoEus, "2027-07-31");
  assert.equal(stored.directionValidation, "Aprobada");
  assert.equal(stored.status, "telework-approved");
  assert.equal(stored.resolutionDate, "2026-06-03");
  assert.equal(stored.observations, "Observación modificada");
  assert.equal(stored.observationHistory[0].text, "Observación modificada");
  assert.match(elements.get("teleworkListBody").innerHTML, /50%/, "la tabla principal se refresca con el porcentaje editado");

  const persistedTelework = persistedSnapshots.filter(entry => entry.key === "rrll_telework").at(-1).value[0];
  assert.equal(persistedTelework.observations, "Observación modificada");
  assert.equal(persistedTelework.status, "telework-approved");

  const reopenedContext = createTeleworkEditContext();
  reopenedContext.storage.set("rrll_telework", JSON.parse(JSON.stringify(storage.get("rrll_telework"))));
  const reopened = reopenedContext.context.window.TeletrabajoModule.getTeleworkItems()[0];
  assert.equal(reopened.diasTeletrabajoCast, "Miércoles y jueves");
  assert.equal(reopened.porcentajeTeletrabajo, "50%");
  assert.equal(reopened.fechaFinTeletrabajoCast, "2027-07-31");
  assert.equal(reopened.observations, "Observación modificada");
  assert.equal(reopened.status, "telework-approved");
  assert.deepEqual(reopened.days, ["Martes", "Jueves"]);
}

run().then(() => console.log("teletrabajo edit persistence smoke test passed"));
