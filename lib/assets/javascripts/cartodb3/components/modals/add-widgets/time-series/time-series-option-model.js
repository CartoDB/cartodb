var _ = require('underscore');
var WidgetOptionModel = require('../widget-option-model');

module.exports = WidgetOptionModel.extend({

  defaults: _.defaults({type: 'time-series'}, WidgetOptionModel.defaults),

  createUpdateOrSimilar: function (widgetDefinitionsCollection) {
    var columnName = this.columnName();
    var layerId = this.layerDefinitionModel().id;

    var attrs = {
      type: 'time-series',
      layer_id: layerId,
      source: {
        id: this.analysisDefinitionNodeModel().id
      },
      options: {
        column: columnName,
        title: this.get('title'),
        bins: this.get('bins')
      }
    };

    var m = widgetDefinitionsCollection.find(this._isTimesSeries);
    if (m) {
      // Update existing widget, but only if the column or layer differs
      if (m.get('column') !== columnName || m.get('layer_id') !== layerId) {
        m.save(attrs, { wait: true });
      }
    } else {
      widgetDefinitionsCollection.create(attrs, { wait: true });
    }
  },

  _isTimesSeries: function (m) {
    return m.get('type') === 'time-series';
  }
});
