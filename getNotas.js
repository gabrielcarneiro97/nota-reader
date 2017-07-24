'use strict';
const fs = require('fs');
const xml2js = require('xml2js');

//recupera a lista de serviços armazenada em um JSON
var listaServicos = JSON.parse(fs.readFileSync('listaServicos.json', 'utf8'));

//recupera a lista de todas as cidades do Brasil armazenadas em um JSON
var listaCidades = JSON.parse(fs.readFileSync('listaCidades.json', 'utf8'));

/*
* @func defineRegime -> recebe um código referente ao regime tributário e retorna uma String descritiva.
*   @param cod -> código do regime tributário.
*   @return String contendo a descrição do regime.
*/
var defineRegime = cod => {
  cod |= 0;
  cod = cod.toString();
  return (
    cod === "2" ? "Estimativa" :
    cod === "3" ? "Sociedade de Profissionais" :
    cod === "4" ? "Cooperativa" :
    cod === "5" ? "MEI do Simples Nacional" :
    cod === "6" ? "ME ou EPP do Simples Nacional" : "");
}

/*
* @func defineNatureza -> recebe um código referente a natureza da tributação e retorna uma String descritiva.
*   @param cod -> código da natureza da tributação.
*   @return String contendo a descrição da natureza.
*/
var defineNatureza = cod => {
  cod |= 0;
  cod = cod.toString();
  return (
    cod === "1" ? "Tributação no município" :
    cod === "2" ? "Tributação fora do município" :
    cod === "3" ? "Isenção" :
    cod === "4" ? "Imune" :
    cod === "5" ? "Exigibilidade suspensa por decisão judicial" : "");
}

/*
* @func defineServico -> recebe um código referente ao serviço, consulta um objeto contendo todos os serviços listados na LC 116/2003 e retorna uma String com a descrição.
*   @param cod -> código do serviço.
*   @return String contendo a descrição do serviço.
*/
var defineServico = cod => {
  cod |= 0;
  cod = cod.toString();
  return listaServicos[cod];
}

/*
* @func defineCidade -> recebe um código IBGE referente a cidade, consulta um objeto com todas as cidades e códigos listados e retorna uma String com o nome da cidade referente.
*   @param cod -> código IBGE da cidade.
*   @return String contendo o nome da cidade.
*/
var defineCidade = cod => {
  cod |= 0;
  cod = cod.toString();
  return listaCidades[cod];
}

/* @func simplify -> recebe o NFS-e em XML e o converte em um objeto.
*   @param el -> XML contendo a nota.
*   @param callback -> função de callback que tem como @param nota onde se encontra a nota objetificada.
*/
var simplify = (data, callback) => {
  xml2js.parseString(data, (err, elBruto) => {

    if(err) throw err;

    let el = elBruto.CompNfse.Nfse[0].InfNfse[0];
    let nota = {
      num: el.Numero[0],
      codVer: el.CodigoVerificacao[0],
      emissao: new Date(el.DataEmissao[0]),
      comp: new Date(el.Competencia[0]),
      desc: el.Servico[0].Discriminacao[0],
      simples: el.OptanteSimplesNacional ? el.OptanteSimplesNacional[0] : 2,
      natureza: {
        desc: el.NaturezaOperacao ? defineNatureza(el.NaturezaOperacao[0]) : "",
        cod: el.NaturezaOperacao[0] || 0
      },
      regimeEspecial: {
          desc: el.RegimeEspecialTributacao ? defineRegime(el.RegimeEspecialTributacao[0]) : el.simples === "1" ? "ME ou EPP do Simples Nacional" : "",
          cod: el.RegimeEspecialTributacao ? el.RegimeEspecialTributacao[0] : 0
      },
      subitem: {
        desc: el.Servico[0].ItemListaServico ? defineServico(el.Servico[0].ItemListaServico[0]) : "",
        cod: el.Servico[0].ItemListaServico ? el.Servico[0].ItemListaServico[0] : 0
      },
      valores: {
        valor: el.Servico[0].Valores[0].ValorServicos[0],
        valorLiquido: el.Servico[0].Valores[0].ValorLiquidoNfse[0],
        baseCalc: el.Servico[0].Valores[0].BaseCalculo[0],
        deducao: el.Servico[0].Valores[0].ValorDeducoes ? el.Servico[0].Valores[0].ValorDeducoes[0] : 0,
        desconto: el.Servico[0].Valores[0].DescontoCondicionado ? el.Servico[0].Valores[0].DescontoCondicionado[0] : 0,
        incondicionado: el.Servico[0].Valores[0].DescontoIncondicionado ? el.Servico[0].Valores[0].DescontoIncondicionado[0] : 0,
        iss: {
            valor: el.Servico[0].Valores[0].ValorIss ? el.Servico[0].Valores[0].ValorIss[0] : 0,
            aliquota: el.Servico[0].Valores[0].Aliquota ? el.Servico[0].Valores[0].Aliquota[0] : 0
        },
        retencoes: {
          pis: el.Servico[0].Valores[0].ValorPis ? el.Servico[0].Valores[0].ValorPis[0] : 0,
          cofins: el.Servico[0].Valores[0].ValorCofins ? el.Servico[0].Valores[0].ValorCofins[0] : 0,
          csll: el.Servico[0].Valores[0].ValorCsll ? el.Servico[0].Valores[0].ValorCsll[0] : 0,
          inss: el.Servico[0].Valores[0].ValorInss ? el.Servico[0].Valores[0].ValorInss[0] : 0,
          ir: el.Servico[0].Valores[0].ValorIr ? el.Servico[0].Valores[0].ValorIr[0] : 0,
          iss: el.Servico[0].Valores[0].ValorIssRetido ? el.Servico[0].Valores[0].ValorIssRetido[0] : 0,
          outras: el.Servico[0].Valores[0].OutrasRetencoes ? el.Servico[0].Valores[0].OutrasRetencoes[0] : 0
        }
      },
      prestador: {
        nome: el.PrestadorServico[0].RazaoSocial[0],
        cnpj: el.PrestadorServico[0].IdentificacaoPrestador[0].Cnpj[0],
        im: el.PrestadorServico[0].IdentificacaoPrestador[0].InscricaoMunicipal[0],
        endereco: {
          logradouro: el.PrestadorServico[0].Endereco[0].Endereco[0],
          num: el.PrestadorServico[0].Endereco[0].Numero,
          complemento: el.PrestadorServico[0].Endereco[0].Complemento ? el.PrestadorServico[0].Endereco[0].Complemento[0] : "",
          bairro: el.PrestadorServico[0].Endereco[0].Bairro[0],
          codigoMun: el.PrestadorServico[0].Endereco[0].CodigoMunicipio[0],
          cidade: defineCidade(el.PrestadorServico[0].Endereco[0].CodigoMunicipio[0]),
          estado: el.PrestadorServico[0].Endereco[0].Uf[0],
          cep: el.PrestadorServico[0].Endereco[0].Cep[0]
        },
        contato: el.PrestadorServico[0].Contato ?  {
          tel: el.PrestadorServico[0].Contato[0].Telefone ? el.PrestadorServico[0].Contato[0].Telefone[0] : "",
          email: el.PrestadorServico[0].Contato[0].Email ? el.PrestadorServico[0].Contato[0].Email[0] : ""
        } : {},
      },
      tomador: {
        nome: el.TomadorServico[0].RazaoSocial[0],
        cnpj: el.TomadorServico[0].IdentificacaoTomador[0].CpfCnpj[0].Cnpj ? el.TomadorServico[0].IdentificacaoTomador[0].CpfCnpj[0].Cnpj[0] : "",
        cpf: el.TomadorServico[0].IdentificacaoTomador[0].CpfCnpj[0].Cpf ? el.TomadorServico[0].IdentificacaoTomador[0].CpfCnpj[0].Cpf[0] : "",
        im: el.TomadorServico[0].IdentificacaoTomador[0].InscricaoMunicipal ? el.TomadorServico[0].IdentificacaoTomador[0].InscricaoMunicipal[0] : "",
        endereco: {
          logradouro: el.TomadorServico[0].Endereco[0].Endereco[0],
          num: el.TomadorServico[0].Endereco[0].Numero[0],
          complemento: el.TomadorServico[0].Endereco[0].Complemento ? el.TomadorServico[0].Endereco[0].Complemento[0] : "",
          bairro: el.TomadorServico[0].Endereco[0].Bairro[0],
          codigoMun: el.TomadorServico[0].Endereco[0].CodigoMunicipio[0],
          cidade: defineCidade(el.PrestadorServico[0].Endereco[0].CodigoMunicipio[0]),
          estado: el.TomadorServico[0].Endereco[0].Uf[0],
          cep: el.TomadorServico[0].Endereco[0].Cep[0]
        },
        contato: el.TomadorServico[0].Contato ?  {
          tel: el.TomadorServico[0].Contato[0].Telefone ? el.TomadorServico[0].Contato[0].Telefone[0] : "",
          email: el.TomadorServico[0].Contato[0].Email ? el.TomadorServico[0].Contato[0].Email[0] : ""
        } : {}
      }
    }
    callback(nota);
  });


}

/* @func isXml -> testa se o nome do arquivo é referente a um xml.
*   @param filename -> nome do arquivo.
*   @return true se o arquivo terminar com .xml.
*/
var isXml = filename => {
  return filename.endsWith('.xml');
}

/* @func readDir -> lê um diretório e converte todos os arquivos .xml no diretório em objetos.
*   @param dirname -> é o nome do diretório.
*   @param callback -> função callback que tem como @param arr que contém um array com todos os objetos.
*/
var readDir = (dirname, callback) => {

  fs.readdir(dirname, (err, files) => {

    if(!dirname.endsWith('/')) dirname += '/';

    files = files.filter(isXml);

    if(err) {
      throw err;
    }

    let arr = [];

    files.forEach((filename, id) => {

      if(filename.endsWith('.xml')){
        fs.readFile(dirname + filename, 'utf8', (err, data) => {
          simplify(data, nota => {
            arr.push(nota);

            if(arr.length === files.length) callback(arr);
          });
        });
      }
    });
  });

}

module.exports = {
  simplify: simplify,
  readDir: readDir
}
