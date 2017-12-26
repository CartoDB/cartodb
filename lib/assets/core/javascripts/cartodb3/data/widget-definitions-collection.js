var Backbone = require('backbone');
var _ = require('underscore');
var WidgetDefinitionModel = require('./widget-definition-model');
var checkAndBuildOpts = require('../helpers/required-opts');

var REQUIRED_OPTS = [
  'configModel',
  'mapId',
  'layerDefinitionsCollection',
  'analysisDefinitionNodesCollection'
];

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
    var self = this;
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._bindLayerStyleChanges();

    this._attrsForThisTypeMap = {
      formula: function (model) {
        return {
          column: model.get('column'),
          operation: model.get('operation') || 'max'
        };
      },
      category: function (model) {
        var columnName = model.get('column');
        return {
          aggregation: model.get('aggregation') || 'count',
          aggregation_column: model.get('aggregation_column') || columnName,
          column: columnName,
          widget_style_definition: model.get('widget_style_definition') || WidgetDefinitionModel.getDefaultWidgetStyle('category'),
          auto_style_definition: undefined
        };
      },
      histogram: function (model) {
        return {
          column: model.get('column'),
          bins: model.get('bins') || 10,
          column_type: 'number',
          widget_style_definition: model.get('widget_style_definition') || WidgetDefinitionModel.getDefaultWidgetStyle('histogram'),
          auto_style_definition: undefined
        };
      },
      'time-series': function (model) {
        return {
          column: model.get('column'),
          bins: model.get('bins') || 256,
          aggregation: model.get('aggregation'),
          column_type: self.getColumnType(model.get('column'), model.get('source')),
          widget_style_definition: model.get('widget_style_definition') || WidgetDefinitionModel.getDefaultWidgetStyle('time-series')
        };
      }
    };
  },

  url: function () {
    throw new Error('Not possible, see WidgetDefinitionModel.urlRoot');
  },

  _bindLayerStyleChanges: function () {
    this._layerDefinitionsCollection.bind('change:style_properties', this._onLayerStyleChanged, this);
  },

  _onLayerStyleChanged: function (layerDefModel) {
    var styleModel = layerDefModel.styleModel;
    var isAllowed = styleModel && styleModel.canApplyAutoStyle();
    var affectedWidgets = this.where({ layer_id: layerDefModel.id });

    _.each(affectedWidgets, function (widgetDefModel) {
      var isNowAllowed = widgetDefModel.get('auto_style_allowed');
      var willBeAllowed = isAllowed;
      var attrs = {
        auto_style_allowed: willBeAllowed
      };

      if (isNowAllowed !== willBeAllowed) {
        // if autostyle is not allow, we should clean auto_style_definition
        if (willBeAllowed === false) {
          attrs = _.extend(attrs, { auto_style_definition: '' });
        }
        widgetDefModel.save(attrs);
      }
    });
  },

  attrsForThisType: function (newType, m) {
    return this._attrsForThisTypeMap[newType](m);
  },

  resetableAttrsForTypeMap: function (type) {
    switch (type) {
      case 'formula':
        return [];
      case 'category':
        return ['aggregation'];
      case 'histogram':
        return ['bins', 'column_type'];
      case 'time-series':
        return ['bins', 'aggregation', 'column_type'];
    }
  },

  isThereTimeSeries: function (opts) {
    opts = opts || {};

    var timeSeries = opts.animated ? this.findWhere({ type: 'time-series', animated: opts.animated }) : this.findWhere({ type: 'time-series' });
    return !!timeSeries;
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
  },

  getColumnType: function (columnName, source) {
    var column;
    var node = this._analysisDefinitionNodesCollection.get(source);
    var schemaModel = node && node.querySchemaModel;
    if (schemaModel && schemaModel.get('status') === 'fetched') {
      column = schemaModel.columnsCollection.findWhere({ name: columnName });
    }
    return column && column.get('type');
  }
});
