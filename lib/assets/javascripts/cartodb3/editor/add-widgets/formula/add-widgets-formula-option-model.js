var cdb = require('cartodb.js');

/**
 * Intermediate model to create a formula widget definition.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    layer_index: 0,
    operation: 'avg',
    bucket: []
  },

  createWidgetDefinitionModel: function (widgetDefinitionsCollection) {
    var i = this.get('layer_index');
    var item = this.get('bucket')[i];
    var columnName = item.columnModel.get('name');
    var operation = this.get('operation');

    widgetDefinitionsCollection.create({
      type: 'formula',
      title: columnName + ' ' + operation.toUpperCase(), // e.g. 'some_numbers AVG'
      layer_id: item.layerDefinitionModel.id,
      options: {
        column: columnName,
        operation: operation
      }
    }, {
      wait: true // until API confirms it was created
    });
  }
});
