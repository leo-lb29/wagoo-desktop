const { app, BrowserWindow, dialog, Menu, protocol, session } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

let mainWindow;
let loadUrl = "https://laravel.projectmaker.bzh/"; // URL par défaut

function createWindow() {
  if (mainWindow) return;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    icon: path.join(__dirname, "logo.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      disableBlinkFeatures: "Auxclick, WebSQL",
      allowRunningInsecureContent: false,
      webSecurity: true,
    },
  });

  mainWindow.loadURL(loadUrl, {
    extraHeaders: "Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self';",
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Gestion du protocole personnalisé
app.on("ready", () => {
  app.setAsDefaultProtocolClient("projectmaker");

  if (!mainWindow) createWindow();
  createAppMenu();
  autoUpdater.checkForUpdatesAndNotify();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (!mainWindow) {
    createWindow();
  } else {
    mainWindow.focus();
  }
});

// Gestion des URI et des instances multiples
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine) => {
    if (commandLine.length > 1) {
      const urlArg = commandLine[commandLine.length - 1];
      if (urlArg.startsWith("projectmaker://")) {
        loadUrl = urlArg.replace("projectmaker://", "https://laravel.projectmaker.bzh/");
        // Affiche une boîte de dialogue avec l'URI
        dialog.showMessageBox({
          type: "info",
          title: "URI détecté",
          message: `L'application a reçu l'URI : ${urlArg}`,
        });
      }
      if (mainWindow) {
        mainWindow.loadURL(loadUrl);
        mainWindow.focus();
      } else {
        createWindow();
      }
    } else if (mainWindow) {
      mainWindow.focus();
    }
  });
}

app.on("open-url", (event, url) => {
  event.preventDefault();
  // Affiche une boîte de dialogue avec l'URI
  dialog.showMessageBox({
    type: "info",
    title: "URI détecté",
    message: `L'application a reçu l'URI : ${url}`,
  }).then(() => {
    loadUrl = url.replace("projectmaker://", "https://laravel.projectmaker.bzh/");
    if (mainWindow) {
      mainWindow.loadURL(loadUrl);
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
});

// AutoUpdater et création du menu
autoUpdater.on("update-available", () => {
  dialog.showMessageBox({
    type: "info",
    title: "Mise à jour disponible",
    message: "Une nouvelle version est disponible. Voulez-vous l'installer maintenant ou plus tard ?",
    buttons: ["Installer maintenant", "Installer au prochain démarrage"],
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on("update-downloaded", () => {
  dialog.showMessageBox({
    title: "Mise à jour téléchargée",
    message: "La mise à jour a été téléchargée. Elle sera installée au prochain redémarrage.",
  }).then(() => {
    autoUpdater.quitAndInstall();
  });
});

function createAppMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: "Fichier",
      submenu: [{ role: "reload" }, { role: "quit" }],
    },
    {
      label: "Outils",
      submenu: [
        {
          label: "Vérifier les mises à jour",
          click: () => {
            autoUpdater.checkForUpdates();
          },
        },
      ],
    },
    {
      label: "Autre / Information",
      submenu: [{ role: "about" }],
    },
    {
      label: "Navigation",
      submenu: [
        {
          label: "Retour",
          accelerator: "Ctrl+Z",
          click: () => {
            if (mainWindow.webContents.canGoBack()) {
              mainWindow.webContents.goBack();
            }
          },
        },
        {
          label: "Avant",
          accelerator: "Ctrl+Shift+Z",
          click: () => {
            if (mainWindow.webContents.canGoForward()) {
              mainWindow.webContents.goForward();
            }
          },
        },
      ],
    },
    {
      label: "Actions",
      submenu: [
        { role: "cut", label: "Couper" },
        { role: "copy", label: "Copier" },
        { role: "paste", label: "Coller" },
        { type: "separator" },
        { role: "reload", label: "Recharger" },
        {
          label: "Ouvrir DevTools",
          click: () => {
            mainWindow.webContents.openDevTools();
          },
        },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);
}
