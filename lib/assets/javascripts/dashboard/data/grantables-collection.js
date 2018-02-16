const Backbone = require('backbone');
const _ = require('underscore');
const GrantableModel = require('dashboard/data/grantable-model');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 * A collection of Grantable objects.
 */
module.exports = Backbone.Collection.extend({

  model: function (attrs, opts) {
    const options = Object.assign(opts, { userModel: opts.collection._userModel });

    return new GrantableModel(attrs, options);
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
    this.sync = Backbone.syncAbort; // adds abort behaviour
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
