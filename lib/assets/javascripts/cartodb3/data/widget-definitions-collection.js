var Backbone = require('backbone');
var WidgetDefinitionModel = require('./widget-definition-model');

/**
 * Collection of widget definitions, synhronizes the internal definitions and the widget models.
 */
module.exports = Backbone.Collection.extend({

  comparator: 'order',

  model: function (d, opts) {
    var self = opts.collection;
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
    if (!options.layersCollection) throw new Error('layersCollection is required');
    if (!options.dashboardWidgets) throw new Error('dashboardWidgets is required');
    if (!options.mapId) throw new Error('mapId is required');

    this._configModel = options.configModel;
    this._layersCollection = options.layersCollection;
    this._dashboardWidgets = options.dashboardWidgets;
    this._mapId = options.mapId;

    this._typesMap = {
      formula: {
        widgetModelCreateMethod: 'createFormulaModel',
        attrsForThisType: function (m) {
          return {
            column: m.get('column'),
            operation: m.get('operation') || 'max'
          };
        }
      },
      category: {
        widgetModelCreateMethod: 'createCategoryModel',
        attrsForThisType: function (m) {
          var columnName = m.get('column');
          return {
            aggregation: m.get('aggregation') || 'count',
            aggregation_column: m.get('aggregation_column') || columnName,
            column: columnName
          };
        }
      },
      histogram: {
        widgetModelCreateMethod: 'createHistogramModel',
        attrsForThisType: function (m) {
          return {
            column: m.get('column'),
            bins: m.get('bins') || 10
          };
        }
      },
      'time-series': {
        widgetModelCreateMethod: 'createTimeSeriesModel',
        attrsForThisType: function (m) {
          return {
            column: m.get('column'),
            bins: m.get('bins') || 256
          };
        }
      }
    };

    this.on('add', this._onAdd, this);
    this.on('sync', this._onSync, this);
    this.on('change', this._onChange, this);
    this.on('destroy', this._onDestroy, this);
  },

  url: function () {
    throw new Error('Not possible, see WidgetDefinitionModel.urlRoot');
  },

  attrsForThisType: function (newType, m) {
    return this._typesMap[newType].attrsForThisType(m);
  },

  create: function (attrs, opts) {
    attrs.order = this._getNextOrder();
    Backbone.Collection.prototype.create.call(this, attrs, opts);
  },

  _onSync: function (m) {
    var widgetModel = this._dashboardWidgets.get(m.id);

    if (!widgetModel) {
      this._createWidgetModel(m);
    }
  },

  _onChange: function (m) {
    var widgetModel = this._dashboardWidgets.get(m.id);

    // Only try to update if there's a corresponding widget model
    // E.g. the change of type will remove the model and provoke change events, which are not of interest (here),
    // since the widget model should be re-created for the new type anyway.
    if (widgetModel) {
      if (m.hasChanged('type')) {
        widgetModel.remove();
        this._createWidgetModel(m);
      } else if (m.hasChanged('order')) {
        widgetModel.set('order', m.get('order'));
      } else {
        widgetModel.update(m.changedAttributes());
      }
    }
  },

  _createWidgetModel: function (m) {
    var layerId = m.get('layer_id');
    var layerModel = this._layersCollection.get(layerId);
    var methodName = this._typesMap[m.get('type')].widgetModelCreateMethod;

    var widgetModel = this._dashboardWidgets[methodName](m.attributes, layerModel);
    if (widgetModel) {
      widgetModel.set('show_stats', true);
    }
  },

  _onAdd: function (mdl) {
    var widgetModel = this._dashboardWidgets.get(mdl.id);
    if (widgetModel) {
      widgetModel.set('show_stats', true);
    }
  },

  _onDestroy: function (m) {
    var widgetModel = this._dashboardWidgets.get(m.id);

    if (widgetModel) {
      widgetModel.remove();
    }
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
  }

});
