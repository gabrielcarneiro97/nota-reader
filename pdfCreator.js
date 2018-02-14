'use strict'

const path = require('path')
const notas = require(path.join(__dirname, '/getNotas.js'))
const PdfPrinter = require('pdfmake')
const fs = require('fs')
const R$ = require(path.join(__dirname, '/assets.js')).R$

const formatador = new Intl.DateTimeFormat({
  timeZone: 'America/Sao_Paulo',
  month: '2-digit',
  day: '2-digit',
  year: 'numeric'
})

const printer = new PdfPrinter({
  Roboto: {
    normal: path.join(__dirname, '/fonts/Roboto-Regular.ttf'),
    bold: path.join(__dirname, '/fonts/Roboto-Medium.ttf'),
    italics: path.join(__dirname, '/fonts/Roboto-Italic.ttf'),
    bolditalics: path.join(__dirname, '/fonts/Roboto-Italic.ttf')
  }
})

/**
* @func generateNota função responsável por criar os pdfs, recebe um objeto com as informações.
*   @param {Object} el parametro contendo o objeto com as informações da nota.
*   @return {Promise} quando resolvido contém um objeto PDFKit.
*/
const generateNota = (el) => {
  return new Promise(resolve => {
    // formatação da data de emissão.
    let dataEmissao = formatador.format(el.emissao)

    // formatação da data de competência.
    let dataComp = formatador.format(el.comp)

    // check para ver se a nota está cancelada.
    let cancelada = []

    if (el.cancelada.is) {
      let dataSub = formatador.format(el.cancelada.data)
      cancelada = [
        { text: `Nota de substituição: ${el.cancelada.sub}\t` },
        { text: `Data: ${dataSub}\t` }]
    }

    let retencoesFederais = parseFloat(el.valores.retencoes.pis) + parseFloat(el.valores.retencoes.cofins) + parseFloat(el.valores.retencoes.inss) + parseFloat(el.valores.retencoes.ir) + parseFloat(el.valores.retencoes.csll)

    let aliquota = el.valores.iss.aliquota > 1 ? el.valores.iss.aliquota : el.valores.iss.aliquota * 100

    // definição do documento.
    let docDef = {
      watermark: el.cancelada.is ? { text: 'CANCELADA', color: 'red' } : '',
      content: [
        { text: 'NFS-e NOTA FISAL DE SERVIÇOS ELETRÔNICA\n', fontSize: 10, alignment: 'center', marginBottom: 10, bold: true },
        {
          columns: [
            { text: `Nº: ${el.num.slice(0, 4)}/${parseInt(el.num.slice(4))}`, fontSize: 15, width: 200 },
            {
              text: [
                { text: 'Emitida em:\n', fontSize: 10 },
                { text: `${dataEmissao}` }
              ]
            },
            {
              text: [
                { text: 'Competencia:\n', fontSize: 10 },
                { text: `${dataComp}` }
              ]
            },
            {
              text: [
                { text: 'Código de Verificação:\n', fontSize: 10 },
                { text: `${el.codVer}` }
              ]
            }],
          marginBottom: 5
        },
        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595 - 2 * 40, y2: 5, lineWidth: 2 }], marginBottom: 7 },
        { text: `${el.prestador.nome}`, fontSize: 11, bold: true, marginBottom: 2 },
        {
          columns: [
            {
              text: [
                { text: `CNPJ/CPF: ${el.prestador.cnpj}\n`, fontSize: 10 },
                { text: `${el.prestador.endereco.logradouro}, ${el.prestador.endereco.num}, ${el.prestador.endereco.complemento}\n${el.prestador.endereco.bairro} - ${el.prestador.endereco.cidade}/${el.prestador.endereco.estado}`, fontSize: 8 }
              ]
            },
            {
              text: [
                { text: `Inscrição Municipal: ${el.prestador.im}\n`, fontSize: 10 },
                { text: `Telefone: ${el.prestador.contato.telefone || 'Não informado'}\n`, fontSize: 9 },
                { text: `Email: ${el.prestador.contato.email || 'Não informado'}`, fontSize: 9 }

              ]
            }],
          marginBottom: 6
        },
        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595 - 2 * 40, y2: 5, lineWidth: 0.25 }], marginBottom: 4 },
        { text: `Tomador:`, fontSize: 12, marginBottom: 3 },
        { text: `${el.tomador.nome}`, fontSize: 9, bold: true, marginBottom: 1, marginLeft: 15 },
        {
          columns: [
            {
              text: [
                { text: `CNPJ/CPF: ${el.tomador.cnpj || el.tomador.cpf}\n`, fontSize: 9 },
                { text: `${el.tomador.endereco.logradouro}, ${el.tomador.endereco.num}, ${el.tomador.endereco.complemento}\n${el.tomador.endereco.bairro} - ${el.tomador.endereco.cidade}/${el.tomador.endereco.estado}`, fontSize: 7 }
              ]
            },
            {
              text: [
                { text: `Inscrição Municipal: ${el.tomador.im || 'Não informado'}\n`, fontSize: 9 },
                { text: `Telefone: ${el.tomador.contato.telefone || 'Não informado'}\n`, fontSize: 7 },
                { text: `Email: ${el.tomador.contato.email || 'Não informado'}`, fontSize: 7 }

              ]
            }],
          marginBottom: 6,
          marginLeft: 15
        },
        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595 - 2 * 40, y2: 5, lineWidth: 0.25 }], marginBottom: 7 },
        { text: `Descrição do Serviço:`, fontSize: 10, marginBottom: 3 },
        { text: `${el.desc}`, fontSize: 8, marginLeft: 15, marginBottom: 6 },
        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595 - 2 * 40, y2: 5, lineWidth: 0.25 }], marginBottom: 7 },
        {
          columns: [
            {
              text: [
                { text: `Subitem Lista de Serviços LC 116/03\n`, fontSize: 9 },
                { text: `|-------> ${el.subitem.cod} - ${el.subitem.desc}`, fontSize: 8 }
              ]
            },
            {
              text: [
                { text: `Natureza de Operação\n`, fontSize: 9 },
                { text: `|-------> ${el.natureza.desc}`, fontSize: 8 }
              ]
            },
            {
              text: [
                { text: `Regime Especial\n`, fontSize: 9 },
                { text: `|-------> ${el.regimeEspecial.desc || ''}`, fontSize: 8 }
              ]
            }],
          marginBottom: 6
        },
        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595 - 2 * 40, y2: 5, lineWidth: 0.25 }], marginBottom: 7 },
        {
          columns: [
            {
              text: [
                { text: `Valor dos serviços:\n`, fontSize: 9, bold: true },
                { text: `( - ) Descontos: \n`, fontSize: 9 },
                { text: `( - ) Retenções federais: \n`, fontSize: 9 },
                { text: `( - ) ISS retido: \n`, fontSize: 9 },
                { text: `( - ) Outras retenções: \n`, fontSize: 9 },
                { text: `Valor liquido:\n`, fontSize: 9, bold: true }
              ]
            },
            {
              text: [
                { text: `R$ ${R$(el.valores.valor)}\n`, fontSize: 9, bold: true },
                { text: `R$ ${R$(el.valores.desconto)}\n`, fontSize: 9 },
                { text: `R$ ${R$(retencoesFederais)}\n`, fontSize: 9 },
                { text: `R$ ${R$(el.valores.retencoes.iss)}\n`, fontSize: 9 },
                { text: `R$ ${R$(el.valores.retencoes.outras)}\n`, fontSize: 9 },
                { text: `R$ ${R$(el.valores.valorLiquido)}\n`, fontSize: 9, bold: true }],
              alignment: 'right',
              marginRight: 15
            },
            {
              text: [
                { text: `Valor dos serviços:\n`, fontSize: 9, bold: true },
                { text: `( - ) Deduções: \n`, fontSize: 9 },
                { text: `( - ) Desconto Incondicionado: \n`, fontSize: 9 },
                { text: `( = ) Base de cálculo: \n`, fontSize: 9, bold: true },
                { text: `( x ) Aliquota: \n`, fontSize: 9 },
                { text: `( = ) Valor ISS:\n`, fontSize: 9, bold: true }]
            },
            {
              text: [
                { text: `R$ ${R$(el.valores.valor)}\n`, fontSize: 9, bold: true },
                { text: `R$ ${R$(el.valores.deducao)}\n`, fontSize: 9 },
                { text: `R$ ${R$(el.valores.incondicionado)}\n`, fontSize: 9 },
                { text: `R$ ${R$(el.valores.baseCalc)}\n`, fontSize: 9, bold: true },
                { text: `${aliquota}%\n`, fontSize: 9 },
                { text: `R$ ${R$(el.valores.iss.valor)}\n`, fontSize: 9, bold: true }],
              alignment: 'right'
            }],
          marginBottom: 6
        },
        { text: `Retenções Federais:\n`, fontSize: 9 },
        {
          text: [
            { text: `PIS: R$ ${R$(el.valores.retencoes.pis) || 0}\t` },
            { text: `COFINS: R$ ${R$(el.valores.retencoes.cofins) || 0}\t` },
            { text: `CSLL: R$ ${R$(el.valores.retencoes.csll) || 0}\t` },
            { text: `INSS: R$ ${R$(el.valores.retencoes.inss) || 0}\t` },
            { text: `IR: R$ ${R$(el.valores.retencoes.ir) || 0}\t` }],
          marginLeft: 15,
          fontSize: 8
        },
        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595 - 2 * 40, y2: 5, lineWidth: 0.01 }], marginBottom: 7 },
        { text: cancelada, marginLeft: 15, fontSize: 10 }
      ]
    }

    resolve(printer.createPdfKitDocument(docDef))
  })
}

/**
* @func readDir função responsável por ler um diretório e converter todas as notas fiscais contidas nele em pdfs.
*   @param {String} dir string com o diretório a ser lido.
*   @param {Function} progress função chamada a cada xml processado para indicar o andamento da converção, possui como parametro o número total de documentos a serem convertidos e o que acabou de ser convertido.
*   @return {Promise} quando resolvida contém os objetos com as notas, os XMLs já foram escritos no diretório
*/
const readDir = (dir, progress) => {
  return new Promise((resolve, reject) => {
    if (!dir.endsWith('/')) {
      dir += '/'
    }

    notas.readDir(dir).then(objs => {
      let promises = []
      if (objs) {
        objs.forEach((el, id) => {
          let fileName = el.cancelada.is ? `${el.num} CANCELADA.pdf` : `${el.num}.pdf`
          let p = new Promise(resolve => {
            progress({ total: objs.length, now: id + 1 })
            generateNota(el).then(pdfDoc => {
              if (!fs.existsSync(`${dir}pdfs/`)) {
                fs.mkdirSync(`${dir}pdfs/`)
              }
              pdfDoc.pipe(fs.createWriteStream(`${dir}pdfs/${fileName}`))
              pdfDoc.end()
              // função que informa o progresso a cada conversão.
              resolve()
            })
          })
          promises.push(p)
        })
        Promise.all(promises).then(() => {
          resolve(objs)
        })
      } else {
        reject(new Error('Arquivos não econtrados!'))
      }
    })
  })
}

module.exports = {
  generateNota: generateNota,
  readDir: readDir
}
