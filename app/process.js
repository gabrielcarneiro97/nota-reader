'use strict'

const path = require('path')
const pdf = require(path.join(__dirname, '/../pdfCreator.js'))
const timer = require('timers')
const {ipcRenderer} = require('electron')

ipcRenderer.on('message', (e, m) => {
  if (m.type === 'start') {
    let path = m.data

    ipcRenderer.send('toUi', {type: 'start'})

    pdf.readDir(path, status => {
      let percent = status.now / status.total
      console.log(percent)

      ipcRenderer.send('toUi', {type: 'process', data: percent})
    }).then(done => {
      if (done) {
        timer.setTimeout(() => {
          ipcRenderer.send('toUi', { type: 'end' })
        }, 1000)
      } else {
        ipcRenderer.send('toUi', { type: 'null' })
      }
    }).catch(err => {
      console.error(err)
    })
  }
})
