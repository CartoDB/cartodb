var _ = require('underscore');
var WidgetOptionModel = require('../widget-option-model');
var WidgetDefinitionModel = require('../../../../data/widget-definition-model');

module.exports = WidgetOptionModel.extend({
  defaults: _.defaults({type: 'time-series'}, WidgetOptionModel.defaults),

  save: function (widgetDefinitionsCollection) {
    var columnName = this.columnName();
    var layerId = this.layerDefinitionModel().id;
    var model = this;
    var styleModel = this.layerDefinitionModel() && this.layerDefinitionModel().styleModel;
    var isAggregatedStyle = styleModel && styleModel.isAggregatedType() || false;

    var attrs = {
      type: 'time-series',
      layer_id: layerId,
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
          definition: WidgetDefinitionModel.getDefaultWidgetStyle('time-series')
        }
      }
    };

    var attrsSave = {
      type: 'time-series',
      layer_id: layerId,
      source: this.analysisDefinitionNodeModel().id,
      column: columnName,
      title: this.get('title'),
      bins: this.get('bins'),
      widget_style_definition: WidgetDefinitionModel.WIDGET_STYLE
    };

    var successHandler = function (mdl, attrs) {
      widgetDefinitionsCollection.trigger('success', model);
    };

    var errorHandler = function (mdl, e) {
      widgetDefinitionsCollection.trigger('error', model, e);
    };

    var createNotification = function (type) {
      if (type === 'create') {
        widgetDefinitionsCollection.trigger('loading', model);
      } else {
        widgetDefinitionsCollection.trigger('updating', model);
      }
    };

    var m = widgetDefinitionsCollection.find(this._isTimesSeries);
    if (m) {
      // Update existing widget, but only if the column or layer differs
      if (m.get('column') !== columnName || m.get('layer_id') !== layerId) {
        createNotification('update');
        return m.save(attrsSave, {
          wait: true,
          success: successHandler,
          error: errorHandler
        });
      }
    } else {
      createNotification('create');
      return widgetDefinitionsCollection.create(attrs, {
        wait: true,
        success: successHandler,
        error: errorHandler
      });
    }
  },

  _isTimesSeries: function (m) {
    return m.get('type') === 'time-series';
  }
});
