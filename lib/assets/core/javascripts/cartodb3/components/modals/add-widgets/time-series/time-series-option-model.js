var _ = require('underscore');
var WidgetOptionModel = require('../widget-option-model');
var WidgetDefinitionModel = require('../../../../data/widget-definition-model');

module.exports = WidgetOptionModel.extend({
  defaults: _.defaults({type: 'time-series'}, WidgetOptionModel.defaults),

  save: function (widgetDefinitionsCollection) {
    var columnName = this.columnName();
    var layerId = this.layerDefinitionModel().id;
    var model = this;

    var attrs = {
      type: 'time-series',
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
      widget_style_definition: WidgetDefinitionModel.getDefaultWidgetStyle('time-series')
    };

    // Depending on column type, widget should have bins or aggregation
    if (this.get('aggregation')) {
      attrs.options.aggregation = this.get('aggregation');
      attrsSave.aggregation = this.get('aggregation');
    } else if (this.get('bins')) {
      attrs.options.bins = this.get('bins');
      attrsSave.bins = this.get('bins');
    }

    var successAddHandler = function (mdl, attrs) {
      widgetDefinitionsCollection.trigger('add', model);
    };

    var successReplaceHandler = function (mdl, attrs) {
      widgetDefinitionsCollection.trigger('replace', model);
    };

    var errorHandler = function (mdl, e) {
      widgetDefinitionsCollection.trigger('error', model, e);
    };

    var createLoadingNotification = function (type) {
      widgetDefinitionsCollection.trigger('loading', model);
    };

    var createUpdatingNotification = function (type) {
      widgetDefinitionsCollection.trigger('updating', model);
    };

    var m = widgetDefinitionsCollection.find(this._isTimesSeries);
    if (m) {
      // Update existing widget, but only if the column or layer differs
      if (m.get('column') !== columnName || m.get('layer_id') !== layerId) {
        createUpdatingNotification();
        return m.save(attrsSave, {
          wait: true,
          success: successReplaceHandler,
          error: errorHandler
        });
      }
    } else {
      createLoadingNotification();
      return widgetDefinitionsCollection.create(attrs, {
        wait: true,
        success: successAddHandler,
        error: errorHandler
      });
    }
  },

  _isTimesSeries: function (m) {
    return m.get('type') === 'time-series';
  }
});
