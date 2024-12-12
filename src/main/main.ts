import * as fs from "fs";
import * as path from "path";

import { BrowserWindow, app, dialog, ipcMain } from "electron";

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  // Load the app
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
};

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

// Handle PDF file opening
ipcMain.handle("open-pdf", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "PDF Files", extensions: ["pdf"] }],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const fileContent = fs.readFileSync(filePath);
    return {
      path: filePath,
      content: fileContent,
    };
  }
  return null;
});

// Handle PDF file saving
ipcMain.handle("save-pdf", async (event, { filePath, content }) => {
  try {
    const result = await dialog.showSaveDialog({
      defaultPath: filePath,
      filters: [{ name: "PDF Files", extensions: ["pdf"] }],
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, Buffer.from(content));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error saving PDF:", error);
    return false;
  }
});
