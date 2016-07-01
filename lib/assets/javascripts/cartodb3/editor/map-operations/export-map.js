var Notifier = require('../../components/notifier/notifier');
var errorParser = require('../../helpers/error-parser');

module.exports = function (opts) {
  if (!opts.visDefinitionExportModel) throw new Error('visDefinitionExportModel is required');

  var visDefinitionExportModel = opts.visDefinitionExportModel;
  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;

  visDefinitionExportModel.requestExport({
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
