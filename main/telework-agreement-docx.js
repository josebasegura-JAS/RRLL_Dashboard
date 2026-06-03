const path = require("path");
const fs = require("fs");
const AdmZip = require("adm-zip");

const TELEWORK_AGREEMENT_MARKER_MAP = [
  ["«Nombre_Completo»", "nombreCompleto"],
  ["«Numero_Empleado»", "employeeNumber"],
  ["«Número_Empleado»", "employeeNumber"],
  ["«Tipo_Solicitud»", "tipoSolicitud"],
  ["«DNI»", "dni"],
  ["«Puesto_CAST»", "puestoCast"],
  ["«Puesto_EUS»", "puestoEus"],
  ["«Dirección»", "direccionTeletrabajo"],
  ["«Residencia_CAST»", "residenciaCast"],
  ["«Residencia_EUS»", "residenciaEus"],
  ["«Días_Teletrabajo_CAST»", "diasTeletrabajoCast"],
  ["«Días_Teletrabajo_EUS»", "diasTeletrabajoEus"],
  ["«Porcentaje»", "porcentajeTeletrabajo"],
  ["«Fecha_Ordenador»", "fechaOrdenadorFormatted"],
  ["«Fecha_Cascos»", "fechaCascosFormatted"],
  ["«Fecha_Inicio_CAST»", "fechaInicioTeletrabajoCastFormatted"],
  ["«Fecha_Fin_CAST»", "fechaFinTeletrabajoCastFormatted"],
  ["«Fecha_Inicio_EUS»", "fechaInicioTeletrabajoEusFormatted"],
  ["«Fecha_Fin_EUS»", "fechaFinTeletrabajoEusFormatted"],
  ["U/H/E", "employeeNumber"],
  ["D/M/A", "currentDateNumeric"],
  ["M_1ºdata", "currentDateEus"],
  ["M_2ºdata", "currentDateEus"],
  ["fecha", "currentDateCast"]
];

const TELEWORK_AGREEMENT_REQUIRED_FIELDS = [
  ["dni", "DNI"],
  ["direccionTeletrabajo", "Dirección Teletrabajo"],
  ["residenciaCast", "Residencia CAST"],
  ["residenciaEus", "Residencia EUS"],
  ["puestoCast", "Puesto CAST"],
  ["puestoEus", "Puesto EUS"],
  ["fechaInicioTeletrabajoCast", "Fecha inicio CAST"],
  ["fechaFinTeletrabajoCast", "Fecha fin CAST"],
  ["fechaInicioTeletrabajoEus", "Fecha inicio EUS"],
  ["fechaFinTeletrabajoEus", "Fecha fin EUS"],
  ["diasTeletrabajoCast", "Días de teletrabajo CAST"],
  ["diasTeletrabajoEus", "Días de teletrabajo EUS"],
  ["porcentajeTeletrabajo", "Porcentaje"]
];

const MONTHS_CAST = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_EUS = ["urtarrilaren", "otsailaren", "martxoaren", "apirilaren", "maiatzaren", "ekainaren", "uztailaren", "abuztuaren", "irailaren", "urriaren", "azaroaren", "abenduaren"];

function parseDateOnly(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  match = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (match) {
    let year = Number(match[3]);
    if (year < 100) year += year > 70 ? 1900 : 2000;
    return { year, month: Number(match[2]), day: Number(match[1]) };
  }
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  return null;
}

function formatDateCast(value) {
  const parts = parseDateOnly(value);
  if (!parts) return String(value || "").trim();
  return `${parts.day} de ${MONTHS_CAST[parts.month - 1]} de ${parts.year}`;
}

function formatDateEus(value) {
  const parts = parseDateOnly(value);
  if (!parts) return String(value || "").trim();
  return `${parts.year}ko ${MONTHS_EUS[parts.month - 1]} ${parts.day}a`;
}

function formatDateNumeric(value) {
  const parts = parseDateOnly(value);
  if (!parts) return String(value || "").trim();
  return `${String(parts.day).padStart(2, "0")}/${String(parts.month).padStart(2, "0")}/${parts.year}`;
}

function escapeDocxXmlText(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function docxReplacementXml(value) {
  return String(value == null ? "" : value)
    .split(/\r\n|\r|\n/)
    .map(escapeDocxXmlText)
    .join('</w:t><w:br/><w:t>');
}

function validateTeleworkAgreementData(data) {
  const missing = TELEWORK_AGREEMENT_REQUIRED_FIELDS
    .filter(([key]) => !String(data && data[key] != null ? data[key] : "").trim())
    .map(([, label]) => label);
  return missing;
}

function buildTeleworkAgreementData(payload = {}, now = new Date()) {
  const plantilla = payload.plantilla && typeof payload.plantilla === "object" ? payload.plantilla : {};
  const telework = payload.telework && typeof payload.telework === "object" ? payload.telework : {};
  const currentIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const data = {
    ...plantilla,
    ...telework,
    nombreCompleto: telework.nombreCompleto || telework.name || plantilla.nombreCompleto || plantilla.fullName || plantilla.name || "",
    employeeNumber: telework.employeeNumber || plantilla.employeeNumber || "",
    tipoSolicitud: telework.tipoSolicitud || "",
    fechaOrdenadorFormatted: formatDateCast(plantilla.fechaOrdenador),
    fechaCascosFormatted: formatDateCast(plantilla.fechaCascos),
    fechaInicioTeletrabajoCastFormatted: formatDateCast(telework.fechaInicioTeletrabajoCast),
    fechaFinTeletrabajoCastFormatted: formatDateCast(telework.fechaFinTeletrabajoCast),
    fechaInicioTeletrabajoEusFormatted: formatDateEus(telework.fechaInicioTeletrabajoEus),
    fechaFinTeletrabajoEusFormatted: formatDateEus(telework.fechaFinTeletrabajoEus),
    currentDateNumeric: formatDateNumeric(currentIso),
    currentDateCast: formatDateCast(currentIso),
    currentDateEus: formatDateEus(currentIso)
  };
  return data;
}

function findAllOccurrences(text, marker) {
  const positions = [];
  if (!marker) return positions;
  let index = text.indexOf(marker);
  while (index >= 0) {
    positions.push(index);
    index = text.indexOf(marker, index + marker.length);
  }
  return positions;
}

function replaceMarkersInTextNodes(xml, replacements, foundMarkers) {
  const textNodeRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
  const nodes = [];
  let match;
  while ((match = textNodeRegex.exec(xml))) {
    nodes.push({ start: match.index + match[0].indexOf(match[1]), end: match.index + match[0].indexOf(match[1]) + match[1].length, text: match[1] });
  }
  if (!nodes.length) return xml;

  const fullText = nodes.map(node => node.text).join("");
  const charMap = [];
  nodes.forEach((node, nodeIndex) => {
    for (let offset = 0; offset < node.text.length; offset += 1) charMap.push({ nodeIndex, offset });
  });

  const occurrences = [];
  Object.entries(replacements).forEach(([marker, replacement]) => {
    findAllOccurrences(fullText, marker).forEach(index => occurrences.push({ marker, replacement, index, end: index + marker.length }));
  });
  if (!occurrences.length) return xml;

  occurrences.sort((a, b) => b.index - a.index);
  occurrences.forEach(occurrence => {
    const start = charMap[occurrence.index];
    const end = charMap[occurrence.end - 1];
    if (!start || !end) return;
    foundMarkers.add(occurrence.marker);
    if (start.nodeIndex === end.nodeIndex) {
      const node = nodes[start.nodeIndex];
      node.text = `${node.text.slice(0, start.offset)}${occurrence.replacement}${node.text.slice(end.offset + 1)}`;
      return;
    }
    const firstNode = nodes[start.nodeIndex];
    const lastNode = nodes[end.nodeIndex];
    firstNode.text = `${firstNode.text.slice(0, start.offset)}${occurrence.replacement}`;
    for (let idx = start.nodeIndex + 1; idx < end.nodeIndex; idx += 1) nodes[idx].text = "";
    lastNode.text = lastNode.text.slice(end.offset + 1);
  });

  let updated = "";
  let cursor = 0;
  nodes.forEach(node => {
    updated += xml.slice(cursor, node.start) + node.text;
    cursor = node.end;
  });
  updated += xml.slice(cursor);
  return updated;
}

function replaceTeleworkAgreementMarkersInDocx(templatePath, outputPath, payload, options = {}) {
  const data = buildTeleworkAgreementData(payload, options.now || new Date());
  const missingFields = validateTeleworkAgreementData(data);
  if (missingFields.length) throw new Error(`No se puede generar el acuerdo. Faltan datos obligatorios: ${missingFields.join(", ")}.`);

  const replacements = Object.fromEntries(TELEWORK_AGREEMENT_MARKER_MAP.map(([marker, key]) => [marker, docxReplacementXml(data[key])]));
  const zip = new AdmZip(fs.readFileSync(templatePath));
  const foundMarkers = new Set();

  zip.getEntries().forEach(entry => {
    if (entry.isDirectory || !/^word\/.*\.xml$/i.test(entry.entryName)) return;
    const xml = entry.getData().toString("utf8");
    const updated = replaceMarkersInTextNodes(xml, replacements, foundMarkers);
    if (updated !== xml) zip.updateFile(entry.entryName, Buffer.from(updated, "utf8"));
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  zip.writeZip(outputPath);
  return { outputPath, foundMarkers: Array.from(foundMarkers), missingMarkers: Object.keys(replacements).filter(marker => !foundMarkers.has(marker)) };
}

function buildTeleworkAgreementFileName(payload = {}) {
  const data = buildTeleworkAgreementData(payload);
  const fullName = String(data.nombreCompleto || "").trim();
  let surname1 = data.surname1 || data.apellido1 || "";
  let surname2 = data.surname2 || data.apellido2 || "";
  let name = data.firstName || data.nombre || "";
  if ((!surname1 || !surname2 || !name) && fullName.includes(",")) {
    const [surnames, givenName] = fullName.split(",", 2).map(part => part.trim());
    const surnameParts = surnames.split(/\s+/).filter(Boolean);
    surname1 = surname1 || surnameParts[0] || "";
    surname2 = surname2 || surnameParts[1] || "";
    name = name || givenName || "";
  }
  if (!surname1 || !surname2 || !name) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length >= 3) {
      surname1 = surname1 || parts[parts.length - 2];
      surname2 = surname2 || parts[parts.length - 1];
      name = name || parts.slice(0, -2).join("_");
    } else {
      surname1 = surname1 || parts[0] || "SinApellido1";
      surname2 = surname2 || parts[1] || "SinApellido2";
      name = name || parts.slice(2).join("_") || parts[0] || "SinNombre";
    }
  }
  const sanitize = value => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "SinDato";
  return `Teletrabajo_${sanitize(surname1)}_${sanitize(surname2)}_${sanitize(name)}.docx`;
}

module.exports = {
  TELEWORK_AGREEMENT_MARKER_MAP,
  TELEWORK_AGREEMENT_REQUIRED_FIELDS,
  buildTeleworkAgreementData,
  buildTeleworkAgreementFileName,
  docxReplacementXml,
  formatDateCast,
  formatDateEus,
  formatDateNumeric,
  replaceMarkersInTextNodes,
  replaceTeleworkAgreementMarkersInDocx,
  validateTeleworkAgreementData
};
