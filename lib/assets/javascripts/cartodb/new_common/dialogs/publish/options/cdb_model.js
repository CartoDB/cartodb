var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  isDisabled: function() {
    return false;
  }
});
