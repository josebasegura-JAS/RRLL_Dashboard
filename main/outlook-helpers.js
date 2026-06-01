const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

function psLiteral(value) {
  return `'${String(value || "").replace(/'/g, "''")}'`;
}

function buildOutlookDraftPowerShellScript({ to, cc, subject, htmlBody }) {
  return [
    "$ErrorActionPreference = 'Stop'",
    "$outlook = New-Object -ComObject Outlook.Application",
    "$mail = $outlook.CreateItem(0)",
    `$mail.To = ${psLiteral(to)}`,
    `$mail.CC = ${psLiteral(cc)}`,
    `$mail.Subject = ${psLiteral(subject)}`,
    `$mail.HTMLBody = ${psLiteral(htmlBody)}`,
    "$mail.Display()",
    "Write-Output 'OK_DRAFT_DISPLAYED'"
  ].join("\n");
}

async function runOutlookScript(label, script, timeoutMs = 15000) {
  console.log(`[OutlookDraft] ${label}: inicio PowerShell`);
  return new Promise(resolve => {
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const child = spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded], { windowsHide: true });
    let settled = false;
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      console.error(`[OutlookDraft] ${label}: timeout`);
      resolve({ ok: false, code: "timeout", message: "Outlook no respondió al intentar crear el borrador." });
    }, timeoutMs);
    child.stdout.on("data", chunk => { stdout += String(chunk || ""); });
    child.stderr.on("data", chunk => { stderr += String(chunk || ""); });
    child.on("error", error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      console.error(`[OutlookDraft] ${label}: spawn error`, error);
      resolve({ ok: false, code: "spawn_error", message: error && error.message ? error.message : "No se pudo ejecutar PowerShell." });
    });
    child.on("close", code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      console.log(`[OutlookDraft] ${label}: stdout`, stdout.trim());
      console.log(`[OutlookDraft] ${label}: stderr`, stderr.trim());
      console.log(`[OutlookDraft] ${label}: código de salida`, code);
      resolve({ ok: code === 0, code, stdout, stderr });
    });
  });
}

function buildOutlookDraftVbs({ to, cc, subject, htmlBody }) {
  const esc = value => String(value || "").replace(/"/g, '""');
  return [
    "Set OutlookApp = CreateObject(\"Outlook.Application\")",
    "Set Mail = OutlookApp.CreateItem(0)",
    `Mail.To = "${esc(to)}"`,
    `Mail.Subject = "${esc(subject)}"`,
    `Mail.HTMLBody = "${esc(htmlBody)}"`,
    cc ? `Mail.CC = "${esc(cc)}"` : "",
    "Mail.Display"
  ].filter(Boolean).join("\r\n");
}

async function runOutlookDraftVbs(payload) {
  const tempVbs = path.join(os.tmpdir(), `rrll_outlook_${Date.now()}.vbs`);
  fs.writeFileSync(tempVbs, buildOutlookDraftVbs(payload), "utf8");

  const vbsResult = await new Promise(resolve => {
    const child = spawn("cscript.exe", ["//NoLogo", tempVbs], { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", chunk => { stderr += String(chunk || ""); });
    child.on("close", code => resolve({ code, stderr }));
    child.on("error", error => resolve({ code: -1, stderr: error && error.message ? error.message : "error ejecutando VBS" }));
  });
  try { fs.unlinkSync(tempVbs); } catch {}
  return vbsResult;
}

module.exports = {
  buildOutlookDraftPowerShellScript,
  buildOutlookDraftVbs,
  psLiteral,
  runOutlookDraftVbs,
  runOutlookScript
};
