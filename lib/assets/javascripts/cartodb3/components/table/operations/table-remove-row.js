var Notifier = require('../../../components/notifier/notifier');
var errorParser = require('../../../helpers/error-parser');

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
    success: function (mdl, attrs) {
      successCallback && successCallback(mdl, attrs);
      notification.set({
        status: 'success',
        info: _t('components.table.rows.destroy.success', { cartodb_id: cartodbId }),
        closable: true
      });
    },
    error: function (mdl, e) {
      errorCallback && errorCallback(mdl, e);
      notification.set({
        status: 'error',
        info: _t('components.table.rows.destroy.error', { cartodb_id: cartodbId, error: errorParser(e) }),
        closable: true
      });
    }
  });
};
