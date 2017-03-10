var _ = require('underscore');
var WidgetOptionModel = require('../widget-option-model');
var WidgetDefinitionModel = require('../../../../data/widget-definition-model');

module.exports = WidgetOptionModel.extend({
  defaults: _.defaults({type: 'histogram'}, WidgetOptionModel.defaults),

  save: function (widgetDefinitionsCollection) {
    var styleModel = this.layerDefinitionModel() && this.layerDefinitionModel().styleModel;
    var isAllowed = styleModel && styleModel.canApplyAutoStyle() || false;

    var attrs = {
      type: 'histogram',
      layer_id: this.layerDefinitionModel().id,
      source: {
        id: this.analysisDefinitionNodeModel().id
      },
      options: {
        column: this.columnName(),
        title: this.get('title'),
        bins: this.get('bins')
      },
      style: {
        widget_style: {
          definition: WidgetDefinitionModel.getDefaultWidgetStyle('histogram')
        },
        auto_style: {
          allowed: isAllowed,
          custom: false
        }
      }
    };

    var model = this;
    widgetDefinitionsCollection.trigger('loading', model);

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
