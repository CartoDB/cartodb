var cdb = require('cartodb-deep-insights.js');
var OrganizationModel = require('./organization-model');

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

    if (this.get('organization')) {
      this.organization = new OrganizationModel(
        this.get('organization'),
        {
          configModel: this._configModel,
          currentUserId: this.id
        }
      );
    }
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
  },

  isInsideOrg: function () {
    if (this.organization) {
      return this.organization.id !== false || this.isOrgAdmin();
    }
    return false;
  },

  isOrgAdmin: function () {
    if (this.organization) {
      return this.organization.owner.get('id') === this.get('id');
    }
    return false;
  }

});
