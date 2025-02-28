const { app, BrowserWindow, dialog, Menu, protocol, nativeTheme } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

let mainWindow;
let loadUrl = "https://laravel.projectmaker.bzh/"; // URL par défaut
let protocolUrl = null; // Stocke l'URL passée via le protocole

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1600,
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

  mainWindow.loadURL(url, {
    extraHeaders: "Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self';",
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Gestion du protocole personnalisé
app.on("ready", () => {
  nativeTheme.themeSource = 'dark';
  app.setAsDefaultProtocolClient("projectmaker");

  createWindow(loadUrl); // Charge l'URL par défaut au démarrage
  createAppMenu();
  autoUpdater.checkForUpdatesAndNotify();
});

// Événement déclenché lors de l'ouverture d'une URL avec le protocole personnalisé
app.on("open-url", (event, url) => {
  event.preventDefault();
  protocolUrl = url.replace("projectmaker://", "https://beta.dash.project-maker.fr/");
  
  // Affiche la boîte de dialogue avec l'URL reçue
  dialog.showMessageBox({
    type: "info",
    title: "URI détecté",
    message: `L'application a reçu l'URI : ${url}`,
  }).then(() => {
    if (mainWindow) {
      mainWindow.loadURL(protocolUrl); // Charge l'URL si la fenêtre existe
      mainWindow.focus();
    } else {
      createWindow(protocolUrl); // Crée une nouvelle fenêtre avec l'URL
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (!mainWindow) {
    createWindow(loadUrl); // Recharge l'URL par défaut si la fenêtre est fermée
  } else {
    mainWindow.focus();
  }
});

// Gestion des instances multiples et des URL de protocole
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine) => {
    if (commandLine.length > 1) {
      const urlArg = commandLine[commandLine.length - 1];
      if (urlArg.startsWith("projectmaker://")) {
        protocolUrl = urlArg.replace("projectmaker://", "https://laravel.projectmaker.bzh/");

        if (mainWindow) {
          mainWindow.loadURL(protocolUrl); // Charge l'URL sans créer une nouvelle fenêtre
          mainWindow.focus();
        } else {
          createWindow(protocolUrl); // Crée une nouvelle fenêtre si elle n'est pas ouverte
        }
      }
    } else if (mainWindow) {
      mainWindow.focus();
    }
  });
}

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
