var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'histogram',
    layer_index: 0,
    tuples: []
  },

  createUpdateOrSimilar: function (widgetDefinitionsCollection) {
    var i = this.get('layer_index');
    var item = this.get('tuples')[i];

    var attrs = {
      type: 'histogram',
      layer_id: item.layerDefinitionModel.id,
      source: {
        id: item.analysisDefinitionModel.id
      },
      column: item.columnModel.get('name'),
      title: this.get('title'),
      bins: this.get('bins')
    };
    widgetDefinitionsCollection.create(attrs, { wait: true });
  }
});
