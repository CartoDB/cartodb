var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'time-series',
    layer_index: 0,
    tuples: []
  },

  createUpdateOrSimilar: function (widgetDefinitionsCollection) {
    var i = this.get('layer_index');
    var item = this.get('tuples')[i];
    var columnName = item.columnModel.get('name');
    var layerId = item.layerDefinitionModel.id;

    var attrs = {
      type: 'time-series',
      layer_id: layerId,
      source: {
        id: item.analysisDefinitionModel.id,
      },
      column: columnName,
      title: this.get('title'),
      bins: this.get('bins')
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
