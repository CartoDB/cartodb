var Notifier = require('./components/notifier/notifier');

var NOTIFICATION_ID = 'visNotification';

var VisNotifications = {

  track: function (vis) {
    vis.on('change:error', this._toggleVisErrorNotification, this);
    this._toggleVisErrorNotification(vis);
  },

  _toggleVisErrorNotification: function (vis) {
    var error = vis.get('error');
    if (error) {
      this._showVisErrorNotification();
    } else {
      this._hideVisErrorNotification();
    }
  },

  _showVisErrorNotification: function () {
    Notifier.addNotification(this._getNotificationAttrs());
  },

  _hideVisErrorNotification: function () {
    if (Notifier.getNotification(NOTIFICATION_ID)) {
      Notifier.removeNotification(NOTIFICATION_ID);
    }
  },

  _getNotificationAttrs: function () {
    return {
      id: NOTIFICATION_ID,
      status: 'error',
      info: _t('notifications.vis.failed'),
      closable: false
    };
  }
};

module.exports = VisNotifications;
