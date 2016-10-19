var _ = require('underscore');
var WidgetOptionModel = require('../widget-option-model');
var WidgetDefinitionModel = require('../../../../data/widget-definition-model');

module.exports = WidgetOptionModel.extend({

  defaults: _.defaults({type: 'category'}, WidgetOptionModel.defaults),

  save: function (widgetDefinitionsCollection) {
    var columnName = this.columnName();
    var model = this;
    var styleModel = this.layerDefinitionModel() && this.layerDefinitionModel().styleModel;
    var isAggregatedStyle = styleModel && styleModel.isAggregatedType() || false;

    widgetDefinitionsCollection.trigger('loading', model);

    var attrs = {
      type: 'category',
      layer_id: this.layerDefinitionModel().id,
      source: {
        id: this.analysisDefinitionNodeModel().id
      },
      options: {
        column: columnName,
        aggregation_column: columnName,
        aggregation: this.get('aggregation'),
        title: this.get('title')
      },
      style: {
        widget_style: {
          definition: WidgetDefinitionModel.getDefaultWidgetStyle()
        },
        auto_style: {
          allowed: !isAggregatedStyle,
          custom: false
        }
      }
    };

    return widgetDefinitionsCollection.create(attrs, {
      wait: true,
      success: function (mdl, attrs) {
        widgetDefinitionsCollection.trigger('success', model);
      },
      error: function (mdl, e) {
        widgetDefinitionsCollection.trigger('error', model, e);
      }
    });
  }
});
