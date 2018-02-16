var Notifier = require('builder/components/notifier/notifier');
var errorParser = require('builder/helpers/error-parser');

module.exports = function (opts) {
  if (!opts.visModel) { throw new Error('visModel is required'); }

  var visModel = opts.visModel;
  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;

  visModel.destroy({
    wait: true,
    success: function (mdl, attrs) {
      successCallback && successCallback(mdl, attrs);
    },
    error: function (mdl, e) {
      errorCallback && errorCallback(mdl, e);
      Notifier.addNotification({
        status: 'error',
        info: _t('dataset.delete.error', {
          tableName: visModel.get('name'),
          error: errorParser(e)
        }),
        closable: true
      });
    }
  });
};
