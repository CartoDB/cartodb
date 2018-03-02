var _ = require('underscore');
var Notifier = require('builder/components/notifier/notifier');

var NOTIFICATION_ERROR_TEMPLATE = _.template("<span class='u-errorTextColor'><%- title %></span>");
var NOTIFICATION_PREFIX = 'cartocss-notification-';

var CartoCSSNotifications = {
  track: function (view) {
    // In order to not bloat the notification center we will create
    // only one notification, and update it along the way
    this._notificationId = NOTIFICATION_PREFIX + view.cid;
  },

  showSuccessNotification: function () {
    var notificationAttrs = {
      status: 'success',
      info: _t('notifications.cartocss.success'),
      closable: true,
      delay: Notifier.DEFAULT_DELAY
    };

    this._addOrUpdateNotification(this._notificationId, notificationAttrs);
  },

  showErrorNotification: function (errors) {
    var notificationAttrs = {
      status: 'error',
      info: _t('notifications.cartocss.error.body', {
        body: NOTIFICATION_ERROR_TEMPLATE({
          title: _t('notifications.cartocss.error.title')
        }),
        error: this._transformErrors(errors)
      }),
      closable: true,
      delay: Notifier.DEFAULT_DELAY
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

module.exports = CartoCSSNotifications;
