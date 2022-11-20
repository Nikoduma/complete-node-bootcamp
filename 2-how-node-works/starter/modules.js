// console.log(arguments);
// console.log(require('module').wrapper);

//module.export
const C = require('./test-module-1'); // C è la classe che devo istanziare per usarla
const calc1 = new C(); // calc1 è una istanza della classe
console.log(calc1.add(1, 2));

//export
/* const calc2 = require('./test-module-2'); // calc2 è export di module 2
console.log(calc2.add(1, 2)); */

const { add, multiply, divide } = require('./test-module-2');
const { sub } = require('./test-module-2');

console.log(multiply(2, 5));

// caching
require('./test-module-3')(); // chiamo subito la funzione VEDO TUTTI E DUE I TESTI
require('./test-module-3')(); // chiamo subito la funzione VEDO SOLO IL TESTO DELLA FUNZIONE, IL PRIMO è CACHATO
require('./test-module-3')(); // chiamo subito la funzione VEDO SOLO IL TESTO DELLA FUNZIONE, IL PRIMO è CACHATO
