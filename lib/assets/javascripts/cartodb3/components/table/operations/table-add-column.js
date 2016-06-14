var Notifier = require('../../../editor/components/notifier/notifier');
var errorParser = require('../../../helpers/error-parser');

module.exports = function (opts) {
  if (!opts.tableViewModel) { throw new Error('tableViewModel is required'); }
  if (!opts.columnsCollection) { throw new Error('columnsCollection is required'); }

  var tableViewModel = opts.tableViewModel;
  var columnsCollection = opts.columnsCollection;

  if (!tableViewModel.isDisabled()) {
    var notification = Notifier.addNotification({
      status: 'loading',
      info: _t('components.table.columns.create.loading'),
      closable: false
    });

    notification.on('notification:close', function () {
      Notifier.removeNotification(notification);
    });

    columnsCollection.addColumn({
      success: function (mdl, attrs) {
        notification.set({
          status: 'success',
          info: _t('components.table.columns.create.success', { column_name: attrs.name }),
          closable: true
        });
      },
      error: function (mdl, e) {
        notification.set({
          status: 'error',
          info: _t('components.table.columns.create.success', { error: errorParser(e) }),
          closable: true
        });
      }
    });
  }
};
