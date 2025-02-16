const { app, BrowserWindow, dialog, Menu } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

log.transports.file.level = "info";
autoUpdater.logger = log;

let win; // Variable pour stocker la fenêtre principale

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadURL("http://wagoo.local");

  // Créer le menu avec le bouton "Vérifier les mises à jour"
  const menu = Menu.buildFromTemplate([
    {
      label: "Application",
      submenu: [
        {
          label: "Vérifier les mises à jour",
          click() {
            log.info("Vérification des mises à jour...");
            autoUpdater.checkForUpdatesAndNotify();
          },
        },
        {
          role: "quit",
        },
      ],
    },
  ]);

  // Définir le menu de l'application
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  // Vérifier les mises à jour après un court délai pour éviter les conflits
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Événement : mise à jour disponible
autoUpdater.on("update-available", () => {
  log.info("Mise à jour disponible !");
});

// Événement : mise à jour téléchargée
autoUpdater.on("update-downloaded", () => {
  log.info("Mise à jour téléchargée.");

  const response = dialog.showMessageBoxSync(win, {
    type: "question",
    buttons: ["Installer maintenant", "Plus tard"],
    defaultId: 0,
    title: "Mise à jour disponible",
    message: "Une mise à jour a été téléchargée. Voulez-vous l'installer maintenant ?",
  });

  if (response === 0) {
    log.info("L'utilisateur a choisi d'installer la mise à jour.");
    autoUpdater.quitAndInstall();
  } else {
    log.info("L'utilisateur a choisi d'installer plus tard.");
  }
});

// Gestion des erreurs
autoUpdater.on("error", (err) => {
  log.error("Erreur lors de la mise à jour :", err);
});
