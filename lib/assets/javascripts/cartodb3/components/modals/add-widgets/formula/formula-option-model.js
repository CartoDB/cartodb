var _ = require('underscore');
var WidgetOptionModel = require('../widget-option-model');

module.exports = WidgetOptionModel.extend({

  defaults: _.defaults({type: 'formula'}, WidgetOptionModel.defaults),

  _createUpdateOrSimilar: function (widgetDefinitionsCollection) {
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
    return widgetDefinitionsCollection.create(attrs, { wait: true });
  }
});
