/**
* @function R$ recebe um número e converte em uma string com formatação numérica brasileira
*   @param {Number} valor número qualquer
*   @return {String} contém o valor na formatação numérica brasileira, substituindo '.' por ',' e colocando um '.' a cada três número antes da ','
**/
let R$ = valor => {
  valor = parseFloat(valor).toFixed(2)

  let negativo = ''

  if (valor.charAt(0) === '-') {
    negativo = '-'
    valor = valor.replace('-', '')
  }

  valor = valor.toString().replace('.', ',')

  let esquerda = valor.split(',')[0]
  let direita = valor.split(',')[1]

  let counter = 0
  let esquerdaArr = []
  for (let i = esquerda.length - 1; i >= 0; i--) {
    counter++
    esquerdaArr.push(esquerda[i])
    if (counter === 3 && i > 0) {
      esquerdaArr.push('.')
      counter = 0
    }
  }
  esquerda = esquerdaArr.reverse().join('')

  return negativo + esquerda + ',' + direita
}

module.exports = {
  R$: R$
}
