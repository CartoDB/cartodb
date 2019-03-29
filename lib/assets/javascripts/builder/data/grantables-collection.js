var Backbone = require('backbone');
var _ = require('underscore');
var syncAbort = require('./backbone/sync-abort');
var UserModel = require('./user-model');
var GroupModel = require('./group-model');

/**
 * A collection of Grantable objects.
 */
module.exports = Backbone.Collection.extend({

  model: function (attrs, options) {
    var type = attrs.type;
    var configModel = attrs.configModel;
    options = _.extend(options, {
      configModel: configModel
    });

    if (attrs.model) {
      attrs = _.extend({}, attrs, attrs.model);
    }

    if (type === 'user') {
      return new UserModel(_.omit(attrs, 'configModel'), options);
    } else if (type === 'group') {
      return new GroupModel(_.omit(attrs, 'configModel'), options);
    }
  },

  sync: syncAbort,

  url: function (method) {
    var baseUrl = this.configModel.get('base_url');
    var version = this.configModel.urlVersion('organizationGrantables', method);
    return baseUrl + '/api/' + version + '/organization/' + this.organization.id + '/grantables';
  },

  initialize: function (users, opts) {
    if (!opts.organization) throw new Error('Organization is required');
    if (!opts.currentUserId) throw new Error('currentUserId is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this.configModel = opts.configModel;
    this.organization = opts.organization;
    this.currentUserId = opts.currentUserId;
  },

  parse: function (response) {
    this.trigger('fetched', this);
    this.total_entries = response.total_entries;

    return _.reduce(response.grantables, function (memo, m) {
      if (m.id === this.currentUserId) {
        this.total_entries--;
      } else {
        m.organization = this.organization;
        m.configModel = this.configModel;
        memo.push(m);
      }
      return memo;
    }, [], this);
  },

  fetch: function (opts) {
    opts = opts || {};
    this.trigger('fetching', this);
    opts.error = function (model, response) {
      this.trigger('error', this);
    }.bind(this);

    return Backbone.Collection.prototype.fetch.call(this, opts);
  },

  totalCount: function () {
    return this.total_entries;
  }

});
