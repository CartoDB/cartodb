var Notifier = require('builder/components/notifier/notifier');
var errorParser = require('builder/helpers/error-parser');
var utils = require('builder/helpers/utils');

var TITLE_SUFIX = require('builder/components/modals/visualization-title-suffix-metadata');

module.exports = function (opts) {
  if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
  if (!opts.newName) throw new Error('newName is required');

  var visDefinitionModel = opts.visDefinitionModel;
  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;
  var newName = opts.newName;
  var oldName = visDefinitionModel.get('name');

  var notification = Notifier.addNotification({
    status: 'loading',
    info: _t('editor.maps.rename.loading'),
    closable: false
  });

  visDefinitionModel.save({
    name: newName
  }, {
    wait: true,
    success: function (mdl, e) {
      successCallback && successCallback(newName);
      document.title = newName + TITLE_SUFIX;
      notification.set({
        status: 'success',
        info: _t('editor.maps.rename.success', {name: utils.escapeHTML(newName)}),
        closable: true
      });
    },
    error: function (mdl, e) {
      errorCallback && errorCallback(oldName);
      notification.set({
        status: 'error',
        info: _t('editor.maps.rename.error', {name: utils.escapeHTML(oldName), error: errorParser(e)}),
        closable: true
      });
    }
  });
};
