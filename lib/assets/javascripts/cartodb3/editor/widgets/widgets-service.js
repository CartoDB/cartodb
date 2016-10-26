var removeWidgetConfirmationTemplate = require('./delete-widget-confirmation.tpl');
var ConfirmationView = require('../../components/modals/confirmation/modal-confirmation-view');

var service = (function () {
  return {
    init: function (opts) {
      if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
      if (!opts.modals) throw new Error('modals is required');

      this._modals = opts.modals;
      this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
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

    trackWidgetEdition: function (stackLayoutModel, widgetDefinitionModel) {
    	console.log('hey');
    }
  };
})();

module.exports = service;
