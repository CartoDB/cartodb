var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'formula',
    layer_index: 0,
    tuples: []
  },

  getWidgetDefinitionAttrs: function () {
    var i = this.get('layer_index');
    var item = this.get('tuples')[i];
    var columnName = item.columnModel.get('name');

    return {
      type: 'formula',
      title: columnName,
      layer_id: item.layerDefinitionModel.id,
      column: columnName,
      operation: this.get('operation')
    };
  }
});
