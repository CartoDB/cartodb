var _ = require('underscore');
var Notifier = require('./components/notifier/notifier');

var DEFAULT_DELAY = 10000;
var STATUS_READY = 'ready';
var STATUS_PENDING = 'pending';
var STATUS_WAITING = 'waiting';
var STATUS_FAILED = 'failed';

var AnalysisNotifications = {

  track: function (analysisNode) {
    analysisNode.on('change:status', this._addStatusChangedNotification, this);
    analysisNode.once('destroy', this._addRemovedNotification, this);

    if (analysisNode.get('status') && analysisNode.get('status') !== STATUS_READY) {
      this._addStatusChangedNotification(analysisNode);
    }
  },

  _addRemovedNotification: function (analysisNode) {
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
    if (status === STATUS_WAITING) {
      this._addAnalysisWaitingNotification(analysisNode);
    }
    if (status === STATUS_PENDING) {
      this._addAnalysisPendingNotification(analysisNode);
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

  _addAnalysisPendingNotification: function (analysisNode) {
    var notificationAttrs = {
      status: 'loading',
      info: _t('notifications.analysis.pending', {
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
    var message = _t('notifications.analysis.failed', {
      nodeId: analysisNode.get('id').toUpperCase()
    });
    var error = analysisNode.get('error');
    if (error && error.message) {
      message += ': ' + error.message;
    }
    var notificationAttrs = {
      status: 'error',
      info: message,
      closable: true,
      delay: DEFAULT_DELAY
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
  }
};

module.exports = AnalysisNotifications;
