var _ = require('underscore');
var Notifier = require('builder/components/notifier/notifier');
var errorParser = require('builder/helpers/error-parser');

var NOTIFICATION_ERROR_TEMPLATE = _.template("<span class='u-errorTextColor'><%- title %></span>");
var ADD_NOTIFICATION_ID = 'add-notification';
var NOTIFICATION_STATUS = {
  loading: 'loading',
  updating: 'loading',
  added: 'success',
  removed: 'success',
  replaced: 'success',
  error: 'error'
};

var WidgetsNotifications = {

  track: function (widgetsCollection) {
    this._widgetDefinitionsCollection = widgetsCollection;
    this._widgetDefinitionsCollection.on('successAdd', this._showAddNotification, this);
    this._widgetDefinitionsCollection.on('successReplace', this._showReplaceNotification, this);
    this._widgetDefinitionsCollection.on('destroy', this._showRemoveNotification, this);
    this._widgetDefinitionsCollection.on('errorAdd', this._showErrorNotification, this);
    this._widgetDefinitionsCollection.on('loading', this._showLoadingNotification, this);
    this._widgetDefinitionsCollection.on('updating', this._showUpdatingNotification, this);
  },

  _showLoadingNotification: function (widgets) {
    var notificationAttrs = {
      status: NOTIFICATION_STATUS.loading,
      info: _t('notifications.widgets.loading_pluralize', {
        smart_count: widgets && widgets.length ? widgets.length : 1
      }),
      closable: false
    };

    this._addNotification(ADD_NOTIFICATION_ID, notificationAttrs);
  },

  _showUpdatingNotification: function (widgets) {
    var notificationAttrs = {
      status: NOTIFICATION_STATUS.updating,
      info: _t('notifications.widgets.updating_pluralize', {
        smart_count: widgets && widgets.length ? widgets.length : 1
      }),
      closable: false
    };

    this._addNotification(ADD_NOTIFICATION_ID, notificationAttrs);
  },

  _showRemoveNotification: function (widgetModel) {
    if (widgetModel.get('avoidNotification') === true) {
      return;
    }

    var notificationAttrs = {
      status: NOTIFICATION_STATUS.removed,
      info: _t('notifications.widgets.delete_pluralize', {
        smart_count: 1
      }),
      closable: true,
      delay: Notifier.DEFAULT_DELAY
    };

    this._addNotification(ADD_NOTIFICATION_ID, notificationAttrs);
  },

  _showAddNotification: function (widgets) {
    var notificationAttrs = {
      status: NOTIFICATION_STATUS.added,
      info: _t('notifications.widgets.add_pluralize', {
        smart_count: widgets && widgets.length ? widgets.length : 1
      }),
      closable: true
    };

    this._addOrUpdateNotification(ADD_NOTIFICATION_ID, notificationAttrs);
  },

  _showReplaceNotification: function (widgets) {
    var notificationAttrs = {
      status: NOTIFICATION_STATUS.replaced,
      info: _t('notifications.widgets.replace_pluralize', {
        smart_count: widgets && widgets.length ? widgets.length : 1
      }),
      closable: true
    };

    this._addOrUpdateNotification(ADD_NOTIFICATION_ID, notificationAttrs);
  },

  _showErrorNotification: function (data, error) {
    if (this._isAbortion(error)) {
      return;
    }

    var notificationAttrs = {
      status: NOTIFICATION_STATUS.error,
      info: _t('notifications.widgets.error.body', {
        body: NOTIFICATION_ERROR_TEMPLATE({
          title: _t('notifications.widgets.error.title')
        }),
        error: errorParser(error)
      }),
      closable: true
    };

    this._addOrUpdateNotification(ADD_NOTIFICATION_ID, notificationAttrs);
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
