const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("rrllDB", {
  loadAll: () => ipcRenderer.invoke("db:loadAll"),
  saveAll: data => ipcRenderer.invoke("db:saveAll", data),
  saveKey: (key, value) => ipcRenderer.invoke("db:saveKey", key, value),
  backupAll: data => ipcRenderer.invoke("db:backupAll", data),
  getInfo: () => ipcRenderer.invoke("db:getInfo"),
  getState: () => ipcRenderer.invoke("db:getState"),
  chooseSharedDirectory: () => ipcRenderer.invoke("db:chooseSharedDirectory"),
  setSharedDirectory: (directory, currentData) => ipcRenderer.invoke("db:setSharedDirectory", directory, currentData),
  useLocalDatabase: currentData => ipcRenderer.invoke("db:useLocalDatabase", currentData),
  importCommitteeHistoryDocx: () => ipcRenderer.invoke("db:importCommitteeHistoryDocx"),
  importParitariaHistoryDocx: () => ipcRenderer.invoke("db:importParitariaHistoryDocx"),
  generateCommitteeMinutesDraft: payload => ipcRenderer.invoke("db:generateCommitteeMinutesDraft", payload)
});
