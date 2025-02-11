const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

// Crée une fenêtre principale
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')  // Si vous avez besoin de sécurité dans le rendu
    }
  });

  // Charger la page web
  mainWindow.loadURL('https://wagoo.app');

  // Créer le menu de l'application
  const template = [
    {
      label: 'Application',
      submenu: [
        {
          label: 'Quitter',
          accelerator: 'CmdOrCtrl+Q',
          click() {
            app.quit();
          }
        },
        {
          label: 'Vérifier les mises à jour',
          click() {
            autoUpdater.checkForUpdatesAndNotify();
          }
        }
      ]
    },
    {
      label: 'Outils',
      submenu: [
        {
          label: 'Recharger',
          accelerator: 'CmdOrCtrl+R',
          click() {
            mainWindow.reload();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Lorsque la fenêtre est fermée
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Vérifier les mises à jour
autoUpdater.setFeedURL({
  provider: 'github',
  repo: 'leo-lb29/wagoo-desktop',  // Remplacez par votre propre repo si nécessaire
  owner: 'leo-lb29'
});

autoUpdater.on('update-available', () => {
  console.log('Mise à jour disponible');
});

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});

autoUpdater.on('error', (err) => {
  console.error('Erreur de mise à jour:', err);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
