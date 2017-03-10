var cdb = require('cartodb.js-v3');
var Backbone = require('backbone-cdb-v3');
var IconModel = require('./organization_icon_model');

module.exports = Backbone.Collection.extend({

  model: IconModel,

  url: function (method) {
    var version = cdb.config.urlVersion('organization-assets', method);
    return '/api/' + version + '/organization/' + this._orgId + '/assets';
  },

  initialize: function (attrs, opts) {
    if (!opts.orgId) {
      throw new Error('Organization ID is required');
    }
    this._orgId = opts.orgId;
  }
});
