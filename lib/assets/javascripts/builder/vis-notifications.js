var _ = require('underscore');
var Notifier = require('builder/components/notifier/notifier');

var NOTIFICATION_ID = 'visNotification';
var NOTIFICATION_TEMPLATE = _.template("<span class='CDB-Text is-semibold u-errorTextColor'><%= title %></span>&nbsp;<%= body %>");
var ERROR_NOTIFICATION_TEMPLATE = _.template('<%- message %> <%- body %>');

var VisNotifications = {

  track: function (vis) {
    vis.on('change:error', this._toggleVisErrorNotification, this);
    this._toggleVisErrorNotification(vis);
  },

  _toggleVisErrorNotification: function (vis) {
    var error = vis.get('error');
    if (error) {
      this._showVisErrorNotification(error.message);
    } else {
      this._hideVisErrorNotification();
    }
  },

  _showVisErrorNotification: function (message) {
    Notifier.addNotification(this._getNotificationAttrs(message));
  },

  _hideVisErrorNotification: function () {
    if (Notifier.getNotification(NOTIFICATION_ID)) {
      Notifier.removeNotification(NOTIFICATION_ID);
    }
  },

  _getNotificationAttrs: function (message) {
    var body = _t('notifications.vis.failed.body');
    if (message) {
      body = ERROR_NOTIFICATION_TEMPLATE({
        message: this._period(message),
        body: body
      });
    }

    return {
      id: NOTIFICATION_ID,
      status: 'error',
      info: NOTIFICATION_TEMPLATE({
        title: _t('notifications.vis.failed.title'),
        body: body
      }),
      closable: false
    };
  },

  _period: function (text) {
    if (text && !/\.$/.test(text)) {
      return text + '.';
    }
    return text;
  }
};

module.exports = VisNotifications;
