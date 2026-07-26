const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const STORE_KEY = "choralis_library_path";

function getStoredPathFile() {
  return path.join(app.getPath("userData"), "library-path.txt");
}

function readStoredPath() {
  try {
    return fs.readFileSync(getStoredPathFile(), "utf-8").trim() || null;
  } catch {
    return null;
  }
}

function writeStoredPath(dirPath) {
  fs.writeFileSync(getStoredPathFile(), dirPath, "utf-8");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 500,
    title: "Choralis - Choir Voice Mixer",
    backgroundColor: "#05070a",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "public", "favicon.ico"),
  });

  Menu.setApplicationMenu(null);

  const indexPath = path.join(__dirname, "dist", "index.html");
  win.loadFile(indexPath).catch((err) => {
    console.error("Failed to load index.html:", err);
  });
}

// ── IPC Handlers ──────────────────────────────────────────────

ipcMain.handle("fs:pickFolder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    title: "Select Choralis Library Folder",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const dirPath = result.filePaths[0];
  writeStoredPath(dirPath);
  return { path: dirPath, name: path.basename(dirPath) };
});

ipcMain.handle("fs:pickZipFiles", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "ZIP Archives", extensions: ["zip"] }],
    title: "Select Vocal Guide ZIP Files",
  });
  if (result.canceled || result.filePaths.length === 0) return [];

  return result.filePaths.map((filePath) => ({
    name: path.basename(filePath),
    buffer: fs.readFileSync(filePath),
  }));
});

ipcMain.handle("fs:pickAudioFile", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Audio Files", extensions: ["mp3", "wav", "ogg", "flac", "m4a", "aac", "wma"] },
    ],
    title: "Select Audio File",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  return {
    name: path.basename(filePath),
    buffer: fs.readFileSync(filePath),
  };
});

ipcMain.handle("fs:pickPdfFile", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "PDF Files", extensions: ["pdf"] }],
    title: "Select Sheet Music PDF",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  return {
    name: path.basename(filePath),
    buffer: fs.readFileSync(filePath),
  };
});

ipcMain.handle("fs:listFiles", async (_evt, dirPath) => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries.map((e) => ({
      name: e.name,
      isDir: e.isDirectory(),
    }));
  } catch {
    return [];
  }
});

ipcMain.handle("fs:readFile", async (_evt, filePath) => {
  return fs.readFileSync(filePath);
});

ipcMain.handle("fs:writeFile", async (_evt, filePath, data) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, Buffer.from(data));
});

ipcMain.handle("fs:deleteFile", async (_evt, filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
});

ipcMain.handle("fs:ensureDir", async (_evt, dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

ipcMain.handle("fs:getStoredPath", async () => {
  return readStoredPath();
});

ipcMain.handle("fs:setStoredPath", async (_evt, dirPath) => {
  writeStoredPath(dirPath);
});

ipcMain.handle("fs:saveZip", async (_evt, defaultName, data) => {
  const result = await dialog.showSaveDialog({
    title: "Export Project as ZIP",
    defaultPath: defaultName || "choralis-project.zip",
    filters: [{ name: "ZIP Archive", extensions: ["zip"] }],
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, Buffer.from(data));
  return result.filePath;
});

// ── App Lifecycle ─────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
