var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'formula',
    layer_index: 0,
    tuples: []
  },

  createUpdateOrSimilar: function (widgetDefinitionsCollection) {
    var i = this.get('layer_index');
    var item = this.get('tuples')[i];

    var attrs = {
      type: 'formula',
      layer_id: item.layerDefinitionModel.id,
      source_id: item.analysisDefinitionModel.id,
      column: item.columnModel.get('name'),
      title: this.get('title'),
      operation: this.get('operation')
    };
    widgetDefinitionsCollection.create(attrs, { wait: true });
  }
});
