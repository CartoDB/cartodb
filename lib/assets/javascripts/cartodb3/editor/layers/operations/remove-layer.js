var Notifier = require('../../../components/notifier/notifier');
var errorParser = require('../../../helpers/error-parser');

module.exports = function (opts) {
  if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

  var layerDefinitionModel = opts.layerDefinitionModel;
  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;

  var name = layerDefinitionModel.getName();
  var notification = Notifier.addNotification({
    status: 'loading',
    info: _t('editor.layers.delete.loading', {name: name}),
    closable: false
  });

  layerDefinitionModel.destroy({
    wait: true,
    success: function (mdl, attrs) {
      successCallback && successCallback(mdl, attrs);
      notification.set({
        status: 'success',
        info: _t('editor.layers.delete.success', {name: name}),
        closable: true
      });
    },
    error: function (mdl, e) {
      errorCallback && errorCallback(mdl, e);
      notification.set({
        status: 'error',
        info: _t('editor.layers.delete.error', {name: name, error: errorParser(e)}),
        closable: true
      });
    }
  });
};
