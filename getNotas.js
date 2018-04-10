'use strict'

const path = require('path')
const fs = require('fs')
const conversor = require('xml-js').xml2js

// recupera a lista de serviços armazenada em um JSON
const listaServicos = require(path.join(__dirname, '/listaServicos.json'))

// recupera a lista de todas as cidades do Brasil armazenadas em um JSON
const listaCidades = require(path.join(__dirname, '/listaCidades.json'))

/**
* @func defineRegime recebe um código referente ao regime tributário e retorna uma String descritiva.
*   @param {String|Number} cod código do regime tributário.
*   @return {String} contendo a descrição do regime.
*/
const defineRegime = cod => {
  cod = trataCod(cod)
  return (
    cod === '2' ? 'Estimativa'
    : cod === '3' ? 'Sociedade de Profissionais'
    : cod === '4' ? 'Cooperativa'
    : cod === '5' ? 'MEI do Simples Nacional'
    : cod === '6' ? 'ME ou EPP do Simples Nacional' : '')
}

/**
* @func defineNatureza recebe um código referente a natureza da tributação e retorna uma String descritiva.
*   @param cod código da natureza da tributação.
*   @return {String} contendo a descrição da natureza.
*/
const defineNatureza = cod => {
  cod = trataCod(cod)
  return (
    cod === '1' ? 'Tributação no município'
    : cod === '2' ? 'Tributação fora do município'
    : cod === '3' ? 'Isenção'
    : cod === '4' ? 'Imune'
    : cod === '5' ? 'Exigibilidade suspensa por decisão judicial' : '')
}

/**
* @func defineServico recebe um código referente ao serviço, consulta um objeto contendo todos os serviços listados na LC 116/2003 e retorna uma String com a descrição.
*   @param {String|Number} cod código do serviço.
*   @return {String} contendo a descrição do serviço.
*/
const defineServico = cod => listaServicos[trataCod(cod)]

/**
* @func defineCidade recebe um código IBGE referente a cidade, consulta um objeto com todas as cidades e códigos listados e retorna uma String com o nome da cidade referente.
*   @param {String|Number} cod código IBGE da cidade.
*   @return {String}  contendo o nome da cidade.
*/
const defineCidade = cod => listaCidades[trataCod(cod)]

/**
* @func trataCod função responsável por tratar os códigos recebidos nas funções de definição.
*   @param {String|Number} cod contém o código a ser tratado.
*   @return {String} retorna o código como String, se ele for undef ou null, retorna 0.
*/
const trataCod = cod => (cod |= 0).toString()

/**
* @func converterXML recebe o NFS-e em XML e o converte em um objeto.
*   @param {String} el XML contendo a nota.
*   @return {Promise} retorna uma Promise, quando resolvida contém o objeto com as informações da nota.
*/
const converterXML = (data) => {
  return new Promise((resolve, reject) => {
    let notaObj = conversor(data, {compact: true})

    // testa se o XML recebido contém uma nota.
    if (notaObj.CompNfse) {
      // informações gerais da nota.
      let info = notaObj.CompNfse.Nfse.InfNfse

      // informações sobre o cancelamento da nota.
      let cancel = notaObj.CompNfse.NfseCancelamento ? notaObj.CompNfse.NfseCancelamento : false
      let sub = cancel && notaObj.CompNfse.NfseSubstituicao ? notaObj.CompNfse.NfseSubstituicao.SubstituicaoNfse.NfseSubstituidora['_text'] : ''

      let nota = {
        cancelada: {
          is: cancel,
          sub: sub,
          data: cancel ? (cancel.Confirmacao.DataHora ? new Date(cancel.Confirmacao.DataHora['_text']) : cancel.Confirmacao.DataHoraCancelamento ? new Date(cancel.Confirmacao.DataHoraCancelamento['_text']) : null) : false
        },
        num: info.Numero['_text'],
        codVer: info.CodigoVerificacao['_text'],
        emissao: new Date(info.DataEmissao['_text']),
        comp: new Date(info.Competencia['_text']),
        desc: info.Servico.Discriminacao['_text'].replace(/\|/g, '\n'),
        simples: info.OptanteSimplesNacional ? info.OptanteSimplesNacional['_text'] : '2',
        natureza: {
          desc: info.NaturezaOperacao ? defineNatureza(info.NaturezaOperacao['_text']) : '',
          cod: info.NaturezaOperacao['_text'] || 0
        },
        regimeEspecial: {
          desc: info.RegimeEspecialTributacao ? defineRegime(info.RegimeEspecialTributacao['_text']) : info.OptanteSimplesNacional['_text'] === '1' ? 'ME ou EPP do Simples Nacional' : '',
          cod: info.RegimeEspecialTributacao ? info.RegimeEspecialTributacao['_text'] : 0
        },
        subitem: {
          desc: info.Servico.ItemListaServico ? defineServico(info.Servico.ItemListaServico['_text']) : '',
          cod: info.Servico.ItemListaServico ? info.Servico.ItemListaServico['_text'] : 0
        },
        valores: {
          valor: parseFloat(info.Servico.Valores.ValorServicos['_text']),
          valorLiquido: parseFloat(info.Servico.Valores.ValorLiquidoNfse['_text']),
          baseCalc: parseFloat(info.Servico.Valores.BaseCalculo['_text']),
          deducao: info.Servico.Valores.ValorDeducoes ? parseFloat(info.Servico.Valores.ValorDeducoes['_text']) : 0,
          desconto: info.Servico.Valores.DescontoCondicionado ? parseFloat(info.Servico.Valores.DescontoCondicionado['_text']) : 0,
          incondicionado: info.Servico.Valores.DescontoIncondicionado ? parseFloat(info.Servico.Valores.DescontoIncondicionado['_text']) : 0,
          iss: {
            valor: info.Servico.Valores.ValorIss ? parseFloat(info.Servico.Valores.ValorIss['_text']) : 0,
            aliquota: info.Servico.Valores.Aliquota ? parseFloat(info.Servico.Valores.Aliquota['_text']) : 0
          },
          retencoes: {
            pis: info.Servico.Valores.ValorPis ? parseFloat(info.Servico.Valores.ValorPis['_text']) : 0,
            cofins: info.Servico.Valores.ValorCofins ? parseFloat(info.Servico.Valores.ValorCofins['_text']) : 0,
            csll: info.Servico.Valores.ValorCsll ? parseFloat(info.Servico.Valores.ValorCsll['_text']) : 0,
            inss: info.Servico.Valores.ValorInss ? parseFloat(info.Servico.Valores.ValorInss['_text']) : 0,
            ir: info.Servico.Valores.ValorIr ? parseFloat(info.Servico.Valores.ValorIr['_text']) : 0,
            iss: info.Servico.Valores.ValorIssRetido ? parseFloat(info.Servico.Valores.ValorIssRetido['_text']) : 0,
            outras: info.Servico.Valores.OutrasRetencoes ? parseFloat(info.Servico.Valores.OutrasRetencoes['_text']) : 0
          }
        },
        prestador: {
          nome: info.PrestadorServico.RazaoSocial['_text'],
          cnpj: info.PrestadorServico.IdentificacaoPrestador.Cnpj['_text'],
          im: info.PrestadorServico.IdentificacaoPrestador.InscricaoMunicipal['_text'],
          endereco: {
            logradouro: info.PrestadorServico.Endereco.Endereco['_text'],
            num: info.PrestadorServico.Endereco.Numero['_text'],
            complemento: info.PrestadorServico.Endereco.Complemento ? info.PrestadorServico.Endereco.Complemento['_text'] : '',
            bairro: info.PrestadorServico.Endereco.Bairro['_text'],
            codigoMun: info.PrestadorServico.Endereco.CodigoMunicipio['_text'],
            cidade: defineCidade(info.PrestadorServico.Endereco.CodigoMunicipio['_text']),
            estado: info.PrestadorServico.Endereco.Uf['_text'],
            cep: info.PrestadorServico.Endereco.Cep['_text']
          },
          contato: info.PrestadorServico.Contato ? {
            tel: info.PrestadorServico.Contato.Telefone ? info.PrestadorServico.Contato.Telefone['_text'] : '',
            email: info.PrestadorServico.Contato.Email ? info.PrestadorServico.Contato.Email['_text'] : ''
          } : {}
        },
        tomador: {
          nome: info.TomadorServico.RazaoSocial['_text'],
          cnpj: info.TomadorServico.IdentificacaoTomador.CpfCnpj.Cnpj ? info.TomadorServico.IdentificacaoTomador.CpfCnpj.Cnpj['_text'] : '',
          cpf: info.TomadorServico.IdentificacaoTomador.CpfCnpj.Cpf ? info.TomadorServico.IdentificacaoTomador.CpfCnpj.Cpf['_text'] : '',
          im: info.TomadorServico.IdentificacaoTomador.InscricaoMunicipal ? info.TomadorServico.IdentificacaoTomador.InscricaoMunicipal['_text'] : '',
          endereco: {
            logradouro: info.TomadorServico.Endereco.Endereco['_text'],
            num: info.TomadorServico.Endereco.Numero['_text'],
            complemento: info.TomadorServico.Endereco.Complemento ? info.TomadorServico.Endereco.Complemento['_text'] : '',
            bairro: info.TomadorServico.Endereco.Bairro['_text'],
            codigoMun: info.TomadorServico.Endereco.CodigoMunicipio['_text'],
            cidade: defineCidade(info.PrestadorServico.Endereco.CodigoMunicipio['_text']),
            estado: info.TomadorServico.Endereco.Uf['_text'],
            cep: info.TomadorServico.Endereco.Cep['_text']
          },
          contato: info.TomadorServico.Contato ? {
            tel: info.TomadorServico.Contato.Telefone ? info.TomadorServico.Contato.Telefone['_text'] : '',
            email: info.TomadorServico.Contato.Email ? info.TomadorServico.Contato.Email['_text'] : ''
          } : {}
        }
      }

      resolve(nota)
    } else {
      reject(new Error('XML invalido!'))
    }
  })
}

/**
* @func isXml testa se o nome do arquivo é referente a um xml.
*   @param filename nome do arquivo.
*   @return {Boolean} true se o nome do arquivo terminar com .xml.
*/
const isXml = filename => filename.endsWith('.xml')

/**
* @func readDir lê um diretório e converte todos os arquivos .xml no diretório em objetos.
*   @param {String} dirname é o nome do diretório.
*   @return {Promise} Retorna uma promise, quando resolvida contém um {Array} com os objetos das notas
*/
const readDir = (dirname) => {
  return new Promise((resolve, reject) => {
    fs.readdir(dirname, (err, files) => {
      if (err) {
        throw err
      }

      if (!dirname.endsWith('/')) {
        dirname += '/'
      }

      files = files.filter(isXml)

      let arr = []

      // confere se existem arquivos na array files.
      if (files.length === 0) {
        reject(new Error('Sem arquivos encontrados no diretório'))
      } else {
        let promises = []
        files.forEach((filename, id) => {
          if (filename.endsWith('.xml')) {
            let p = new Promise(resolve => {
              fs.readFile(dirname + filename, 'utf8', (err, data) => {
                if (err) {
                  console.error(err)
                }
                converterXML(data).then(nota => {
                  arr.push(nota)
                  resolve(nota)
                })
              })
            })
            promises.push(p)
          }
        })
        Promise.all(promises).then(nota => {
          resolve(arr)
        })
      }
    })
  })
}

module.exports = {
  converterXML: converterXML,
  readDir: readDir
}
