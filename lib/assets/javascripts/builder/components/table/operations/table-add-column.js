var Notifier = require('builder/components/notifier/notifier');
var errorParser = require('builder/helpers/error-parser');

module.exports = function (opts) {
  if (!opts.columnsCollection) throw new Error('columnsCollection is required');

  var columnsCollection = opts.columnsCollection;
  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;
  var notification = Notifier.addNotification({
    status: 'loading',
    info: _t('components.table.columns.create.loading'),
    closable: false
  });

  columnsCollection.addColumn({
    success: function (model, attrs) {
      successCallback && successCallback(model, attrs);
      notification.set({
        status: 'success',
        info: _t('components.table.columns.create.success', { columnName: attrs.name }),
        closable: true
      });
    },
    error: function (model, err) {
      errorCallback && errorCallback(model, err);
      notification.set({
        status: 'error',
        info: _t('components.table.columns.create.error', { error: errorParser(err) }),
        closable: true
      });
    }
  });
};
