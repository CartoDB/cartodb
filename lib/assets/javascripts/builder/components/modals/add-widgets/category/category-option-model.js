var _ = require('underscore');
var WidgetOptionModel = require('cartodb3/components/modals/add-widgets/widget-option-model');
var WidgetDefinitionModel = require('cartodb3/data/widget-definition-model');

var CATEGORY_TYPE = 'category';

module.exports = WidgetOptionModel.extend({
  defaults: _.defaults({type: CATEGORY_TYPE}, WidgetOptionModel.defaults),

  save: function (widgetDefinitionsCollection) {
    var model = this;
    var columnName = this.columnName();
    var styleModel = this.layerDefinitionModel() && this.layerDefinitionModel().styleModel;
    var isAllowed = styleModel && styleModel.canApplyAutoStyle() || false;

    var attrs = {
      type: CATEGORY_TYPE,
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
          definition: WidgetDefinitionModel.getDefaultWidgetStyle(CATEGORY_TYPE)
        },
        auto_style: {
          allowed: isAllowed,
          custom: false
        }
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
