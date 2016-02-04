var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');

/**
 * Widget definition Model
 */
module.exports = cdb.core.Model.extend({

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
        operation: o.operation
      });
    },
    category: function () {
      var o = this.get('options') || {};
      return this._attrsForWidgetModel({
        column: o.column,
        aggregation: o.aggregation,
        aggregationColumn: o.aggregationColumn
      });
    },
    histogram: function () {
      var o = this.get('options') || {};
      return this._attrsForWidgetModel({
        column: o.column,
        bins: o.bins
      });
    },
    'time-series': function () {
      var o = this.get('options') || {};
      return this._attrsForWidgetModel({
        column: o.column
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

  initialize: function (attrs, options) {
    if (!options.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!options.dashboardWidgetsService) throw new Error('dashboardWidgetsService is required');

    this._layerDefModel = options && options.layerDefinitionModel;
    this._widgetModel = options && options.widgetModel;
    this._dashboardWidgetsService = options && options.dashboardWidgetsService;

    this.sync = _.debounce(this.sync, 300);

    this.on('sync', this._onSync, this);
    this.on('destroy', this._onDestroy, this);
    this.on('change', this._onChange, this);
  },

  url: function () {
    var url = this._layerDefModel.url() + '/widgets';
    return this.isNew()
      ? url
      : url + '/' + this.id;
  },

  toJSON: function () {
    return {
      id: this.get('id'),
      type: this.get('type'),
      title: this.get('title'),
      layer_id: this._layerDefModel.id,
      options: this.get('options') || {}
    };
  },

  _onSync: function () {
    if (!this._widgetModel) {
      // No model yet; this was a new widget definition, so create the actual widget model
      // TODO error handling, for now let errors bubble up
      this._widgetModel = this._createWidgetModelMap[this.get('type')].call(this);
    }
  },

  _onChange: function () {
    if (this.changed.type) {
      var attrs = this._generateWidgetModelAttributes[this.get('type')].call(this);
      this.attributes.options = _.omit(attrs, ['id', 'layer_id', 'title', 'type']);
    }
  },

  _onDestroy: function () {
    if (this._widgetModel) {
      this._widgetModel.remove();
    }
  }

});
