const _ = require('underscore');
const Backbone = require('backbone');
const OrganizationUsersCollection = require('dashboard/data/organization-users-collection');
const GrantablesCollection = require('dashboard/data/grantables-collection');
const OrganizationGroupsCollection = require('dashboard/data/organization-groups-collection');
const OrganizationUrl = require('dashboard/data/organization-url-model');
const UserModel = require('dashboard/data/user-model');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 * this model contains information about the organization for
 * the current user and the users who are inside the organizacion.
 *
 * Attributes:
 * - users: collection with user instances within the organization (see cdb.admin.Organization.Users
 */
module.exports = Backbone.Model.extend({

  url: '/api/v1/org/',

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    attrs = attrs || {};

    this.owner = new UserModel(this.get('owner'));

    // ESlint errors on the below line ported as they were (== instead of ===)
    this.display_email = (typeof attrs.admin_email !== 'undefined') && attrs.admin_email != null && (attrs.admin_email == '' ? this.owner.email : attrs.admin_email); // eslint-disable-line

    var collectionOpts = {
      organization: this,
      currentUserId: opts && opts.currentUserId,
      configModel: this._configModel
    };
    this.users = new OrganizationUsersCollection(attrs.users, collectionOpts);
    this.groups = new OrganizationGroupsCollection(attrs.groups, collectionOpts);
    this.grantables = new GrantablesCollection(undefined, collectionOpts);

    // make sure all the users/groups have a reference to this organization
    this.users.each(this._setOrganizationOnModel, this);
    this.groups.each(this._setOrganizationOnModel, this);
  },

  _setOrganizationOnModel: function (m) {
    m.organization = this;
  },

  fetch: function () {
    throw new Error('organization should not be fetch, should be static');
  },

  containsUser: function (user) {
    return !!this.users.find(function (u) {
      return u.id === user.id;
    });
  },

  isOrgAdmin: function (user) {
    return this.owner.id === user.id || !!_.find(this.get('admins'), function (u) {
      return u.id === user.id;
    });
  },

  viewUrl: function () {
    return new OrganizationUrl({
      base_url: this.get('base_url')
    });
  },

  getModelType: () => 'org'

});
