var Notifier = require('../../../components/notifier/notifier');
var errorParser = require('../../../helpers/error-parser');

module.exports = function (opts) {
  if (!opts.columnModel) { throw new Error('columnModel is required'); }
  if (!opts.newName) { throw new Error('newName is required'); }

  var columnModel = opts.columnModel;
  var oldName = columnModel.get('name');
  var newName = opts.newName;

  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;

  var notification = Notifier.addNotification({
    status: 'loading',
    info: _t('components.table.columns.rename.loading', { oldName: oldName, newName: newName }),
    closable: false
  });

  columnModel.save({
    new_name: newName,
    old_name: columnModel.get('name')
  }, {
    wait: true,
    success: function (mdl, attrs) {
      successCallback && successCallback(mdl, attrs);
      notification.set({
        status: 'success',
        info: _t('components.table.columns.rename.success', {
          columnName: oldName,
          newName: newName
        }),
        closable: true
      });
    },
    error: function (mdl, e) {
      errorCallback && errorCallback(mdl, e);
      notification.set({
        status: 'error',
        info: _t('components.table.columns.rename.error', {
          columnName: oldName,
          newName: newName,
          error: errorParser(e)
        }),
        closable: true
      });
    }
  });
};
