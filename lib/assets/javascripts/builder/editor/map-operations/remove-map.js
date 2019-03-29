var Notifier = require('builder/components/notifier/notifier');
var errorParser = require('builder/helpers/error-parser');

module.exports = function (opts) {
  if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');

  var visDefinitionModel = opts.visDefinitionModel;
  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;
  var name = visDefinitionModel.get('name');

  visDefinitionModel.destroy({
    wait: true,
    success: function (mdl, attrs) {
      successCallback && successCallback(mdl, attrs);
    },
    error: function (mdl, e) {
      errorCallback && errorCallback(mdl, e);
      Notifier.addNotification({
        status: 'error',
        info: _t('editor.maps.delete.error', {name: name, error: errorParser(e)}),
        closable: true
      });
    }
  });
};
