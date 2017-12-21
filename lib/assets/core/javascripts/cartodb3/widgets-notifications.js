var _ = require('underscore');
var Notifier = require('./components/notifier/notifier');
var errorParser = require('./helpers/error-parser');

var NOTIFICATION_ERROR_TEMPLATE = _.template("<span class='u-errorTextColor'><%- title %></span>");

var WidgetsNotifications = {

  track: function (widgetsCollection) {
    this._widgetDefinitionsCollection = widgetsCollection;
    this._widgetDefinitionsCollection.on('successAdd', this._showAddNotification, this);
    this._widgetDefinitionsCollection.on('successReplace', this._showReplaceNotification, this);
    this._widgetDefinitionsCollection.on('destroy', this._showRemoveNotification, this);
    this._widgetDefinitionsCollection.on('error', this._showErrorNotification, this);
    this._widgetDefinitionsCollection.on('loading', this._showLoadingNotification, this);
    this._widgetDefinitionsCollection.on('updating', this._showUpdatingNotification, this);
  },

  _showLoadingNotification: function (widgetOptionModel) {
    var notificationId = widgetOptionModel.cid;
    var notificationAttrs = {
      status: 'loading',
      info: _t('notifications.widgets.loading'),
      closable: false
    };

    this._addNotification(notificationId, notificationAttrs);
  },

  _showUpdatingNotification: function (widgetOptionModel) {
    var notificationId = widgetOptionModel.cid;
    var notificationAttrs = {
      status: 'loading',
      info: _t('notifications.widgets.updating'),
      closable: false
    };

    this._addNotification(notificationId, notificationAttrs);
  },

  _showRemoveNotification: function (widgetModel) {
    if (widgetModel.get('avoidNotification') === true) {
      return;
    }

    var notificationAttrs = {
      status: 'success',
      info: _t('notifications.widgets.delete'),
      closable: true,
      delay: Notifier.DEFAULT_DELAY
    };
    this._addNotification(widgetModel.cid, notificationAttrs);
  },

  _showAddNotification: function (widgetOptionModel) {
    var notificationId = widgetOptionModel.cid;
    var notificationAttrs = {
      status: 'success',
      info: _t('notifications.widgets.add'),
      closable: true
    };
    this._addOrUpdateNotification(notificationId, notificationAttrs);
  },

  _showReplaceNotification: function (widgetOptionModel) {
    var notificationId = widgetOptionModel.cid;
    var notificationAttrs = {
      status: 'success',
      info: _t('notifications.widgets.replace'),
      closable: true
    };
    this._addOrUpdateNotification(notificationId, notificationAttrs);
  },

  _showErrorNotification: function (widgetOptionModel, error) {
    if (this._isAbortion(error)) {
      return;
    }

    var notificationId = widgetOptionModel.cid;
    var notificationAttrs = {
      status: 'error',
      info: _t('notifications.widgets.error.body', {
        body: NOTIFICATION_ERROR_TEMPLATE({
          title: _t('notifications.widgets.error.title')
        }),
        error: errorParser(error)
      }),
      closable: true
    };
    this._addOrUpdateNotification(notificationId, notificationAttrs);
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
  },

  _isAbortion: function (error) {
    return (error.status === 0 && error.statusText === 'abort');
  }
};

module.exports = WidgetsNotifications;
