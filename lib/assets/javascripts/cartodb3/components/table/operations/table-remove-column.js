var Notifier = require('../../../editor/components/notifier/notifier');
var errorParser = require('../../../helpers/error-parser');

module.exports = function (opts) {
  if (!opts.tableViewModel) { throw new Error('tableViewModel is required'); }
  if (!opts.columnModel) { throw new Error('columnModel is required'); }

  var tableViewModel = opts.tableViewModel;
  var columnModel = opts.columnModel;

  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;

  if (!tableViewModel.isDisabled()) {
    var notification = Notifier.addNotification({
      status: 'loading',
      info: _t('components.table.columns.destroy.loading'),
      closable: false
    });

    notification.on('notification:close', function () {
      Notifier.removeNotification(notification);
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
          info: _t('components.table.columns.destroy.success', {
            columnName: columnModel.get('name'),
            error: errorParser(e)
          }),
          closable: true
        });
      }
    });
  }
};
