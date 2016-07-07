var Notifier = require('./components/notifier/notifier');

var DEFAULT_DELAY = 10000;

var AnalysisNotifications = {

  _notifications: {},

  track: function (analysisNode) {
    analysisNode.on('change:status', this._addStatusChangedNotification, this);
    analysisNode.once('destroy', this._addRemovedNotification, this);
  },

  _addRemovedNotification: function (analysisNode) {
    var nodeId = analysisNode.get('id');
    var notificationAttrs = {
      status: 'success',
      info: _t('notifications.analysis.removed', {
        nodeId: nodeId
      }),
      closable: true,
      delay: DEFAULT_DELAY
    };
    this._addOrUpdateNotification(analysisNode.cid, notificationAttrs);
  },

  _addStatusChangedNotification: function (analysisNode, status) {
    if (status === 'waiting') {
      this._addAnalysisWaitingNotification(analysisNode);
    }
    if (status === 'pending') {
      this._addAnalysisPendingNotification(analysisNode);
    }
    if (status === 'ready') {
      this._addAnalysisReadyNotification(analysisNode);
    }
    if (status === 'failed') {
      this._addAnalysisFailedNotification(analysisNode);
    }
  },

  _addAnalysisWaitingNotification: function (analysisNode) {
    var notificationAttrs = {
      status: 'loading',
      info: _t('notifications.analysis.waiting', {
        nodeId: analysisNode.get('id')
      })
    };
    this._addOrUpdateNotification(analysisNode.cid, notificationAttrs);
  },

  _addAnalysisPendingNotification: function (analysisNode) {
    var notificationAttrs = {
      status: 'loading',
      info: _t('notifications.analysis.pending', {
        nodeId: analysisNode.get('id')
      })
    };
    this._addOrUpdateNotification(analysisNode.cid, notificationAttrs);
  },

  _addAnalysisReadyNotification: function (analysisNode) {
    var notificationAttrs = {
      status: 'success',
      info: _t('notifications.analysis.completed', {
        nodeId: analysisNode.get('id')
      }),
      closable: true,
      delay: DEFAULT_DELAY
    };
    this._addOrUpdateNotification(analysisNode.cid, notificationAttrs);
  },

  _addAnalysisFailedNotification: function (analysisNode) {
    var message = _t('notifications.analysis.failed', {
      nodeId: analysisNode.get('id')
    });
    if (analysisNode.get('error')) {
      message += ': ' + analysisNode.get('error');
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
    notificationAttrs.id = notificationId;
    Notifier.addNotification(notificationAttrs);
  },

  _getNotification: function (notificationId) {
    return Notifier.getNotification(notificationId);
  }
};

module.exports = AnalysisNotifications;
