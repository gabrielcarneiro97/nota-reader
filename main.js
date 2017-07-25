'use strict';

const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

let win;

var createWindow = () => {
  win = new BrowserWindow({
    width: 300,
    height: 300,
    resizable: false,
    backgroundColor: "#e0e0e0",
    autoHideMenuBar: true
  });

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'app/index.html'),
    protocol: 'file:',
    slashes: true
  }));


  win.webContents.openDevTools({detach: true});

  win.on('closed', () => {
    win = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
