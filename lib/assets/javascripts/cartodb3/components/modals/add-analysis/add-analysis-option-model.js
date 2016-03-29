var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    title: '',
    sub_title: '',
    category: '', // ['data transformation', 'relationship analysis']
    desc: '',
    selected: false,
    enabled: false,
    node_attrs: {}
  }

});
