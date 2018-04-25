var deleteWidgetConfirmationTemplate = require('./delete-widget-confirmation.tpl');
var ConfirmationView = require('builder/components/modals/confirmation/modal-confirmation-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var Router = require('builder/routes/router');

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

    removeWidget: function (widgetDefinitionModel) {
      if (widgetDefinitionModel) {
        var self = this;
        var widgetName = widgetDefinitionModel.get('title');

        this._modalView = this._modals.create(function (modalModel) {
          return new ConfirmationView({
            modalModel: modalModel,
            template: deleteWidgetConfirmationTemplate,
            loadingTitle: _t('editor.widgets.delete.loading', { name: widgetName }),
            renderOpts: {
              name: widgetName
            },
            runAction: function () {
              modalModel.destroy();
              widgetDefinitionModel.destroy();
              self._modalView.clean();
              Router.goToWidgetList();
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
