var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'time-series',
    layer_index: 0,
    tuples: []
  },

  getWidgetDefinitionAttrs: function () {
    var i = this.get('layer_index');
    var item = this.get('tuples')[i];

    return {
      type: 'time-series',
      layer_id: item.layerDefinitionModel.id,
      column: item.columnModel.get('name'),
      title: this.get('title'),
      bins: this.get('bins'),
      start: this.get('start'),
      end: this.get('end')
    };
  }
});
