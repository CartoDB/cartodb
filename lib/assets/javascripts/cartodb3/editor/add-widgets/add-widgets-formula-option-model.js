var cdb = require('cartodb.js');
var WidgetDefinitionModel = require('../../data/widget-definition-model');

/**
 * Intermediate model to create a formula widget definition.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    layer_index: 0,
    bucket: []
  },

  createWidgetDefinitionModel: function (widgetDefinitionsCollection) {
    var i = this.get('layer_index');
    var item = this.get('bucket')[i];
    var columnName = item.columnModel.get('name');

    // TODO tmp snippet of creating from dev console, just to verify the full cycle working
    var w = new WidgetDefinitionModel({
      type: 'formula',
      title: 'AVG ' + columnName,
      layer_id: item.layerDefinitionModel.id,
      options: {
        column: columnName,
        operation: 'avg'
      }
    }, {
      baseUrl: window.userData.base_url,
      configModel: window.configModel,
      dashboardWidgetsService: window.dashboard.widgets,
      layerDefinitionModel: item.layerDefinitionModel
    });
    widgetDefinitionsCollection.add(w);
    w.save();
  }
});
