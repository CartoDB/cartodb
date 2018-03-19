var Backbone = require('backbone');
var UserNotificationModel = require('./user-notification-model');
var OrganizationNotificationModel = require('./organization-notification-model');

/**
 *  User notification default collection, it will
 *  require the user notification model
 */

module.exports = Backbone.Collection.extend({
  model: function (attrs, options) {
    return attrs.type === 'org_notification'
      ? new OrganizationNotificationModel(attrs, options)
      : new UserNotificationModel(attrs);
  }
});
