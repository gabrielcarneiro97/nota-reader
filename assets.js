/**
 * @function R$ recebe um número e converte em uma string com formatação numérica brasileira
 *   @param {Number} valor número qualquer
 *   @return {String} contém o valor na formatação numérica brasileira,
 *    substituindo '.' por ',' e colocando um '.' a cada três número antes da ','
 * */
function R$(valorParm) {
  let valor = parseFloat(valorParm).toFixed(2);

  let negativo = '';

  if (valor.charAt(0) === '-') {
    negativo = '-';
    valor = valor.replace('-', '');
  }

  valor = valor.toString().replace('.', ',');

  let esquerda = valor.split(',')[0];
  const direita = valor.split(',')[1];

  let counter = 0;
  const esquerdaArr = [];
  for (let i = esquerda.length - 1; i >= 0; i -= 1) {
    counter += 1;
    esquerdaArr.push(esquerda[i]);
    if (counter === 3 && i > 0) {
      esquerdaArr.push('.');
      counter = 0;
    }
  }
  esquerda = esquerdaArr.reverse().join('');

  return `${negativo + esquerda},${direita}`;
}

function formataCtiss(codigo) {
  const str = codigo.toString();

  return `${str.slice(0, 4)}-${str[4]}/${str.slice(5, 7)}-${str.slice(7)}`;
}

module.exports = {
  R$,
  formataCtiss,
};
