const { Calculator, Patient } = require('who-growth');

console.log('Calculator properties:', Object.keys(Calculator));
console.log('Calculator prototype:', Object.getOwnPropertyNames(Calculator.prototype));

const calc = new Calculator();
console.log('calc properties:', Object.keys(calc));
