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
    if (!options.visMap) throw new Error('visMap is required');
    if (!options.dashboard) throw new Error('dashboard is required');
    if (!options.mapId) throw new Error('mapId is required');
    if (!options.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this._configModel = options.configModel;
    this._visMap = options.visMap;
    this._dashboard = options.dashboard;
    this._mapId = options.mapId;
    this._layerDefinitionsCollection = options.layerDefinitionsCollection;

    this._typesMap = {
      formula: {
        widgetModelCreateMethod: 'createFormulaWidget',
        attrsForThisType: function (m) {
          return {
            column: m.get('column'),
            operation: m.get('operation') || 'max'
          };
        }
      },
      category: {
        widgetModelCreateMethod: 'createCategoryWidget',
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
        widgetModelCreateMethod: 'createHistogramWidget',
        attrsForThisType: function (m) {
          return {
            column: m.get('column'),
            bins: m.get('bins') || 10
          };
        }
      },
      'time-series': {
        widgetModelCreateMethod: 'createTimeSeriesWidget',
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

  _onSync: function (m) {
    var widgetModel = this._dashboard.getWidget(m.id);

    if (!widgetModel) {
      this._createWidgetModel(m);
    }

    var layerDefinitionModel = this._layerDefinitionsCollection.get(m.get('layer_id'));
    if (layerDefinitionModel) {
      layerDefinitionModel.save(); // to persist source if not already saved
    }
  },

  _onChange: function (m) {
    var widgetModel = this._dashboard.getWidget(m.id);

    // Only try to update if there's a corresponding widget model
    // E.g. the change of type will remove the model and provoke change events, which are not of interest (here),
    // since the widget model should be re-created for the new type anyway.
    if (widgetModel) {
      if (m.hasChanged('type')) {
        widgetModel.remove();
        this._createWidgetModel(m);
      } else {
        widgetModel.update(m.changedAttributes());
      }
    }
  },

  _createWidgetModel: function (m) {
    var layerId = m.get('layer_id');
    var layerModel = this._visMap.getLayerById(layerId);
    var methodName = this._typesMap[m.get('type')].widgetModelCreateMethod;

    var widgetModel = this._dashboard[methodName](m.attributes, layerModel);
    if (widgetModel) {
      widgetModel.set('show_stats', true);
    }
  },

  _onAdd: function (mdl) {
    var widgetModel = this._dashboard.getWidget(mdl.id);
    if (widgetModel) {
      widgetModel.set('show_stats', true);
    }
  },

  _onDestroy: function (m) {
    var widgetModel = this._dashboard.getWidget(m.id);

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
