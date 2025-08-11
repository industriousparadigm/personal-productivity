const chrono = require('chrono-node');

const tests = [
  'Friday',
  'by Friday',
  'next Friday',
  'this Friday'
];

console.log('Today is:', new Date().toString());
console.log('---');

tests.forEach(test => {
  const result = chrono.parseDate(test);
  console.log(`"${test}" -> ${result ? result.toString() : 'null'}`);
});