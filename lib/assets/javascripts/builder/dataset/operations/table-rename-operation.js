var Notifier = require('builder/components/notifier/notifier');
var errorParser = require('builder/helpers/error-parser');

module.exports = function (opts) {
  if (!opts.visModel) { throw new Error('visModel is required'); }
  if (!opts.newName) { throw new Error('newName is required'); }

  var visModel = opts.visModel;
  var newName = opts.newName;
  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;
  var notification = Notifier.addNotification({
    status: 'loading',
    info: _t('dataset.rename.loading', { tableName: visModel.get('name') }),
    closable: false
  });

  visModel.save({ name: newName }, {
    wait: true,
    success: function (mdl, attrs) {
      successCallback && successCallback(mdl, attrs);
      notification.set({
        status: 'success',
        info: _t('dataset.rename.success', { tableName: visModel.get('name') }),
        closable: true
      });
    },
    error: function (mdl, e) {
      errorCallback && errorCallback(mdl, e);
      notification.set({
        status: 'error',
        info: _t('dataset.rename.error', {
          tableName: visModel.get('name'),
          error: errorParser(e)
        }),
        closable: true
      });
    }
  });
};
