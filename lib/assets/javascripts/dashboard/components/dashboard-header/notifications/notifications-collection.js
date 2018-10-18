const Backbone = require('backbone');
const UserNotificationModel = require('./user-notification-model');
const OrganizationNotificationModel = require('./organization-notification-model');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 *  User notification default collection, it will
 *  require the user notification model
 */

module.exports = Backbone.Collection.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  model: function (attrs, options) {
    return attrs.type === 'org_notification'
      ? new OrganizationNotificationModel(attrs, {
        ...options,
        configModel: options.collection._configModel
      })
      : new UserNotificationModel(attrs);
  }
});
