var Notifier = require('./components/notifier/notifier');

var AnalysisNotifications = function (deps) {
  if (!deps.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');

  this._notifications = {};

  deps.analysisDefinitionNodesCollection.on('add', this._onAnalysisDefinitionNodeAdded, this);
  deps.analysisDefinitionNodesCollection.on('change:status', this._onAnalysisNodeStatusChanged, this);
  deps.analysisDefinitionNodesCollection.on('remove', this._onAnalysisDefinitionNodeRemoved, this);
};

AnalysisNotifications.prototype._onAnalysisDefinitionNodeAdded = function (analysisDefinitionNode) {
  var nodeId = analysisDefinitionNode.get('id');
  this._addNotification(analysisDefinitionNode.cid, {
    status: 'loading',
    info: _t('notifications.analysis.started', {
      nodeId: nodeId
    }),
    closable: false
  });
};

AnalysisNotifications.prototype._onAnalysisDefinitionNodeRemoved = function (analysisDefinitionNode) {
  var nodeId = analysisDefinitionNode.get('id');
  var notificationAttrs = {
    status: 'success',
    info: _t('notifications.analysis.removed', {
      nodeId: nodeId
    }),
    closable: true
  };
  this._addOrUpdateNotification(analysisDefinitionNode.cid, notificationAttrs);
};

AnalysisNotifications.prototype._onAnalysisNodeStatusChanged = function (analysisDefinitionNode, status) {
  var notificationAttrs;
  var nodeId = analysisDefinitionNode.get('id');
  if (status === 'ready') {
    notificationAttrs = {
      status: 'success',
      info: _t('notifications.analysis.completed', {
        nodeId: nodeId
      }),
      closable: true
    };
    this._addOrUpdateNotification(analysisDefinitionNode.cid, notificationAttrs);
  }
  if (status === 'failed') {
    var message = _t('notifications.analysis.failed', {
      nodeId: nodeId
    });
    if (analysisDefinitionNode.get('error')) {
      message += ': ' + analysisDefinitionNode.get('error');
    }
    notificationAttrs = {
      status: 'error',
      info: message,
      closable: true
    };
    this._addOrUpdateNotification(analysisDefinitionNode.cid, notificationAttrs);
  }
};

AnalysisNotifications.prototype._addOrUpdateNotification = function (notificationId, notificationAttrs) {
  var notification = this._getNotification(notificationId);
  if (notification) {
    notification.set(notificationAttrs);
  } else {
    this._addNotification(notificationId, notificationAttrs);
  }
};

AnalysisNotifications.prototype._addNotification = function (notificationId, notificationAttrs) {
  var notification = Notifier.addNotification(notificationAttrs);
  this._setNotification(notificationId, notification);
};

AnalysisNotifications.prototype._setNotification = function (notificationId, notification) {
  this._notifications[notificationId] = notification;
  notification.on('notification:close', function () {
    delete this._notifications[notificationId];
  }, this);
};

AnalysisNotifications.prototype._getNotification = function (notificationId) {
  return this._notifications[notificationId];
};

module.exports = AnalysisNotifications;
