'use strict';
const pdf = require('../pdfCreator.js');
const timer = require('timers');
const {ipcRenderer} = require('electron');

ipcRenderer.on('message', m => {
  let path = m;
  process.send({name: 'start'});
  pdf.readDir(path, status => {
    let percent = parseInt((status.now/status.total) * 100);
    process.send({name: 'process', data: percent});
  }, () => {
    timer.setTimeout(() => {
      process.send({name:'end'});
    }, 1000);
  });
});
