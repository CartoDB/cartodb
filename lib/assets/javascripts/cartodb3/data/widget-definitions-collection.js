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

  initialize: function (models, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.mapId) throw new Error('mapId is required');

    this._configModel = options.configModel;
    this._mapId = options.mapId;

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
          column: columnName
        };
      },
      histogram: function (m) {
        return {
          column: m.get('column'),
          bins: m.get('bins') || 10
        };
      },
      'time-series': function (m) {
        return {
          column: m.get('column'),
          bins: m.get('bins') || 256
        };
      }
    };
  },

  url: function () {
    throw new Error('Not possible, see WidgetDefinitionModel.urlRoot');
  },

  attrsForThisType: function (newType, m) {
    return this._attrsForThisTypeMap[newType](m);
  },

  isThereTimeSeries: function (opts) {
    opts = opts || {};

    var timeSeries = this.findWhere({ type: 'time-series' });
    return opts.animated ? !!timeSeries : timeSeries && timeSeries.get('animated');
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
