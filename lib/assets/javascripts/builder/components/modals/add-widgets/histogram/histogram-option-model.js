var _ = require('underscore');
var WidgetOptionModel = require('builder/components/modals/add-widgets/widget-option-model');
var WidgetDefinitionModel = require('builder/data/widget-definition-model');

var HISTOGRAM_TYPE = 'histogram';

module.exports = WidgetOptionModel.extend({
  defaults: _.defaults({type: HISTOGRAM_TYPE}, WidgetOptionModel.defaults),

  save: function (widgetDefinitionsCollection) {
    var model = this;
    var columnName = this.columnName();
    var styleModel = this.layerDefinitionModel() && this.layerDefinitionModel().styleModel;
    var isAllowed = styleModel && styleModel.canApplyAutoStyle() || false;

    var attrs = {
      type: HISTOGRAM_TYPE,
      layer_id: this.layerDefinitionModel().id,
      source: {
        id: this.analysisDefinitionNodeModel().id
      },
      options: {
        column: columnName,
        title: this.get('title'),
        bins: this.get('bins')
      },
      style: {
        widget_style: {
          definition: WidgetDefinitionModel.getDefaultWidgetStyle(HISTOGRAM_TYPE)
        },
        auto_style: {
          allowed: isAllowed,
          custom: false
        }
      }
    };

    return widgetDefinitionsCollection.addWidget(model, attrs);
  }
});
