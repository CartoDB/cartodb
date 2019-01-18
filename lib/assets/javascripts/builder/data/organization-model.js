var Backbone = require('backbone');
var _ = require('underscore');

/**
 *  Organization info model
 *
 */
module.exports = Backbone.Model.extend({

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/org';
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;

    if (!_.isEmpty(this.get('owner'))) {
      this._ownerModel = new Backbone.Model(
        _.omit(this.get('owner'), 'organization')
      );
    }
  },

  getOwnerId: function () {
    return this._ownerModel && this._ownerModel.get('id');
  },

  getOwnerEmail: function () {
    return this._ownerModel && this._ownerModel.get('email');
  },

  isOrgAdmin: function (user) {
    return this.getOwnerId() === user.get('id') || !!_.find(this.get('admins'), function (u) {
      return u.id === user.get('id');
    });
  }
});
