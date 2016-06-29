var Notifier = require('../../../components/notifier/notifier');
var errorParser = require('../../../helpers/error-parser');

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
    success: function (mdl, attrs) {
      successCallback && successCallback(mdl, attrs);
      notification.set({
        status: 'success',
        info: _t('components.table.columns.create.success', { columnName: attrs.name }),
        closable: true
      });
    },
    error: function (mdl, e) {
      errorCallback && errorCallback(mdl, e);
      notification.set({
        status: 'error',
        info: _t('components.table.columns.create.error', { error: errorParser(e) }),
        closable: true
      });
    }
  });
};
