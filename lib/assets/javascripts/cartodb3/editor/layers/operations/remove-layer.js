var Notifier = require('../../../components/notifier/notifier');
var errorParser = require('../../../helpers/error-parser');
var MetricsTracker = require('../../../components/metrics/metrics-tracker');

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

      MetricsTracker.track('Deleted dataset', layerDefinitionModel.attributes);
    })
    .fail(function (e) {
      notification.set({
        status: 'error',
        info: _t('editor.layers.delete.error', {name: name, error: errorParser(e)}),
        closable: true
      });
    });
};
