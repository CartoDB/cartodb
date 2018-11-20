const { resolve } = require('path');

module.exports = [
  'node_modules',
  resolve(resolve('.'), 'lib/assets/javascripts')
];
