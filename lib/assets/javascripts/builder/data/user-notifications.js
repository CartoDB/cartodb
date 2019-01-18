var _ = require('underscore');
var Backbone = require('backbone');

/**
 *  User Notifications
 *
 */

var UserNotifications = Backbone.Model.extend({
  sync: function (method, model, options) {
    return Backbone.sync('update', model, options);
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v3/notifications/' + this.get('key');
  },

  initialize: function (attrs, opts) {
    if (!opts.key) throw new Error('key is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
    this.attributes = _.extend({ notifications: attrs }, { key: opts.key });
  },

  getKey: function (key) {
    var notifications = this.get('notifications') || {};
    return notifications[key];
  },

  setKey: function (key, value) {
    var notifications = this.get('notifications') || {};
    notifications[key] = value;
    this.set('notifications', notifications);
  }
});

module.exports = UserNotifications;
