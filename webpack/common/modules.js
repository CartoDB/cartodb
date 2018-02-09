const {resolve} = require('path');

module.exports = [
  resolve(resolve('.'), 'node_modules'),
  resolve(resolve('.'), 'lib/assets/javascripts')
];
