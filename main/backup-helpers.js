const fs = require("fs");
const path = require("path");

function backupTs(date = new Date()) {
  const pad = value => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function listManagedSqliteBackups(dir) {
  if (!dir || !fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => /^rrll-backup-\d{8}-\d{6}\.db$/.test(name))
    .map(name => {
      const file = path.join(dir, name);
      const stat = fs.statSync(file);
      return { file, name, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function pruneManagedSqliteBackups(dir, maxCount) {
  const files = listManagedSqliteBackups(dir);
  files.slice(maxCount).forEach(({ file }) => {
    try { fs.unlinkSync(file); } catch {}
  });
}

function getNextBackupPath(targetDir) {
  let timestamp = new Date();
  let filePath = path.join(targetDir, `rrll-backup-${backupTs(timestamp)}.db`);
  while (fs.existsSync(filePath)) {
    timestamp = new Date(timestamp.getTime() + 1000);
    filePath = path.join(targetDir, `rrll-backup-${backupTs(timestamp)}.db`);
  }
  return filePath;
}

module.exports = {
  backupTs,
  getNextBackupPath,
  listManagedSqliteBackups,
  pruneManagedSqliteBackups
};
