const Backbone = require('backbone');
const _ = require('underscore');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const UserModel = require('dashboard/data/user-model');
const GroupModel = require('dashboard/data/group-model');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 * A collection of Grantable objects.
 */
module.exports = Backbone.Collection.extend({

  model: function (attrs, { collection }) {
    // This used to be in its own file, but we took the same approach as builder

    // This used to have:
    // new cdb.admin[className](this.get('model'));
    // We took grantable_presenter types as the truth.

    const { _configModel: configModel, organization } = collection;

    let model;
    if (attrs.type === 'user') {
      model = new UserModel(attrs, { configModel, collection });
    } else {
      model = new GroupModel(attrs, { configModel, collection });
    }
    model.organization = organization;
    model.entity = model; // legacy (see grantable.js), left in case someone uses it
    return model;
  },

  url: function (method) {
    var version = this._configModel.urlVersion('organizationGrantables', method);
    return '/api/' + version + '/organization/' + this.organization.id + '/grantables';
  },

  initialize: function (users, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    if (!opts.organization) throw new Error('organization is required');
    this.organization = opts.organization;
    this.currentUserId = opts.currentUserId;
    this.sync = require('dashboard/data/backbone/sync-abort'); // adds abort behaviour
  },

  parse: function (response) {
    this.total_entries = response.total_entries;

    return _.reduce(response.grantables, function (memo, m) {
      if (m.id === this.currentUserId) {
        this.total_entries--;
      } else {
        memo.push(m);
      }

      return memo;
    }, [], this);
  },

  // @return {Number, undefined} may be undefined until a first fetch is done
  totalCount: function () {
    return this.total_entries;
  }

});
