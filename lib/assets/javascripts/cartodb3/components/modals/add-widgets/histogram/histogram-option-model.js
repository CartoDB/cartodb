var _ = require('underscore');
var WidgetOptionModel = require('../widget-option-model');

module.exports = WidgetOptionModel.extend({

  defaults: _.defaults({type: 'histogram'}, WidgetOptionModel.defaults),

  createUpdateOrSimilar: function (widgetDefinitionsCollection) {
    var attrs = {
      type: 'histogram',
      layer_id: this.layerDefinitionModel().id,
      source: {
        id: this.analysisDefinitionNodeModel().id
      },
      options: {
        column: this.columnName(),
        title: this.get('title'),
        bins: this.get('bins')
      }
    };
    return widgetDefinitionsCollection.create(attrs, { wait: true });
  }
});
