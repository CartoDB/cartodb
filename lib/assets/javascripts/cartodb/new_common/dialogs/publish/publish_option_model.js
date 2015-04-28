var cdb = require('cartodb.js');

/**
 * Represents a publish option
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    title: '',
    desc: '',
    iconName: '',
    iconCategory: '',
    copyable: ''
  }
});
