var _ = require('underscore');
var WidgetOptionModel = require('../widget-option-model');

module.exports = WidgetOptionModel.extend({

  defaults: _.defaults({type: 'category'}, WidgetOptionModel.defaults),

  createUpdateOrSimilar: function (widgetDefinitionsCollection) {
    var columnName = this.columnName();

    var attrs = {
      type: 'category',
      layer_id: this.layerDefinitionModel().id,
      source: {
        id: this.analysisDefinitionNodeModel().id
      },
      options: {
        column: columnName,
        aggregation_column: columnName,
        aggregation: this.get('aggregation'),
        title: this.get('title')
      }
    };

    return widgetDefinitionsCollection.create(attrs, { wait: true });
  }
});
