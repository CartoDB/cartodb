var Notifier = require('../../../components/notifier/notifier');
var errorParser = require('../../../helpers/error-parser');

module.exports = function (opts) {
  if (!opts.columnModel) { throw new Error('columnModel is required'); }
  if (!opts.newType) { throw new Error('newType is required'); }

  var columnModel = opts.columnModel;
  var newType = opts.newType;

  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;

  var notification = Notifier.addNotification({
    status: 'loading',
    info: _t('components.table.columns.change-type.loading', {
      columnName: columnModel.get('name')
    }),
    closable: false
  });

  columnModel.save({
    type: newType
  }, {
    wait: true,
    success: function (mdl, attrs) {
      successCallback && successCallback(mdl, attrs);
      notification.set({
        status: 'success',
        info: _t('components.table.columns.change-type.success', {
          columnName: columnModel.get('name'),
          newType: newType
        }),
        closable: true
      });
    },
    error: function (mdl, e) {
      errorCallback && errorCallback(mdl, e);
      notification.set({
        status: 'error',
        info: _t('components.table.columns.change-type.error', {
          columnName: columnModel.get('name'),
          newType: newType,
          error: errorParser(e)
        }),
        closable: true
      });
    }
  });
};
