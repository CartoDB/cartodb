var removeWidgetConfirmationTemplate = require('./delete-widget-confirmation.tpl');
var ConfirmationView = require('../../components/modals/confirmation/modal-confirmation-view');

var service = (function () {
  return {
    init: function (opts) {
      if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
      if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection');
      if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
      if (!opts.userActions) throw new Error('userActions is required');
      if (!opts.modals) throw new Error('modals is required');

      this._modals = opts.modals;
      this._userActions = opts.userActions;
      this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
      this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
      this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
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
