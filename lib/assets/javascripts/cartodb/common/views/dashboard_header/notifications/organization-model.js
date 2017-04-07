var UserNotificationModel = require('./model');

/**
 *  User notification default model
 */

module.exports = UserNotificationModel.extend({
  url: function (method) {
    return '/api/v3/users/' + this._userId + '/notifications/' + this.id + '?api_key=' + this._apiKey;
  },

  initialize: function (attrs, opts) {
    if (!opts.userId) {
      throw new Error('user Id is required');
    }

    if (!opts.apiKey) {
      throw new Error('apiKey is required');
    }

    this._userId = opts.userId;
    this._apiKey = opts.apiKey;
  },

  markAsRead: function () {
    this.save({
      notification: {
        read_at: new Date()
      }
    });
  }
});
