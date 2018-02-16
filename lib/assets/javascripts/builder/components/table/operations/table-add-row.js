var Notifier = require('builder/components/notifier/notifier');
var errorParser = require('builder/helpers/error-parser');

module.exports = function (opts) {
  if (!opts.rowsCollection) { throw new Error('rowsCollection is required'); }

  var rowsCollection = opts.rowsCollection;
  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;
  var notification = Notifier.addNotification({
    status: 'loading',
    info: _t('components.table.rows.create.loading'),
    closable: false
  });

  rowsCollection.addRow({
    success: function (model, attrs) {
      successCallback && successCallback(model, attrs);
      notification.set({
        status: 'success',
        info: _t('components.table.rows.create.success'),
        closable: true
      });
    },
    error: function (model, err) {
      errorCallback && errorCallback(model, err);
      notification.set({
        status: 'error',
        info: _t('components.table.rows.create.error', { error: errorParser(err) }),
        closable: true
      });
    }
  });
};
