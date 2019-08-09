const path = require('path');
const fs = require('fs');
const conversor = require('xml-js').xml2js;

// recupera a lista de serviços armazenada em um JSON
const listaServicos = require(path.join(__dirname, '/listaServicos.json'));

// recupera a lista de todas as cidades do Brasil armazenadas em um JSON
const listaCidades = require(path.join(__dirname, '/listaCidades.json'));

const listaCTISS = require(path.join(__dirname, '/ctiss.json'));

const fsPromises = fs.promises;

function txt(obj, ret) {
  const txt = obj && obj._text; // eslint-disable-line
  if (ret === undefined) return (txt || '');
  return (txt || ret);
}

/**
 * @func trataCod função responsável por tratar os códigos recebidos nas funções de definição.
 *   @param {String|Number} cod contém o código a ser tratado.
 *   @return {String} retorna o código como String, se ele for undef ou null, retorna 0.
 */
function trataCod(cod) {
  return (cod || 0).toString();
}

/**
 * @func defineRegime recebe um código referente
 *  ao regime tributário e retorna uma String descritiva.
 *   @param {String|Number} cod código do regime tributário.
 *   @return {String} contendo a descrição do regime.
 */
function defineRegime(codParm) {
  const cod = trataCod(codParm);
  return {
    2: 'Estimativa',
    3: 'Sociedade de Profissionais',
    4: 'Cooperativa',
    5: 'MEI do Simples Nacional',
    6: 'ME ou EPP do Simples Nacional',
  }[cod] || '';
}

/**
 * @func defineNatureza recebe um código referente a
 *  natureza da tributação e retorna uma String descritiva.
 *   @param cod código da natureza da tributação.
 *   @return {String} contendo a descrição da natureza.
 */
function defineNatureza(codParm) {
  const cod = trataCod(codParm);
  return {
    1: 'Tributação no município',
    2: 'Tributação fora do município',
    3: 'Isenção',
    4: 'Imune',
    5: 'Exigibilidade suspensa por decisão judicial',
  }[cod] || '';
}

/**
 * @func defineServico recebe um código referente ao serviço,
 *  consulta um objeto contendo todos os serviços listados na
 *  LC 116/2003 e retorna uma String com a descrição.
 *   @param {String|Number} cod código do serviço.
 *   @return {String} contendo a descrição do serviço.
 */
const defineServico = cod => listaServicos[trataCod(cod)];

/**
 * @func defineCidade recebe um código IBGE referente a cidade,
 *  consulta um objeto com todas as cidades e códigos listados
 *  e retorna uma String com o nome da cidade referente.
 *   @param {String|Number} cod código IBGE da cidade.
 *   @return {String}  contendo o nome da cidade.
 */
const defineCidade = cod => listaCidades[trataCod(cod)];

const defineCTISS = cod => listaCTISS[trataCod(cod)];

/**
 * @func converterXML recebe o NFS-e em XML e o converte em um objeto.
 *   @param {String} el XML contendo a nota.
 *   @return {Promise} retorna uma Promise, quando
 *    resolvida contém o objeto com as informações da nota.
 */
async function converterXML(data) {
  const notaObj = conversor(data, { compact: true });

  const { CompNfse } = notaObj;

  // testa se o XML recebido contém uma nota.
  if (!CompNfse) throw new Error('XML invalido!');

  // informações gerais da nota.
  const { InfNfse } = CompNfse.Nfse;

  const { NfseSubstituicao, NfseCancelamento } = CompNfse;

  const sub = CompNfse.NfseSubstituicao ? txt(NfseSubstituicao.SubstituicaoNfse.NfseSubstituidora) : '';

  const defCancelada = () => {
    if (!NfseCancelamento) return null;

    const { Confirmacao } = NfseCancelamento;
    const { DataHora, DataHoraCancelamento } = Confirmacao;

    const dataHora = DataHora || DataHoraCancelamento;

    const obj = {
      is: NfseCancelamento,
      sub,
      data: new Date(txt(dataHora)),
    };

    return obj;
  };

  const {
    Numero,
    CodigoVerificacao,
    DataEmissao,
    Competencia,
    OptanteSimplesNacional,
    Servico,
    NaturezaOperacao,
    RegimeEspecialTributacao,
    PrestadorServico,
    TomadorServico,
  } = InfNfse;

  const {
    IdentificacaoTomador,
  } = TomadorServico;

  const {
    IdentificacaoPrestador,
  } = PrestadorServico;


  const {
    Discriminacao,
    ItemListaServico,
    CodigoTributacaoMunicipio,
    Valores,
  } = Servico;

  const {
    ValorServicos,
    ValorLiquidoNfse,
    BaseCalculo,
    ValorDeducoes,
    DescontoCondicionado,
    DescontoIncondicionado,
    ValorIss,
    Aliquota,
    ValorPis,
    ValorCofins,
    ValorCsll,
    ValorInss,
    ValorIr,
    ValorIssRetido,
    OutrasRetencoes,
  } = Valores;

  const nota = {
    cancelada: defCancelada(),
    num: txt(Numero),
    codVer: txt(CodigoVerificacao),
    emissao: new Date(txt(DataEmissao)),
    comp: new Date(txt(Competencia)),
    desc: txt(Discriminacao).replace(/\|/g, '\n'),
    simples: txt(OptanteSimplesNacional, '2'),
    natureza: {
      desc: NaturezaOperacao ? defineNatureza(txt(NaturezaOperacao)) : '',
      cod: txt(NaturezaOperacao, 0),
    },
    regimeEspecial: {
      desc: defineRegime(txt(RegimeEspecialTributacao)),
      cod: txt(RegimeEspecialTributacao),
    },
    subitem: {
      desc: defineServico(txt(ItemListaServico)),
      cod: txt(ItemListaServico),
    },
    ctiss: {
      desc: defineCTISS(txt(CodigoTributacaoMunicipio)),
      cod: txt(CodigoTributacaoMunicipio),
    },
    valores: {
      valor: parseFloat(txt(ValorServicos, 0)),
      valorLiquido: parseFloat(txt(ValorLiquidoNfse, 0)),
      baseCalc: parseFloat(txt(BaseCalculo, 0)),
      deducao: parseFloat(txt(ValorDeducoes, 0)),
      desconto: parseFloat(txt(DescontoCondicionado, 0)),
      incondicionado: parseFloat(txt(DescontoIncondicionado, 0)),
      iss: {
        valor: parseFloat(txt(ValorIss, 0)),
        aliquota: parseFloat(txt(Aliquota, 0)),
      },
      retencoes: {
        pis: parseFloat(txt(ValorPis, 0)),
        cofins: parseFloat(txt(ValorCofins, 0)),
        csll: parseFloat(txt(ValorCsll, 0)),
        inss: parseFloat(txt(ValorInss, 0)),
        ir: parseFloat(txt(ValorIr, 0)),
        iss: parseFloat(txt(ValorIssRetido, 0)),
        outras: parseFloat(txt(OutrasRetencoes, 0)),
      },
    },
    prestador: {
      nome: txt(PrestadorServico.RazaoSocial),
      cnpj: txt(IdentificacaoPrestador.Cnpj),
      im: txt(IdentificacaoPrestador.InscricaoMunicipal),
      endereco: {
        logradouro: txt(PrestadorServico.Endereco.Endereco),
        num: txt(PrestadorServico.Endereco.Numero),
        complemento: txt(PrestadorServico.Endereco.Complemento),
        bairro: txt(PrestadorServico.Endereco.Bairro),
        codigoMun: txt(PrestadorServico.Endereco.CodigoMunicipio),
        cidade: defineCidade(txt(PrestadorServico.Endereco.CodigoMunicipio)),
        estado: txt(InfNfse.PrestadorServico.Endereco.Uf),
        cep: txt(InfNfse.PrestadorServico.Endereco.Cep),
      },
      contato: PrestadorServico.Contato
        ? {
          tel: txt(PrestadorServico.Contato.Telefone),
          email: txt(PrestadorServico.Contato.Email),
        }
        : {},
    },
    tomador: {
      nome: txt(TomadorServico.RazaoSocial),
      cnpj: txt(IdentificacaoTomador.CpfCnpj.Cnpj),
      cpf: txt(IdentificacaoTomador.CpfCnpj.Cpf),
      im: txt(IdentificacaoTomador.InscricaoMunicipal),
      endereco: {
        logradouro: txt(TomadorServico.Endereco.Endereco),
        num: txt(TomadorServico.Endereco.Numero),
        complemento: txt(TomadorServico.Endereco.Complemento),
        bairro: txt(TomadorServico.Endereco.Bairro),
        codigoMun: txt(TomadorServico.Endereco.CodigoMunicipio),
        cidade: defineCidade(txt(TomadorServico.Endereco.CodigoMunicipio)),
        estado: txt(TomadorServico.Endereco.Uf),
        cep: txt(TomadorServico.Endereco.Cep),
      },
      contato: TomadorServico.Contato
        ? {
          tel: txt(TomadorServico.Contato.Telefone),
          email: txt(TomadorServico.Contato.Email),
        }
        : {},
    },
  };

  return nota;
}

/**
 * @func isXml testa se o nome do arquivo é referente a um xml.
 *   @param filename nome do arquivo.
 *   @return {Boolean} true se o nome do arquivo terminar com .xml.
 */
const isXml = filename => filename.endsWith('.xml');

/**
 * @func readDir lê um diretório e converte todos os arquivos .xml no diretório em objetos.
 *   @param {String} dirname é o nome do diretório.
 *   @return {Promise} Retorna uma promise, quando
 *    resolvida contém um {Array} com os objetos das notas
 */
async function readDir(dirname) {
  try {
    const files = (await fsPromises.readdir(dirname)).filter(isXml);

    if (files.length === 0) throw new Error('Sem arquivos encontrados no diretório');

    return Promise.all(
      files.map(async (filename) => {
        const file = await fsPromises.readFile(path.join(dirname, filename), 'utf-8');
        return converterXML(file);
      }),
    );
  } catch (err) {
    throw err;
  }
}

module.exports = {
  converterXML,
  readDir,
};
