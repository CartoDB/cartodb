var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');
var rootAttrs = ['type', 'layer_id', 'order', 'title'];

/**
 * Widget definition Model
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, options) {
    if (!options.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!options.dashboardWidgetsService) throw new Error('dashboardWidgetsService is required');

    this._layerDefModel = options && options.layerDefinitionModel;
    this._widgetModel = options && options.widgetModel;
    this._dashboardWidgetsService = options && options.dashboardWidgetsService;

    this.sync = _.debounce(this.sync, 500);
    this.on('sync', this._onSync, this);
    this.on('destroy', this._onDestroy, this);
  },

  urlRoot: function () {
    return this._layerDefModel.url() + '/widgets';
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

  _onSync: function (mdl) {
    // No model yet; this was a new widget definition, so create the actual widget model
    // TODO error handling, for now let errors bubble up
    this._generateWidgetModel();
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
        syncData: o.sync || true
      });
    },
    category: function () {
      var o = this.get('options') || {};
      return this._attrsForWidgetModel({
        column: o.column,
        aggregation: o.aggregation || 'count',
        aggregationColumn: o.aggregationColumn || o.column,
        syncData: o.sync || true
      });
    },
    histogram: function () {
      var o = this.get('options') || {};
      return this._attrsForWidgetModel({
        column: o.column,
        bins: o.bins || 10,
        syncData: o.sync || true
      });
    },
    'time-series': function () {
      var o = this.get('options') || {};
      return this._attrsForWidgetModel({
        column: o.column,
        syncData: o.sync || true,
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

  _generateWidgetModel: function () {
    if (!this._widgetModel) {
      this._widgetModel = this._createWidgetModelMap[this.get('type')].call(this);
    }
  },

  _removeWidgetModel: function () {
    if (this._widgetModel) {
      this._widgetModel.remove();
      delete this._widgetModel;
    }
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

  saveAttributes: function (changed) {
    _.each(changed, function (value, key) {
      if (_.contains(rootAttrs, key)) {
        this.attributes[key] = value;
      } else {
        this.attributes.options[key] = value;
      }
    }, this);
    this.save();
    this._widgetModel.update(changed);
  },

  _flattenAttributes: function (attrs) {
    return _.extend(_.omit(attrs, 'options'), attrs.options);
  }

});
