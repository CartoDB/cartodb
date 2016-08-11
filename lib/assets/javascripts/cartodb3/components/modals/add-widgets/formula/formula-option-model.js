var _ = require('underscore');
var WidgetOptionModel = require('../widget-option-model');

module.exports = WidgetOptionModel.extend({
  defaults: _.defaults({type: 'formula'}, WidgetOptionModel.defaults),

  save: function (widgetDefinitionsCollection) {
    var model = this;
    widgetDefinitionsCollection.trigger('loading', model);

    var attrs = {
      type: 'formula',
      layer_id: this.layerDefinitionModel().id,
      source: {
        id: this.analysisDefinitionNodeModel().id
      },
      options: {
        column: this.columnName(),
        title: this.get('title'),
        operation: this.get('operation')
      }
    };

    return widgetDefinitionsCollection.create(attrs, {
      wait: true,
      success: function (mdl, attrs) {
        widgetDefinitionsCollection.trigger('success', model);
      },
      error: function (mdl, e) {
        widgetDefinitionsCollection.trigger('error', model, e);
      }
    });
  }
});
