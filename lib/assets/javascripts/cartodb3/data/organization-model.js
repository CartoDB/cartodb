var cdb = require('cartodb-deep-insights.js');
var UserModel = require('./user-model');

/**
 *  Organization info model
 *
 */
module.exports = cdb.core.Model.extend({

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/org';
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    this._configModel = opts.configModel;
    this.owner = new UserModel(
      this.get('owner'),
      {
        configModel: this._configModel
      }
    );
  }

});
