var removeWidgetConfirmationTemplate = require('./delete-widget-confirmation.tpl');
var ConfirmationView = require('../../components/modals/confirmation/modal-confirmation-view');
var checkAndBuildOpts = require('../../helpers/required-opts');
var Router = require('../../routes/router');

var REQUIRED_OPTS = [
  'analysisDefinitionNodesCollection',
  'editorModel',
  'layerDefinitionsCollection',
  'modals',
  'userActions',
  'widgetDefinitionsCollection'
];

var service = (function () {
  return {
    init: function (opts) {
      checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    },

    removeWidget: function (widgetDefModel, callback) {
      var widgetName = widgetDefModel.get('title');

      if (widgetDefModel) {
        this._modals.create(function (modalModel) {
          return new ConfirmationView({
            modalModel: modalModel,
            template: removeWidgetConfirmationTemplate,
            loadingTitle: _t('editor.widgets.delete.loading', {name: widgetName}),
            renderOpts: {
              name: widgetName
            },
            runAction: function () {
              modalModel.destroy();
              widgetDefModel.destroy();
              callback && callback();
            }
          });
        });
      }
    },

    editWidget: function (model) {
      this._editorModel.set('edition', false);
      this._editorModel.trigger('cancelPreviousEditions');

      Router.goToWidget(model.get('id'));
    }
  };
})();

module.exports = service;
