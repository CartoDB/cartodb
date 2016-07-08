var Config = require('./core/config');

var config = new Config();
config.set({
  cartodb_attributions: 'CARTO <a href="http://carto.com/attributions" target="_blank">attribution</a>',
  cartodb_logo_link: 'http://www.carto.com'
});

module.exports = config;
