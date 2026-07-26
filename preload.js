const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronFS", {
  isElectron: true,

  pickFolder: () => ipcRenderer.invoke("fs:pickFolder"),

  pickZipFiles: () => ipcRenderer.invoke("fs:pickZipFiles"),

  pickAudioFile: () => ipcRenderer.invoke("fs:pickAudioFile"),

  pickPdfFile: () => ipcRenderer.invoke("fs:pickPdfFile"),

  listFiles: (dirPath) => ipcRenderer.invoke("fs:listFiles", dirPath),

  readFile: (filePath) => ipcRenderer.invoke("fs:readFile", filePath),

  writeFile: (filePath, data) =>
    ipcRenderer.invoke("fs:writeFile", filePath, data),

  deleteFile: (filePath) => ipcRenderer.invoke("fs:deleteFile", filePath),

  ensureDir: (dirPath) => ipcRenderer.invoke("fs:ensureDir", dirPath),

  getStoredPath: () => ipcRenderer.invoke("fs:getStoredPath"),

  setStoredPath: (dirPath) => ipcRenderer.invoke("fs:setStoredPath", dirPath),

  saveZip: (defaultName, data) => ipcRenderer.invoke("fs:saveZip", defaultName, data),
});
