var cdb = require('cartodb.js-v3');
var Backbone = require('backbone-cdb-v3');

/**
 *  User plans model
 *
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    title: '',
    desc: '',
    price: 0,
    tables_quota: '',
    bytes_quota: 0,
    support: '',
    private_tables: false,
    removable_brand: false,
    max_layers: 4
  }

})