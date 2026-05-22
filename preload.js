const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("rrllDB", {
  loadAll: () => ipcRenderer.invoke("db:loadAll"),
  saveAll: data => ipcRenderer.invoke("db:saveAll", data),
  saveKey: (key, value) => ipcRenderer.invoke("db:saveKey", key, value),
  backupAll: data => ipcRenderer.invoke("db:backupAll", data),
  createBackup: payload => ipcRenderer.invoke("db:createBackup", payload),
  getBackupStatus: () => ipcRenderer.invoke("db:getBackupStatus"),
  openBackupsFolder: () => ipcRenderer.invoke("db:openBackupsFolder"),
  getInfo: () => ipcRenderer.invoke("db:getInfo"),
  getState: () => ipcRenderer.invoke("db:getState"),
  chooseSharedDirectory: () => ipcRenderer.invoke("db:chooseSharedDirectory"),
  setSharedDirectory: (directory, currentData) => ipcRenderer.invoke("db:setSharedDirectory", directory, currentData),
  useLocalDatabase: currentData => ipcRenderer.invoke("db:useLocalDatabase", currentData),
  importCommitteeHistoryDocx: () => ipcRenderer.invoke("db:importCommitteeHistoryDocx"),
  importParitariaHistoryDocx: () => ipcRenderer.invoke("db:importParitariaHistoryDocx"),
  generateCommitteeMinutesDraft: payload => ipcRenderer.invoke("db:generateCommitteeMinutesDraft", payload)
});

contextBridge.exposeInMainWorld("rrllTicketRestaurant", {
  importSpreadsheet: () => ipcRenderer.invoke("ticketRestaurant:importSpreadsheet"),
  exportWorkbook: payload => ipcRenderer.invoke("ticketRestaurant:exportWorkbook", payload)
});

contextBridge.exposeInMainWorld("rrllFolder", {
  getPath: () => ipcRenderer.invoke("rrllFolder:getPath"),
  setPath: folderPath => ipcRenderer.invoke("rrllFolder:setPath", folderPath),
  open: () => ipcRenderer.invoke("rrllFolder:open")
});


contextBridge.exposeInMainWorld("rrllAttachments", {
  selectFiles: () => ipcRenderer.invoke("attachments:selectFiles"),
  openPath: filePath => ipcRenderer.invoke("attachments:openPath", filePath),
  openFolder: filePath => ipcRenderer.invoke("attachments:openFolder", filePath)
});
