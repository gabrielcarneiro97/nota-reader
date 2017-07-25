'use strict';

const pdf = require('../pdfCreator.js');


let e = document.getElementById("teste");
e.onclick = () => {
  pdf.readDir('C:/Users/Gabriel/Projetos/nota-reader/notas');
}
