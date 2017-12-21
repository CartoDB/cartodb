var _ = require('underscore');
var WidgetOptionModel = require('../widget-option-model');

var FORMULA_TYPE = 'formula';

module.exports = WidgetOptionModel.extend({
  defaults: _.defaults({type: FORMULA_TYPE}, WidgetOptionModel.defaults),

  save: function (widgetDefinitionsCollection) {
    var model = this;
    var columnName = this.columnName();

    var attrs = {
      type: FORMULA_TYPE,
      layer_id: this.layerDefinitionModel().id,
      source: {
        id: this.analysisDefinitionNodeModel().id
      },
      options: {
        column: columnName,
        title: this.get('title'),
        operation: this.get('operation')
      }
    };

    widgetDefinitionsCollection.trigger('loading', model);

    return widgetDefinitionsCollection.create(attrs, {
      wait: true,
      success: function (mdl, attrs) {
        widgetDefinitionsCollection.trigger('successAdd', model);
      },
      error: function (mdl, e) {
        widgetDefinitionsCollection.trigger('error', model, e);
      }
    });
  }
});
