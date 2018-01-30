'use strict'

const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')

let win
let backgroundWin

var createWindow = () => {
  win = new BrowserWindow({
    width: 300,
    height: 250,
    resizable: false,
    backgroundColor: '#e0e0e0',
    autoHideMenuBar: true
  })

  backgroundWin = new BrowserWindow({show: false})

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'app/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  backgroundWin.loadURL(url.format({
    pathname: path.join(__dirname, 'app/process.html'),
    protocol: 'file:',
    slashes: true
  }))

  // win.webContents.openDevTools({detach: true});

  // backgroundWin.webContents.openDevTools({detach: true});

  win.on('closed', () => {
    win = null
    backgroundWin.destroy()
  })

  backgroundWin.on('closed', () => {
    backgroundWin = null
  })

  ipcMain.on('toUi', (e, m) => {
    win.webContents.send('message', m)
  })

  ipcMain.on('toProcessor', (e, m) => {
    backgroundWin.webContents.send('message', m)
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
