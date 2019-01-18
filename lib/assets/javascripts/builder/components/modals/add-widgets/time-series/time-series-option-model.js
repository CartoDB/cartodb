var _ = require('underscore');
var WidgetOptionModel = require('builder/components/modals/add-widgets/widget-option-model');
var WidgetDefinitionModel = require('builder/data/widget-definition-model');

var TIME_SERIES_TYPE = 'time-series';

module.exports = WidgetOptionModel.extend({
  defaults: _.defaults({type: TIME_SERIES_TYPE}, WidgetOptionModel.defaults),

  save: function (widgetDefinitionsCollection) {
    var model = this;
    var columnName = this.columnName();
    var layerId = this.layerDefinitionModel().id;

    var attrs = {
      type: TIME_SERIES_TYPE,
      layer_id: layerId,
      source: {
        id: this.analysisDefinitionNodeModel().id
      },
      options: {
        column: columnName,
        title: this.get('title')
      },
      style: {
        widget_style: {
          definition: WidgetDefinitionModel.getDefaultWidgetStyle(TIME_SERIES_TYPE)
        }
      }
    };

    var attrsSave = {
      type: TIME_SERIES_TYPE,
      layer_id: layerId,
      source: this.analysisDefinitionNodeModel().id,
      column: columnName,
      title: this.get('title'),
      widget_style_definition: WidgetDefinitionModel.getDefaultWidgetStyle(TIME_SERIES_TYPE)
    };

    // Depending on column type, widget should have bins or aggregation
    if (this.get('aggregation')) {
      attrs.options.aggregation = this.get('aggregation');
      attrsSave.aggregation = this.get('aggregation');
    } else if (this.get('bins')) {
      attrs.options.bins = this.get('bins');
      attrsSave.bins = this.get('bins');
    }

    var successReplaceHandler = function () {
      widgetDefinitionsCollection.trigger('successReplace', model);
    };

    var errorHandler = function (model, e) {
      widgetDefinitionsCollection.trigger('error', model, e);
    };

    var createUpdatingNotification = function () {
      widgetDefinitionsCollection.trigger('updating', model);
    };

    var existingModel = widgetDefinitionsCollection.find(this._isTimesSeries);
    if (existingModel) {
      // Update existing widget, but only if the column or layer differs
      if (existingModel.get('column') !== columnName || existingModel.get('layer_id') !== layerId) {
        createUpdatingNotification();
        return existingModel.save(attrsSave, {
          wait: true,
          success: successReplaceHandler,
          error: errorHandler
        });
      }
    } else {
      return widgetDefinitionsCollection.addWidget(model, attrs);
    }
  },

  _isTimesSeries: function (model) {
    return model.get('type') === TIME_SERIES_TYPE;
  }
});
