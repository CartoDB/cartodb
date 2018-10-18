var _ = require('underscore');
var Backbone = require('backbone');
var WidgetDefinitionModel = require('./widget-definition-model');
var checkAndBuildOpts = require('builder/helpers/required-opts');

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

  model: function (attrs, opts) {
    var self = opts.collection;
    attrs.order = !_.isUndefined(attrs.order) ? attrs.order : 0;
    var model = new WidgetDefinitionModel(attrs, {
      parse: true, // make sure data is structured as expected
      collection: self,
      configModel: self._configModel,
      mapId: self._mapId
    });
    return model;
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
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v3/maps/' + this._mapId + '/widgets';
  },

  parse: function (response) {
    return response && response.widgets
      ? response.widgets
      : [];
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

  addWidget: function (widgetModel, attrs) {
    var self = this;
    var ORDER_NUMBER_TO_APPEAR_ON_TOP = -1;

    return new Promise(function (resolve, reject) {
      _.extend(attrs, { order: ORDER_NUMBER_TO_APPEAR_ON_TOP });

      self.create(attrs, {
        wait: true,
        success: function (model) {
          resolve(model);
        },
        error: function (response, error) {
          reject(error);
        }
      });
    });
  },

  updateWidgetsOrder: function (numberOfWidgets) {
    this.each(function (widgetDefinitionModel, index) {
      widgetDefinitionModel.set({ order: index });
    });

    return this.saveAsync(numberOfWidgets);
  },

  saveAsync: function (updatedWidgets) {
    var self = this;

    this.trigger('loading', updatedWidgets);

    return new Promise(function (resolve, reject) {
      self.save({
        wait: true,
        success: function (collection) {
          self.trigger('successAdd', updatedWidgets);
          resolve(collection);
        },
        error: function (response, error) {
          self.trigger('errorAdd', response);
          reject(error);
        }
      });
    });
  },

  save: function (options) {
    options = options || {};
    Backbone.sync('update', this, options);
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
