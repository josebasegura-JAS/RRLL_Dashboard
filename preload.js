const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("rrllDB", {
  loadAll: () => ipcRenderer.invoke("db:loadAll"),
  saveAll: data => ipcRenderer.invoke("db:saveAll", data),
  saveKey: (key, value) => ipcRenderer.invoke("db:saveKey", key, value),
  backupAll: data => ipcRenderer.invoke("db:backupAll", data),
  createBackup: payload => ipcRenderer.invoke("db:createBackup", payload),
  getBackupStatus: () => ipcRenderer.invoke("db:getBackupStatus"),
  getLastSaveStatus: () => ipcRenderer.invoke("db:getLastSaveStatus"),
  openBackupsFolder: () => ipcRenderer.invoke("db:openBackupsFolder"),
  getInfo: () => ipcRenderer.invoke("db:getInfo"),
  getState: () => ipcRenderer.invoke("db:getState"),
  getStartupAlert: () => ipcRenderer.invoke("db:getStartupAlert"),
  chooseSharedDirectory: () => ipcRenderer.invoke("db:chooseSharedDirectory"),
  probeSharedDirectory: directory => ipcRenderer.invoke("db:probeSharedDirectory", directory),
  setSharedDirectory: (directory, currentData, options) => ipcRenderer.invoke("db:setSharedDirectory", directory, currentData, options),
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

contextBridge.exposeInMainWorld("rrllOutlook", {
  createDraft: payload => ipcRenderer.invoke("outlook:createDraft", payload)
});

contextBridge.exposeInMainWorld("rrllMsg", {
  parseOutlookMsg: payload => ipcRenderer.invoke("msg:parseOutlookMsg", payload)
});
