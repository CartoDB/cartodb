var _ = require('underscore');
var Notifier = require('./components/notifier/notifier');

var NOTIFICATION_ID = 'visNotification';
var NOTIFICATION_TEMPLATE = _.template("<span class='CDB-Text is-semibold u-errorTextColor'><%= title %></span>&nbsp;<%= body %>");

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
      info: NOTIFICATION_TEMPLATE({
        title: _t('notifications.vis.failed.title'),
        body: _t('notifications.vis.failed.body')
      }),
      closable: false
    };
  }
};

module.exports = VisNotifications;
