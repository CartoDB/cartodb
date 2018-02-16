var _ = require('underscore');
var Notifier = require('builder/components/notifier/notifier');
var NotificationErrorMessageHandler = require('builder/editor/layers/notification-error-message-handler');

var DEFAULT_DELAY = Notifier.DEFAULT_DELAY;
var STATUS_READY = 'ready';
var STATUS_PENDING = 'pending';
var STATUS_RUNNING = 'running';
var STATUS_WAITING = 'waiting';
var STATUS_FAILED = 'failed';

var AnalysisNotifications = {

  track: function (analysisNode, layerDefModel) {
    analysisNode.on('change:status', this._addStatusChangedNotification, this);
    analysisNode.on('change:error', this._onErrorChanged, this);
    analysisNode.once('destroy', this._addRemovedNotification, this);
    this._layerDefModel = layerDefModel;

    if (analysisNode.get('status') && analysisNode.get('status') !== STATUS_READY) {
      this._addStatusChangedNotification(analysisNode);
    }
  },

  _addRemovedNotification: function (analysisNode) {
    if (analysisNode.get('avoidNotification') === true) {
      return;
    }

    var nodeId = analysisNode.get('id');
    var notificationAttrs = {
      status: 'success',
      info: _t('notifications.analysis.removed', {
        nodeId: nodeId.toUpperCase()
      }),
      closable: true,
      delay: DEFAULT_DELAY
    };
    this._addOrUpdateNotification(analysisNode.cid, notificationAttrs);
  },

  _addStatusChangedNotification: function (analysisNode) {
    var status = analysisNode.get('status');
    if (status === STATUS_WAITING || status === STATUS_PENDING) {
      this._addAnalysisWaitingNotification(analysisNode);
    }
    if (status === STATUS_RUNNING) {
      this._addAnalysisRunningNotification(analysisNode);
    }
    if (status === STATUS_READY) {
      this._addAnalysisReadyNotification(analysisNode);
    }
    if (status === STATUS_FAILED) {
      this._addAnalysisFailedNotification(analysisNode);
    }
  },

  _addAnalysisWaitingNotification: function (analysisNode) {
    var notificationAttrs = {
      status: 'loading',
      info: _t('notifications.analysis.waiting', {
        nodeId: analysisNode.get('id').toUpperCase()
      })
    };
    this._addOrUpdateNotification(analysisNode.cid, notificationAttrs);
  },

  _addAnalysisRunningNotification: function (analysisNode) {
    var notificationAttrs = {
      status: 'loading',
      info: _t('notifications.analysis.running', {
        nodeId: analysisNode.get('id').toUpperCase()
      })
    };
    this._addOrUpdateNotification(analysisNode.cid, notificationAttrs);
  },

  _addAnalysisReadyNotification: function (analysisNode) {
    var notificationAttrs = {
      status: 'success',
      info: _t('notifications.analysis.completed', {
        nodeId: analysisNode.get('id').toUpperCase()
      }),
      closable: true,
      delay: DEFAULT_DELAY
    };
    this._addOrUpdateNotification(analysisNode.cid, notificationAttrs);
  },

  _addAnalysisFailedNotification: function (analysisNode) {
    var message = NotificationErrorMessageHandler.extractErrorFromAnalysisNode(analysisNode, this._layerDefModel);

    var notificationAttrs = {
      status: message.type,
      info: message.message,
      closable: true,
      autoclosable: false
    };

    this._addOrUpdateNotification(analysisNode.cid, notificationAttrs);
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

  _onErrorChanged: function (analysisNode, error) {
    if (error) {
      this._addAnalysisFailedNotification(analysisNode);
    }
  }
};

module.exports = AnalysisNotifications;
