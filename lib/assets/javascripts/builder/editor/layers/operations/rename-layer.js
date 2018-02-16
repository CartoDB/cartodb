var Notifier = require('builder/components/notifier/notifier');
var errorParser = require('builder/helpers/error-parser');
var utils = require('builder/helpers/utils');

module.exports = function (opts) {
  if (!opts.userActions) throw new Error('userActions is required');
  if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
  if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
  if (!opts.newName) throw new Error('newName is required');

  var layerDefinitionModel = opts.layerDefinitionModel;
  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;
  var newName = opts.newName;
  var oldName = layerDefinitionModel.getName();

  var notification = Notifier.addNotification({
    status: 'loading',
    info: _t('editor.layers.rename.loading'),
    closable: false
  });

  layerDefinitionModel.set('table_name_alias', newName);

  opts.userActions.saveLayer(layerDefinitionModel)
    .done(function () {
      successCallback && successCallback(newName);
      notification.set({
        status: 'success',
        info: _t('editor.layers.rename.success', {name: utils.escapeHTML(newName)}),
        closable: true
      });
    })
    .fail(function (e) {
      errorCallback && errorCallback(oldName);
      notification.set({
        status: 'error',
        info: _t('editor.layers.rename.error', {name: utils.escapeHTML(oldName), error: errorParser(e)}),
        closable: true
      });
    });
};
