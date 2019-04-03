var Config = require('./core/config');

var config = new Config();
config.set({
  cartodb_attributions: '© <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
  cartodb_logo_link: 'http://www.carto.com'
});

module.exports = config;
