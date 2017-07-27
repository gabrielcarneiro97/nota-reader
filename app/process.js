'use strict';
const pdf = require('../pdfCreator.js');
const timer = require('timers');
const {ipcRenderer} = require('electron');



ipcRenderer.on('message', (e, m) => {

  if(m.type === 'start'){
    let path = m.data;
    ipcRenderer.send('toUi', {type: 'start'});
    pdf.readDir(path, status => {
      let percent = parseInt((status.now/status.total) * 100);
      ipcRenderer.send('toUi', {type: 'process', data: percent});
    }, () => {
      timer.setTimeout(() => {
        ipcRenderer.send('toUi', {type:'end'});
      }, 1000);
    });
  }

});
