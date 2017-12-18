var cdb = require('cartodb.js');
var Notifier = require('../../components/notifier/notifier');

var ongoingQuery = false;

module.exports = function zoomToData (configModel, stateModel, query, options) {
  if (!configModel) throw new Error('configModel is required');
  if (!stateModel) throw new Error('stateModel is required');
  if (!query) throw new Error('query is required');

  var queryLauncher = new cdb.SQL({
    user: configModel.get('user_name'),
    sql_api_template: configModel.get('sql_api_template'),
    api_key: configModel.get('api_key')
  });
  var notifications = true;
  var notification = null;

  if (options && options.notifications !== void 0) {
    notifications = options.notifications;
  }

  if (!ongoingQuery) {
    ongoingQuery = true;

    if (notifications) {
      notification = Notifier.addNotification({
        status: 'loading',
        info: _t('editor.layers.notifier.center-map.loading'),
        closable: false
      });
    }

    queryLauncher.getBounds(query)
      .done(function (bounds) {
        ongoingQuery = false;

        stateModel.setBounds(bounds);

        if (notifications) {
          notification.set({
            status: 'success',
            info: _t('editor.layers.notifier.center-map.success'),
            closable: true
          });
        }
      })
      .error(function () {
        ongoingQuery = false;

        if (notifications) {
          notification.set({
            status: 'error',
            info: _t('editor.layers.notifier.center-map.error'),
            closable: true
          });
        }
      });
  }
};
