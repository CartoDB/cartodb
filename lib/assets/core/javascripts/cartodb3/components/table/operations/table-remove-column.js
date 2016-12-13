var Notifier = require('../../../components/notifier/notifier');
var errorParser = require('../../../helpers/error-parser');

module.exports = function (opts) {
  if (!opts.columnModel) { throw new Error('columnModel is required'); }

  var columnModel = opts.columnModel;
  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;
  var notification = Notifier.addNotification({
    status: 'loading',
    info: _t('components.table.columns.destroy.loading', { columnName: columnModel.get('name') }),
    closable: false
  });

  columnModel.destroy({
    wait: true,
    success: function (mdl, attrs) {
      successCallback && successCallback(mdl, attrs);
      notification.set({
        status: 'success',
        info: _t('components.table.columns.destroy.success', { columnName: columnModel.get('name') }),
        closable: true
      });
    },
    error: function (mdl, e) {
      errorCallback && errorCallback(mdl, e);
      notification.set({
        status: 'error',
        info: _t('components.table.columns.destroy.error', {
          columnName: columnModel.get('name'),
          error: errorParser(e)
        }),
        closable: true
      });
    }
  });
};
