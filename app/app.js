'use strict';

const cp = require('child_process');


let e = document.getElementById("start");
e.onclick = () => {

  let path = document.getElementById("pasta").files[0].path.replace(/\\/g, '/');

  let c1 = cp.spawn(process.execPath, [__dirname + '/child.js'], {
  stdio: ['inherit', 'inherit', 'inherit', 'ipc']
});

  c1.send(path);

  c1.on('message', m => {
    if(m.name === 'start') {
      document.getElementById("start").className += " disabled";
    }
    if(m.name === 'process') {
      document.getElementById("bar").style.width = m.data + "%";
    }
    if(m.name === 'end') {
      document.getElementById("start").className = document.getElementById("start").className.replace(" disabled", '');
      document.getElementById("bar").style.width = "0%";
      window.alert("Conversão relizada com sucesso!");
    }
  });


}
