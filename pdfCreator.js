'use strict';

const notas = require('./getNotas.js');
const PdfPrinter = require('pdfmake');
const fs = require('fs');

var printer = new PdfPrinter({
    Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-Italic.ttf'
    }
});

let generatePdf = (el, callback) => {

  let diaEmissao = el.emissao.getDate() < 10 ? "0" + el.emissao.getDate() : el.emissao.getDate();
  let mesEmissao = el.emissao.getMonth()+1 < 10 ? "0" + (el.emissao.getMonth()+1) : el.emissao.getMonth()+1;
  let dataEmissao = `${diaEmissao}/${mesEmissao}/${el.emissao.getFullYear()}`;

  let diaComp = el.comp.getDate() < 10 ? "0" + el.comp.getDate() : el.comp.getDate();
  let mesComp = el.comp.getMonth()+1 < 10 ? "0" + (el.comp.getMonth()+1) : el.comp.getMonth()+1;
  let dataComp = `${diaComp}/${mesComp}/${el.comp.getFullYear()}`;

  let diaSub = el.cancelada.data.getDate() < 10 ? "0" + el.cancelada.data.getDate() : el.cancelada.data.getDate();
  let mesSub = el.cancelada.data.getMonth()+1 < 10 ? "0" + (el.cancelada.data.getMonth()+1) : el.cancelada.data.getMonth()+1;
  let dataSub = `${diaSub}/${mesSub}/${el.cancelada.data.getFullYear()}`;

  let retencoesFederais = parseFloat(el.valores.retencoes.pis) + parseFloat(el.valores.retencoes.cofins) +  parseFloat(el.valores.retencoes.inss) + parseFloat(el.valores.retencoes.ir) + parseFloat(el.valores.retencoes.csll);

  let aliquota = el.valores.iss.aliquota > 1 ? el.valores.iss.aliquota : el.valores.iss.aliquota * 100;

  let docDef = {
    watermark: el.cancelada.is ? {text: 'CANCELADA', color: 'red'} : '',
    content: [
      { text: "NFS-e NOTA FISAL DE SERVIÇOS ELETRÔNICA\n", fontSize: 10, alignment: "center", marginBottom: 10, bold: true},
      { columns: [
        {text: `Nº: ${el.num}`, fontSize:15, width: 200},
        {text: [
          {text: "Emitida em:\n", fontSize:10},
          {text: `${dataEmissao}`}
        ]},
        {text: [
          {text: "Competencia:\n", fontSize:10},
          {text: `${dataComp}`}
        ]},
        {text: [
          {text: "Código de Verificação:\n", fontSize:10},
          {text: `${el.codVer}`}
        ]}
      ], marginBottom: 5},
      {canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595-2*40, y2: 5, lineWidth: 2 }], marginBottom: 7},
      {text: `${el.prestador.nome}`, fontSize:11, bold:true, marginBottom: 2},
      { columns: [
        {text: [
          {text: `CNPJ/CPF: ${el.prestador.cnpj}\n`, fontSize: 10},
          {text: `${el.prestador.endereco.logradouro}, ${el.prestador.endereco.num}, ${el.prestador.endereco.complemento}\n${el.prestador.endereco.bairro} - ${el.prestador.endereco.cidade}/${el.prestador.endereco.estado}`, fontSize: 8}
        ]},
        {text: [
          {text: `Inscrição Municipal: ${el.prestador.im}\n`, fontSize: 10},
          {text: `Telefone: ${el.prestador.contato.telefone || "Não informado"}\n`, fontSize:9},
          {text: `Email: ${el.prestador.contato.email || "Não informado"}`, fontSize:9}

        ]}
      ], marginBottom: 6},
      {canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595-2*40, y2: 5, lineWidth: 0.25 }], marginBottom: 4},
      {text: `Tomador:`, fontSize:12, marginBottom: 3},
      {text: `${el.tomador.nome}`, fontSize:9, bold:true, marginBottom: 1, marginLeft: 15},
      { columns: [
        {text: [
          {text: `CNPJ/CPF: ${el.tomador.cnpj || el.tomador.cpf}\n`, fontSize: 9},
          {text: `${el.tomador.endereco.logradouro}, ${el.tomador.endereco.num}, ${el.tomador.endereco.complemento}\n${el.tomador.endereco.bairro} - ${el.tomador.endereco.cidade}/${el.tomador.endereco.estado}`, fontSize: 7}
        ]},
        {text: [
          {text: `Inscrição Municipal: ${el.tomador.im || "Não informado"}\n`, fontSize: 9},
          {text: `Telefone: ${el.tomador.contato.telefone || "Não informado"}\n`, fontSize:7},
          {text: `Email: ${el.tomador.contato.email || "Não informado"}`, fontSize:7}

        ]}
      ], marginBottom: 6, marginLeft: 15},
      {canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595-2*40, y2: 5, lineWidth: 0.25 }], marginBottom: 7},
      {text: `Descrição do Serviço:`, fontSize:10, marginBottom: 3},
      {text: `${el.desc}`, fontSize: 8, marginLeft: 15, marginBottom: 6},
      {canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595-2*40, y2: 5, lineWidth: 0.25 }], marginBottom: 7},
      { columns: [
        {text: [
          {text: `Subitem Lista de Serviços LC 116/03\n`, fontSize: 9},
          {text: `|-------> ${el.subitem.cod} - ${el.subitem.desc}`, fontSize: 8}
        ]},
        {text: [
          {text: `Natureza de Operação\n`, fontSize: 9},
          {text: `|-------> ${el.natureza.desc}`, fontSize: 8}
        ]},
        {text: [
          {text: `Regime Especial\n`, fontSize: 9},
          {text: `|-------> ${el.regimeEspecial.desc || ""}`, fontSize: 8}
        ]}
      ], marginBottom: 6},
      {canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595-2*40, y2: 5, lineWidth: 0.25 }], marginBottom: 7},
      { columns: [
        {text: [
            {text: `Valor dos serviços:\n`, fontSize: 9, bold: true},
            {text: `( - ) Descontos: \n`, fontSize: 9},
            {text: `( - ) Retenções federais: \n`, fontSize: 9},
            {text: `( - ) ISS retido: \n`, fontSize: 9},
            {text: `( - ) Outras retenções: \n`, fontSize: 9},
            {text: `Valor liquido:\n`, fontSize: 9, bold: true},
          ]},
        {text: [
            {text: `R$ ${el.valores.valor}\n`, fontSize: 9, bold: true},
            {text: `R$ ${el.valores.desconto}\n`, fontSize: 9},
            {text: `R$ ${retencoesFederais}\n`, fontSize: 9},
            {text: `R$ ${el.valores.retencoes.iss}\n`, fontSize: 9},
            {text: `R$ ${el.valores.retencoes.outras}\n`, fontSize: 9},
            {text: `R$ ${el.valores.valorLiquido}\n`, fontSize: 9, bold: true},
          ], alignment: "right", marginRight: 15},
          {text: [
              {text: `Valor dos serviços:\n`, fontSize: 9, bold: true},
              {text: `( - ) Deduções: \n`, fontSize: 9},
              {text: `( - ) Desconto Incondicionado: \n`, fontSize: 9},
              {text: `( = ) Base de cálculo: \n`, fontSize: 9, bold: true},
              {text: `( x ) Aliquota: \n`, fontSize: 9},
              {text: `( = ) Valor ISS:\n`, fontSize: 9, bold: true},
            ]},
          {text: [
              {text: `R$ ${el.valores.valor}\n`, fontSize: 9, bold: true},
              {text: `R$ ${el.valores.deducao}\n`, fontSize: 9},
              {text: `R$ ${el.valores.incondicionado}\n`, fontSize: 9},
              {text: `R$ ${el.valores.baseCalc}\n`, fontSize: 9, bold: true},
              {text: `${aliquota}%\n`, fontSize: 9},
              {text: `R$ ${el.valores.iss.valor}\n`, fontSize: 9, bold: true},
            ], alignment: "right"},
      ], marginBottom: 6},
      {text: `Retenções Federais:\n`, fontSize: 9},
      {text: [
        {text: `PIS: R$ ${el.valores.retencoes.pis || 0}\t`},
        {text: `COFINS: R$ ${el.valores.retencoes.cofins || 0}\t`},
        {text: `CSLL: R$ ${el.valores.retencoes.csll || 0}\t`},
        {text: `INSS: R$ ${el.valores.retencoes.inss || 0}\t`},
        {text: `IR: R$ ${el.valores.retencoes.ir || 0}\t`},
      ], marginLeft: 15, fontSize: 8},
      {canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595-2*40, y2: 5, lineWidth: 0.01 }], marginBottom: 7},
      {text: el.cancelada ? [
        {text: `Nota de substituição: ${el.cancelada.sub}\t`},
        {text: `Data: ${dataSub}\t`},
      ] : [], marginLeft: 15, fontSize: 10},
    ]
  }

  callback(printer.createPdfKitDocument(docDef));

}


let readDir = dir => {

  if(!dir.endsWith('/')) dir += '/';

  notas.readDir(dir, objs => {
    objs.forEach(el => {

      generatePdf(el, pdfDoc => {
        if(!fs.existsSync(`${dir}pdfs/`)) fs.mkdirSync(`${dir}pdfs/`);

        pdfDoc.pipe(fs.createWriteStream(`${dir}pdfs/${el.num}.pdf`));
        pdfDoc.end();
      });
    });
  });
}

module.exports = {
  generatePdf: generatePdf,
  readDir: readDir
}

readDir('./notas');
