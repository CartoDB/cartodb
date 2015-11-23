var Config = require('./core/config');

var config = new Config();
config.set({
  cartodb_attributions: "CartoDB <a href=\"http://cartodb.com/attributions\" target=\"_blank\">attribution</a>",
  cartodb_logo_link: "http://www.cartodb.com"
});

module.exports = config;
