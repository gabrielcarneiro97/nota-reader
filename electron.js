const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

const { version } = require(path.join(__dirname, '/package.json'));

function electronMain() {
  let win;
  let backgroundWin;
  app.on('ready', () => {
    win = new BrowserWindow({
      width: 300,
      height: 300,
      resizable: false,
      backgroundColor: '#e0e0e0',
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
      },
    });

    win.setTitle(`NFS-e (BH) ${version}`);

    backgroundWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
      },
    });

    win.loadURL(
      url.format({
        pathname: path.join(__dirname, 'app/index.html'),
        protocol: 'file:',
        slashes: true,
      }),
    );

    backgroundWin.loadURL(
      url.format({
        pathname: path.join(__dirname, 'app/process.html'),
        protocol: 'file:',
        slashes: true,
      }),
    );

    // win.webContents.openDevTools({ detach: true });
    // backgroundWin.webContents.openDevTools({ detach: true });

    win.on('closed', () => {
      win = null;
      backgroundWin.destroy();
    });

    backgroundWin.on('closed', () => {
      backgroundWin = null;
    });

    ipcMain.on('toUi', (e, m) => {
      win.webContents.send('message', m);
    });

    ipcMain.on('toProcessor', (e, m) => {
      backgroundWin.webContents.send('message', m);
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

module.exports = electronMain;
