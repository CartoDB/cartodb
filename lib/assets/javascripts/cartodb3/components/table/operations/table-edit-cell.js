var Notifier = require('../../../components/notifier/notifier');
var errorParser = require('../../../helpers/error-parser');

module.exports = function (opts) {
  if (!opts.rowModel) throw new Error('rowModel is required');
  if (opts.newValue === undefined) throw new Error('newValue is required');
  if (!opts.attribute) throw new Error('attribute is required');

  var rowModel = opts.rowModel;
  var newValue = opts.newValue;
  var attribute = opts.attribute;
  var cartodbId = rowModel.get('cartodb_id');
  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;
  var notification = Notifier.addNotification({
    status: 'loading',
    info: _t('components.table.rows.edit.loading', {
      attribute: attribute,
      cartodbId: cartodbId
    }),
    closable: false
  });

  // In order to preserve "previous" attribute
  rowModel.set(attribute, newValue);
  rowModel.save(null, {
    success: function (mdl, attrs) {
      successCallback && successCallback(mdl, attrs);
      notification.set({
        status: 'success',
        info: _t('components.table.rows.edit.success', {
          attribute: attribute,
          cartodbId: cartodbId
        }),
        closable: true
      });
    },
    error: function (mdl, e) {
      errorCallback && errorCallback(mdl, e);
      notification.set({
        status: 'error',
        info: _t('components.table.rows.edit.error', {
          attribute: attribute,
          cartodbId: cartodbId,
          error: errorParser(e)
        }),
        closable: true
      });
    }
  });
};
