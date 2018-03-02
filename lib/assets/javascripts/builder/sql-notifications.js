var _ = require('underscore');
var Notifier = require('builder/components/notifier/notifier');

var NOTIFICATION_ERROR_TEMPLATE = _.template("<span class='CDB-Text u-errorTextColor'><%- title %></span>");
var NOTIFICATION_PREFIX = 'sql-notifications';

var SQLNotifications = {
  track: function (view) {
    // In order to not bloat the notification center we will create
    // only one notification, and update it along the way
    this._notificationId = NOTIFICATION_PREFIX;
  },

  removeNotification: function () {
    Notifier.removeNotification(this._notificationId);
  },

  showNotification: function (attrs) {
    this._addOrUpdateNotification(this._notificationId, attrs);
  },

  showErrorNotification: function (errors) {
    var notificationAttrs = {
      status: 'error',
      info: _t('notifications.sql.error.body', {
        body: NOTIFICATION_ERROR_TEMPLATE({
          title: _t('notifications.sql.error.title')
        }),
        error: this._transformErrors(errors)
      }),
      closable: false
    };

    this._addOrUpdateNotification(this._notificationId, notificationAttrs);
  },

  _transformErrors: function (errors) {
    return _.map(errors, function (err) {
      return err.message;
    }, this).join('. ');
  },

  _addOrUpdateNotification: function (notificationId, notificationAttrs) {
    var notification = this._getNotification(notificationId);
    if (notification) {
      notification.set(notificationAttrs);
    } else {
      this._addNotification(notificationId, notificationAttrs);
    }
  },

  _addNotification: function (notificationId, notificationAttrs) {
    notificationAttrs = _.extend({
      id: notificationId
    }, notificationAttrs);
    Notifier.addNotification(notificationAttrs);
  },

  _getNotification: function (notificationId) {
    return Notifier.getNotification(notificationId);
  }
};

module.exports = SQLNotifications;
