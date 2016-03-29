var cdb = require('cartodb-deep-insights.js');

/**
 *  User model
 *
 */

module.exports = cdb.core.Model.extend({

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/users';
  },

  defaults: {
    avatar_url: 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png',
    username: '',
    email: ''
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    this._configModel = opts.configModel;
  },

  canCreateDatasets: function () {
    if (!this.get('remaining_byte_quota') || this.get('remaining_byte_quota') <= 0) {
      return false;
    }
    return true;
  },

  canCreatePrivateDatasets: function () {
    var actions = this.get('actions');
    return actions && actions.private_tables;
  }

});
