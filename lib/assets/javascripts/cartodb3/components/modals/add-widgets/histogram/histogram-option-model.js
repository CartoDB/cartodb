var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

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
      options: {
        column: item.columnModel.get('name'),
        title: this.get('title'),
        bins: this.get('bins')
      }
    };
    return widgetDefinitionsCollection.create(attrs, { wait: true });
  }
});
