var removeWidgetConfirmationTemplate = require('./delete-widget-confirmation.tpl');
var ConfirmationView = require('../../components/modals/confirmation/modal-confirmation-view');
var checkAndBuildOpts = require('../../helpers/required-opts');

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

    setStackLayoutBehaviour: function (stackLayoutModel, nextStepProps, backStepProps) {
      this._stackLayoutModel = stackLayoutModel;
      this._nextStepProps = nextStepProps;
      this._backStepProps = backStepProps;
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

    editWidget: function (widgetDefModel) {
      if (!this._stackLayoutModel) {
        return;
      }

      this._editorModel.set('edition', false);
      this._editorModel.trigger('cancelPreviousEditions');

      this._stackLayoutModel.goToStep(
        this._nextStepProps.position,
        widgetDefModel,
        this._nextStepProps.arguments,
        function () {
          this._stackLayoutModel.goToStep(
            this._backStepProps.position,
            this._backStepProps.arguments
          );
        }.bind(this)
      );
    }
  };
})();

module.exports = service;
