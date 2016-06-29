var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  defaults: {
    type: 'category',
    layer_index: 0,
    tuples: []
  },

  createUpdateOrSimilar: function (widgetDefinitionsCollection) {
    var i = this.get('layer_index');
    var item = this.get('tuples')[i];
    var columnName = item.columnModel.get('name');

    var attrs = {
      type: 'category',
      layer_id: item.layerDefinitionModel.id,
      source: {
        id: item.analysisDefinitionModel.id
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
