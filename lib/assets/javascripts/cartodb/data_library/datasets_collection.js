var cdb = require('cartodb.js');

module.exports = cdb.admin.Visualizations.extend({

  _ITEMS_PER_PAGE: 12,

  model: cdb.core.Model,

  url: function() {
    var u = 'https://common-data.cartodb.com/api/v1/viz';
    u += "?" + this._createUrlOptions();
    return u;
  }

});
