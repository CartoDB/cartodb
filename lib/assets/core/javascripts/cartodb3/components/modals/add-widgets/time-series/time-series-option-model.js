var _ = require('underscore');
var WidgetOptionModel = require('../widget-option-model');
var WidgetDefinitionModel = require('../../../../data/widget-definition-model');
var TIME_SERIES_TYPE = 'time-series';

module.exports = WidgetOptionModel.extend({
  defaults: _.defaults({type: TIME_SERIES_TYPE}, WidgetOptionModel.defaults),

  save: function (widgetDefinitionsCollection) {
    var columnName = this.columnName();
    var layerId = this.layerDefinitionModel().id;
    var model = this;

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
    return m.get('type') === TIME_SERIES_TYPE;
  }
});
