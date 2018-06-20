const UserNotificationModel = require('./user-notification-model');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userId',
  'configModel',
  'apiKey'
];

/**
 *  User notification default model
 */

module.exports = UserNotificationModel.extend({
  url: function () {
    return `/api/v3/users/${this._userId}/notifications/${this.id}?api_key=${this._apiKey}`;
  },

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  markAsRead: function () {
    this.save({
      notification: {
        read_at: new Date()
      }
    });
  }
});
