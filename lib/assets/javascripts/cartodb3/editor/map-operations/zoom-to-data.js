var cdb = require('cartodb.js');
var Notifier = require('../../components/notifier/notifier');

var ongoingQuery = false;

module.exports = function zoomToData (configModel, stateModel, query) {
  if (!configModel) throw new Error('configModel is required');
  if (!stateModel) throw new Error('stateModel is required');
  if (!query) throw new Error('query is required');

  var queryLauncher = new cdb.SQL({
    user: configModel.get('user_name'),
    sql_api_template: configModel.get('sql_api_template'),
    api_key: configModel.get('api_key')
  });
  var notification = null;

  if (!ongoingQuery) {
    ongoingQuery = true;

    notification = Notifier.addNotification({
      status: 'loading',
      info: _t('- SOME TEXT -'),
      closable: false
    });

    queryLauncher.getBounds(query)
      .done(function (bounds) {
        ongoingQuery = false;
        stateModel.setBounds(bounds);
        notification.set({
          status: 'success',
          info: _t('- SOME TEXT -'),
          closable: true
        });
      })
      .error(function () {
        ongoingQuery = false;
        notification.set({
          status: 'error',
          info: _t('- SOME TEXT -'),
          closable: true
        });
      });
  }
};
