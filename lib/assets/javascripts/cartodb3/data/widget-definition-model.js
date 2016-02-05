var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var WidgetsFormFactory = require('../widgets-form/widgets-form-factory');

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

    this._generateFormModel();

    this.sync = _.debounce(this.sync, 300);

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
        sync: o.sync || true
      });
    },
    category: function () {
      var o = this.get('options') || {};
      return this._attrsForWidgetModel({
        column: o.column,
        aggregation: o.aggregation || 'sum',
        aggregationColumn: o.aggregationColumn || o.column,
        sync: o.sync || true
      });
    },
    histogram: function () {
      var o = this.get('options') || {};
      return this._attrsForWidgetModel({
        column: o.column,
        bins: o.bins || 10,
        sync: o.sync || true
      });
    },
    'time-series': function () {
      var o = this.get('options') || {};
      return this._attrsForWidgetModel({
        column: o.column,
        sync: o.sync || true,
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

  _onChangeFormModel: function () {
    if (this._formModel.changed.type) {
      this._onChangeType();
    } else {
      this.save({
        layer_id: this._formModel.get('layer_id'),
        title: this._formModel.get('title'),
        options: _.omit(this._formModel.attributes, ['id', 'layer_id', 'title'])
      });
    }
  },

  _onChangeType: function () {
    var newWidgetType = this._formModel.get('type');
    var newWidgetAttrs = this._generateWidgetModelAttributes[newWidgetType].call(this);
    this.attributes.options = _.omit(newWidgetAttrs, ['id', 'layer_id', 'title', 'type']);
    this.attributes.type = newWidgetType;
    this._generateFormModel();
    this._removeWidgetModel();
    this.trigger('change:type', this);
    this.save();
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

  _generateFormModel: function () {
    if (this._formModel) {
      this._formModel.unbind('change', this._onChangeFormModel, this);
    }
    this._formModel = WidgetsFormFactory.createWidgetFormModel(this.toJSON());
    this._formModel.bind('change', this._onChangeFormModel, this);
  },

  getFormModel: function () {
    return this._formModel;
  }

});
