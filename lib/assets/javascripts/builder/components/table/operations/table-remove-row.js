var Notifier = require('builder/components/notifier/notifier');
var errorParser = require('builder/helpers/error-parser');

module.exports = function (opts) {
  if (!opts.rowModel) { throw new Error('rowModel is required'); }

  var rowModel = opts.rowModel;
  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;
  var cartodbId = rowModel.get('cartodb_id');
  var notification = Notifier.addNotification({
    status: 'loading',
    info: _t('components.table.rows.destroy.loading', { cartodb_id: cartodbId }),
    closable: false
  });

  rowModel.destroy({
    wait: true,
    success: function (model, attrs) {
      successCallback && successCallback(model, attrs);
      notification.set({
        status: 'success',
        info: _t('components.table.rows.destroy.success', { cartodb_id: cartodbId }),
        closable: true
      });
    },
    error: function (model, err) {
      errorCallback && errorCallback(model, err);
      notification.set({
        status: 'error',
        info: _t('components.table.rows.destroy.error', { cartodb_id: cartodbId, error: errorParser(err) }),
        closable: true
      });
    }
  });
};
