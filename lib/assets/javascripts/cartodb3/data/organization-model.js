var Backbone = require('backbone');
var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');

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

    if (!_.isEmpty(this.get('owner'))) {
      this._ownerModel = new cdb.core.Model(
        _.omit(this.get('owner'), 'organization')
      );
    }
    this._usersCollection = new Backbone.Collection();
  },

  getOwnerId: function () {
    return this._ownerModel && this._ownerModel.get('id');
  },

  getOwnerEmail: function () {
    return this._ownerModel && this._ownerModel.get('email');
  }
});
