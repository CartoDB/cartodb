var Backbone = require('backbone');
var _ = require('underscore');
var WidgetDefinitionModel = require('./widget-definition-model');

/**
 * Collection of widget definitions, synhronizes the internal definitions and the widget models.
 */
module.exports = Backbone.Collection.extend({

  comparator: 'order',

  model: function (d, opts) {
    var self = opts.collection;
    d.order = !_.isUndefined(d.order) ? d.order : self._getNextOrder();
    var m = new WidgetDefinitionModel(d, {
      parse: true, // make sure data is structured as expected
      collection: self,
      configModel: self._configModel,
      mapId: self._mapId
    });
    return m;
  },

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.mapId) throw new Error('mapId is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this._configModel = opts.configModel;
    this._mapId = opts.mapId;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;

    this._bindLayerStyleChanges();

    this._attrsForThisTypeMap = {
      formula: function (m) {
        return {
          column: m.get('column'),
          operation: m.get('operation') || 'max'
        };
      },
      category: function (m) {
        var columnName = m.get('column');
        return {
          aggregation: m.get('aggregation') || 'count',
          aggregation_column: m.get('aggregation_column') || columnName,
          column: columnName,
          widget_style_definition: m.get('widget_style_definition') || WidgetDefinitionModel.getDefaultWidgetStyle('category'),
          auto_style_definition: undefined
        };
      },
      histogram: function (m) {
        return {
          column: m.get('column'),
          bins: m.get('bins') || 10,
          widget_style_definition: m.get('widget_style_definition') || WidgetDefinitionModel.getDefaultWidgetStyle('histogram'),
          auto_style_definition: undefined
        };
      },
      'time-series': function (m) {
        return {
          column: m.get('column'),
          bins: m.get('bins') || 256,
          widget_style_definition: m.get('widget_style_definition') || WidgetDefinitionModel.getDefaultWidgetStyle('time-series')
        };
      }
    };
  },

  url: function () {
    throw new Error('Not possible, see WidgetDefinitionModel.urlRoot');
  },

  _bindLayerStyleChanges: function () {
    this._layerDefinitionsCollection.bind('change:style_properties', this._onLayerStyleChanged, this)
  },

  _onLayerStyleChanged: function (layerDefModel) {
    var styleModel = layerDefModel.styleModel;
    var isAggregated = styleModel && styleModel.isAggregatedType();
    var affectedWidgets = this.where({ layer_id: layerDefModel.id });

    _.each(affectedWidgets, function (widgetDefModel) {
      var isNowAllowed = widgetDefModel.get('auto_style_allowed');
      var willBeAllowed = !isAggregated;
      if (isNowAllowed !== willBeAllowed) {
        widgetDefModel.save({ auto_style_allowed: willBeAllowed });
      }
    });
  },

  attrsForThisType: function (newType, m) {
    return this._attrsForThisTypeMap[newType](m);
  },

  isThereTimeSeries: function () {
    return !!this.findWhere({ type: 'time-series' });
  },

  isThereOtherWidgets: function () {
    return !!this.find(function (widgetModel) {
      return widgetModel.get('type') !== 'time-series';
    });
  },

  _getNextOrder: function () {
    if (this.isEmpty()) {
      return 0;
    } else {
      var lastItemByOrder = this.max(function (mdl) {
        return mdl.get('order');
      });
      return lastItemByOrder.get('order') + 1;
    }
  },

  widgetsOwnedByLayer: function (layerId) {
    var widgets = this.where({ layer_id: layerId });

    return widgets.length;
  }

});
