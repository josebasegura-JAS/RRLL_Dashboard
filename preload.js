const { contextBridge, ipcRenderer } = require("electron");

function ticketRestaurantPerfDebugEnabled() {
  try { return window.localStorage && window.localStorage.getItem("rrll_ticket_restaurant_perf_debug") === "1"; } catch { return false; }
}

contextBridge.exposeInMainWorld("rrllDB", {
  loadAll: () => ipcRenderer.invoke("db:loadAll", { perfDebug: ticketRestaurantPerfDebugEnabled() }),
  loadTicketCalendars: () => ipcRenderer.invoke("db:loadTicketCalendars", { perfDebug: ticketRestaurantPerfDebugEnabled() }),
  saveTicketCalendar: payload => ipcRenderer.invoke("db:saveTicketCalendar", payload),
  disableTicketCalendar: calendarId => ipcRenderer.invoke("db:disableTicketCalendar", calendarId),
  enableTicketCalendar: calendarId => ipcRenderer.invoke("db:enableTicketCalendar", calendarId),
  deleteTicketCalendar: calendarId => ipcRenderer.invoke("db:deleteTicketCalendar", calendarId),
  loadBudgetScenarios: () => ipcRenderer.invoke("db:loadBudgetScenarios"),
  saveBudgetScenario: payload => ipcRenderer.invoke("db:saveBudgetScenario", payload),
  duplicateBudgetScenario: (scenarioId, newName) => ipcRenderer.invoke("db:duplicateBudgetScenario", scenarioId, newName),
  loadBudgetManualItems: scenarioId => ipcRenderer.invoke("db:loadBudgetManualItems", scenarioId),
  saveBudgetManualItem: payload => ipcRenderer.invoke("db:saveBudgetManualItem", payload),
  deleteBudgetManualItem: id => ipcRenderer.invoke("db:deleteBudgetManualItem", id),
  loadBudgetTicketGroups: scenarioId => ipcRenderer.invoke("db:loadBudgetTicketGroups", scenarioId),
  saveBudgetTicketGroup: payload => ipcRenderer.invoke("db:saveBudgetTicketGroup", payload),
  deleteBudgetTicketGroup: id => ipcRenderer.invoke("db:deleteBudgetTicketGroup", id),
  saveAll: data => ipcRenderer.invoke("db:saveAll", data),
  saveKey: (key, value) => ipcRenderer.invoke("db:saveKey", key, value),
  backupAll: data => ipcRenderer.invoke("db:backupAll", data),
  createBackup: payload => ipcRenderer.invoke("db:createBackup", payload),
  getBackupStatus: () => ipcRenderer.invoke("db:getBackupStatus"),
  getMirrorStatus: () => ipcRenderer.invoke("db:getMirrorStatus"),
  updateLocalMirror: () => ipcRenderer.invoke("db:updateLocalMirror"),
  useMirrorAsLocalDatabase: () => ipcRenderer.invoke("db:useMirrorAsLocalDatabase"),
  openMirrorFolder: () => ipcRenderer.invoke("db:openMirrorFolder"),
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
