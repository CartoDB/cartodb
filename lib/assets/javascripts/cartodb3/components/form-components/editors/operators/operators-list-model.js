var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    visible: false,
    operator: 'count',
    attribute: ''
  },

  isValid: function () {
    if (this.get('operator') !== 'count' && !this.get('attribute')) {
      return false;
    }
    return true;
  }

});
