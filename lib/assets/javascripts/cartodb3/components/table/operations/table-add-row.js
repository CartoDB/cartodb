var Notifier = require('../../../editor/components/notifier/notifier');
var errorParser = require('../../../helpers/error-parser');

module.exports = function (opts) {
  if (!opts.tableViewModel) { throw new Error('tableViewModel is required'); }
  if (!opts.rowsCollection) { throw new Error('rowsCollection is required'); }

  var tableViewModel = opts.tableViewModel;
  var rowsCollection = opts.rowsCollection;

  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;

  if (!tableViewModel.isDisabled()) {
    var notification = Notifier.addNotification({
      status: 'loading',
      info: _t('components.table.rows.create.loading'),
      closable: false
    });

    notification.on('notification:close', function () {
      Notifier.removeNotification(notification);
    });

    rowsCollection.addRow({
      success: function (mdl, attrs) {
        successCallback && successCallback(mdl, attrs);
        notification.set({
          status: 'success',
          info: _t('components.table.rows.create.success', { column_name: attrs.name }),
          closable: true
        });
      },
      error: function (mdl, e) {
        errorCallback && errorCallback(mdl, e);
        notification.set({
          status: 'error',
          info: _t('components.table.rows.create.error', { error: errorParser(e) }),
          closable: true
        });
      }
    });
  }
};
