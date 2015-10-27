var Config = require('./core/config');

var cdb = require('cdb-proxy').get();
cdb.config = require('config-proxy').set(new Config()).get();
cdb.config.set({
  cartodb_attributions: "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>",
  cartodb_logo_link: "http://www.cartodb.com"
});

module.exports = cdb.config;
