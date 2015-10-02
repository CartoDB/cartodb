var cdb = require('cartodb.js');

module.exports = cdb.admin.Visualizations.extend({

  _PER_PAGE: 12,

  model: cdb.core.Model,

  url: function() {
    var u = '//' + cdb.config.get('data_library_user') + '.' + cdb.config.get('account_host') + '/api/v1/viz';
    u += "?" + this._createUrlOptions();
    return u;
  }

});
