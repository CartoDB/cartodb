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
    return baseUrl + '/api/v3/notifications/' + this.get('category');
  },

  initialize: function (attrs, opts) {
    if (!opts.category) throw new Error('category is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
    this.attributes = _.extend({ notifications: attrs }, { category: opts.category });
  },

  getKey: function (key) {
    var notifications = this.get('notifications') || {};
    var category = this.get('category');
    var notificationkey = '';

    if (notifications[category]) {
      if (notifications[category][key]) {
        notificationkey = notifications[category][key];
      }
    }

    return notificationkey;
  },

  setKey: function (key, value) {
    var notifications = {};
    notifications[key] = value;

    this.set('notifications', notifications);
  }
});

module.exports = UserNotifications;
