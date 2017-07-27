'use strict';
const {ipcRenderer} = require('electron');

let m;

ipcRenderer.on('message', (e, m) => {
      console.log(m);
      if(m.type === 'start') {
        document.getElementById("start").className += " disabled";
      }
      if(m.type === 'process') {
        document.getElementById("bar").style.width = m.data + "%";
      }
      if(m.type === 'end') {
        document.getElementById("start").className = document.getElementById("start").className.replace(" disabled", '');
        document.getElementById("bar").style.width = "0%";
        window.alert("Conversão relizada com sucesso!");
      }
});


let e = document.getElementById("start");
e.onclick = () => {
  let path = document.getElementById("pasta").files[0].path.replace(/\\/g, '/');

  ipcRenderer.send('toProcessor', {type: 'start', data: path});


}
