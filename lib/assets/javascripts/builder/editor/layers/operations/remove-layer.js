var Notifier = require('builder/components/notifier/notifier');
var errorParser = require('builder/helpers/error-parser');

module.exports = function (opts) {
  if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
  if (!opts.userActions) throw new Error('userActions is required');

  var layerDefinitionModel = opts.layerDefinitionModel;

  var name = layerDefinitionModel.getName();
  var notification = Notifier.addNotification({
    status: 'loading',
    info: _t('editor.layers.delete.loading', {name: name}),
    closable: false
  });

  opts.userActions.deleteLayer(layerDefinitionModel.id)
    .done(function () {
      notification.set({
        status: 'success',
        info: _t('editor.layers.delete.success', {name: name}),
        closable: true
      });
    })
    .fail(function (e) {
      notification.set({
        status: 'error',
        info: _t('editor.layers.delete.error', {name: name, error: errorParser(e)}),
        closable: true
      });
    });
};
