'use strict';
const pdf = require(__dirname + '/../pdfCreator.js');
const timer = require('timers');
const {ipcRenderer} = require('electron');

ipcRenderer.on('message', (e, m) => {

  if(m.type === 'start'){
    let path = m.data;
    ipcRenderer.send('toUi', {type: 'start'});
    pdf.readDir(path, status => {
      let percent = parseInt((status.now/status.total) * 100);
      ipcRenderer.send('toUi', {type: 'process', data: percent});
    }, info => {
      if(info === 'ok')
        timer.setTimeout(() => {
            ipcRenderer.send('toUi', {type:'end'});
        }, 1000);
      if(info === 'null')
        ipcRenderer.send('toUi', {type: 'null'});
    });
  }

});
