const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync(require.resolve("./teletrabajo.js"), "utf8");
const dashboard = fs.readFileSync(require.resolve("../dashboard.html"), "utf8");
const fixture = require.resolve("./fixtures/teletrabajo-survey-20262027.json");

function readFixtureRows() {
  const survey = JSON.parse(fs.readFileSync(fixture, "utf8"));
  assert.equal(survey.sheetName, "Solicitud Teletrabajo 20262027");
  return survey.rows.filter(row => row.some(value => String(value || "").trim()));
}

const storage = new Map();
const savedKeys = [];
let uuid = 0;
const context = {
  console,
  Date,
  Math,
  setTimeout: callback => callback(),
  load: (key, fallback) => storage.has(key) ? storage.get(key) : fallback,
  save: (key, value) => { savedKeys.push(key); storage.set(key, value); },
  document: { getElementById: () => null, querySelectorAll: () => [] },
  window: { crypto: { randomUUID: () => `fixture-${++uuid}` } }
};
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(source, context, { filename: "teletrabajo.js" });

storage.set("rrll_telework", [{ employeeNumber: "1004", nombreCompleto: "Preexistente", period: "2026-2027", status: "telework-entry" }]);
const summary = context.window.TeletrabajoModule.applyTeleworkSurveyRows(readFixtureRows());
const items = context.window.TeletrabajoModule.getTeleworkItems();
const ana = items.find(item => item.employeeNumber === "1001");
const carla = items.find(item => item.employeeNumber === "1003");

assert.deepEqual(JSON.parse(JSON.stringify(summary)), {
  totalRowsRead: 8,
  totalYesResponses: 4,
  totalNoResponses: 1,
  totalScoreRowsIgnored: 2,
  totalRequestsCreated: 2,
  totalIncidents: 3
});
assert.equal(items.length, 3, "solo crea las dos solicitudes válidas y conserva la preexistente");
assert.equal(ana.nombreCompleto, "García López, Ana");
assert.equal(ana.name, "García López, Ana");
assert.equal(ana.observations, "martes y jueves\nseptiembre-junio renovación");
assert.deepEqual(Array.from(ana.days), [], "no interpreta martes y jueves");
assert.equal(ana.status, "telework-entry");
assert.equal(ana.type, "Nuevo");
assert.equal(carla.observations, "  un día si no es posible dos  ", "conserva literalmente espacios y texto libre");
assert.deepEqual(Array.from(carla.days), [], "no interpreta lenguaje natural");
assert.equal(items.some(item => item.employeeNumber === "1002"), false, "Respuesta + No no importa");
assert.equal(items.some(item => item.employeeNumber === "1005"), false, "una fila errónea no detiene el resto");
assert.deepEqual([...new Set(savedKeys)], ["rrll_telework"], "solo persiste dentro de Teletrabajo");
assert.match(context.window.TeletrabajoModule.formatTeleworkSurveySummary(summary), /Total solicitudes creadas: 2\./);
assert.match(dashboard, /teleworkSurveyImportChooseFile\(\)/);
assert.match(dashboard, /id="teleworkSurveyImportFileInput"[^>]+onchange="importTeleworkSurvey\(event\)"/);

console.log("teletrabajo survey import smoke test passed");
