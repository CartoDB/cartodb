var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');

/**
 * Widget definition Model
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, options) {
    if (!options.baseUrl) throw new Error('baseUrl is required');
    if (!options.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!options.dashboardWidgetsService) throw new Error('dashboardWidgetsService is required');

    this._baseUrl = options.baseUrl;
    this._layerDefModel = options.layerDefinitionModel;
    this._dashboardWidgetsService = options.dashboardWidgetsService;

    this.widgetModel = options.widgetModel;
    this.sync = _.debounce(this.sync, 500);
    
    this.on('sync', this._onSync, this);
    this.on('destroy', this._onDestroy, this);
  },

  urlRoot: function () {
    var mapId = this._layerDefModel.collection.mapId;
    var layerId = this._layerDefModel.id;
    return _.result(this, '_baseUrl') + '/api/v3/maps/' + mapId + '/layers/' + layerId + '/widgets';
  },

  updateType: function (widgetType) {
    var newWidgetAttrs = this._generateWidgetModelAttributes[widgetType].call(this);
    this.set({
      type: widgetType,
      options: _.omit(newWidgetAttrs, ['id', 'layer_id', 'title', 'type'])
    });
    this._removeWidgetModel();
    this.save();
  },

  toJSON: function () {
    var opts = this.get('options') || {};
    if (!_.isUndefined(opts.sync)) {
      opts.sync = opts.sync === 'true';
    }

    return {
      id: this.get('id'),
      type: this.get('type'),
      title: this.get('title'),
      layer_id: this._layerDefModel.id,
      options: opts
    };
  },

  _onSync: function () {
    // No model yet; this was a new widget definition, so create the actual widget model
    // TODO error handling, for now let errors bubble up
    if (!this.widgetModel) {
      this.widgetModel = this._createWidgetModelMap[this.get('type')].call(this);
    }
  },

  _createWidgetModelMap: {
    formula: function () {
      var attrs = this._generateWidgetModelAttributes[this.get('type')].call(this);
      return this._dashboardWidgetsService.createFormulaModel(attrs, this._layerDefModel.layerModel);
    },
    category: function () {
      var attrs = this._generateWidgetModelAttributes[this.get('type')].call(this);
      return this._dashboardWidgetsService.createCategoryModel(attrs, this._layerDefModel.layerModel);
    },
    histogram: function () {
      var attrs = this._generateWidgetModelAttributes[this.get('type')].call(this);
      return this._dashboardWidgetsService.createHistogramModel(attrs, this._layerDefModel.layerModel);
    },
    'time-series': function () {
      var attrs = this._generateWidgetModelAttributes[this.get('type')].call(this);
      return this._dashboardWidgetsService.createTimeSeriesModel(attrs, this._layerDefModel.layerModel);
    }
  },

  _generateWidgetModelAttributes: {
    formula: function () {
      var o = this.get('options') || {};
      return this._attrsForWidgetModel({
        column: o.column,
        operation: o.operation || 'max',
        sync_on_data_change: _.isBoolean(o.sync_on_data_change) ? o.sync_on_data_change : true
      });
    },
    category: function () {
      var o = this.get('options') || {};
      return this._attrsForWidgetModel({
        column: o.column,
        aggregation: o.aggregation || 'count',
        aggregation_column: o.aggregation_column || o.column,
        sync_on_data_change: _.isBoolean(o.sync_on_data_change) ? o.sync_on_data_change : true
      });
    },
    histogram: function () {
      var o = this.get('options') || {};
      return this._attrsForWidgetModel({
        column: o.column,
        bins: o.bins || 10,
        sync_on_data_change: _.isBoolean(o.sync_on_data_change) ? o.sync_on_data_change : true
      });
    },
    'time-series': function () {
      var o = this.get('options') || {};
      return this._attrsForWidgetModel({
        column: o.column,
        sync_on_data_change: _.isBoolean(o.sync_on_data_change) ? o.sync_on_data_change : true,
        bins: o.bins || 256,
        start: o.start || 0,
        end: o.end || 0
      });
    }
  },

  _attrsForWidgetModel: function (customAttrs) {
    return _.extend({
      // Defaults
      id: this.id,
      title: this.get('title')
    }, customAttrs);
  },

  _onDestroy: function () {
    this.off('sync', this._onSync, this);
    this.off('destroy', this._onDestroy, this);
    this._removeWidgetModel();
  },

  _removeWidgetModel: function () {
    if (this.widgetModel) {
      this.widgetModel.remove();
      delete this.widgetModel;
    }
  }
});
