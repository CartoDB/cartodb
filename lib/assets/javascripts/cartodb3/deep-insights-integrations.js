var _ = require('underscore');
var linkLayerInfowindow = require('./deep-insights-integration/link-layer-infowindow');
var linkLayerTooltip = require('./deep-insights-integration/link-layer-tooltip');

/**
 * Integration between various data collections/models with cartodb.js and deep-insights.
 */
var F = function (opts) {
  if (!opts.deepInsightsDashboard) throw new Error('deepInsightsDashboard is required');
  if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
  if (!opts.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
  if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
  if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');

  this._diDashboard = opts.deepInsightsDashboard;
  this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
  this._analysisDefinitionsCollection = opts.analysisDefinitionsCollection;

  this._analysisDefinitionNodesCollection.on('add', this._analyseDefinitionNode, this);
  this._analysisDefinitionNodesCollection.on('change', this._analyseDefinitionNode, this);
  this._analysisDefinitionsCollection.on('add change:node_id sync', this._analyseDefinition, this);
  this._analysisDefinitionNodesCollection.on('remove', this._onAnalysisDefinitionNodeRemoved, this);

  opts.layerDefinitionsCollection.on('add', this._onLayerDefinitionAdded, this);
  opts.layerDefinitionsCollection.on('sync', this._onLayerDefinitionSynced, this);
  opts.layerDefinitionsCollection.on('change', this._onLayerDefinitionChanged, this);
  opts.layerDefinitionsCollection.on('remove', this._onLayerDefinitionRemoved, this);
  opts.layerDefinitionsCollection.on('layerMoved', this._onLayerDefinitionMoved, this);

  opts.widgetDefinitionsCollection.on('add', this._onWidgetDefinitionAdded, this);
  opts.widgetDefinitionsCollection.on('sync', this._onWidgetDefinitionSynced, this);
  opts.widgetDefinitionsCollection.on('change', this._onWidgetDefinitionChanged, this);
  opts.widgetDefinitionsCollection.on('destroy', this._onWidgetDefinitionDestroyed, this);
  opts.widgetDefinitionsCollection.on('add remove reset', this._invalidateSize, this);

  this._analysisDefinitionsCollection.each(this._analyseDefinition, this);
};

F.prototype._onAnalysisDefinitionNodeRemoved = function (m) {
  var node = this._analysis().findNodeById(m.id);
  if (node) {
    node.remove();
  }
};

F.prototype._analyseDefinition = function (m) {
  var id = m.get('node_id');
  var nodeDefModel = this._analysisDefinitionNodesCollection.get(id);
  this._analyseDefinitionNode(nodeDefModel);
};

F.prototype._analyseDefinitionNode = function (nodeDefModel) {
  var attrs = nodeDefModel.toJSON({skipOptions: true});
  this._analysis().analyse(attrs);

  // Unfortunately have to try to setup sync until this point, since a node doesn't exist until after analyse call
  this._analysisDefinitionNodesCollection.each(this._tryToSetupDefinitionNodeSync, this);
};

F.prototype._tryToSetupDefinitionNodeSync = function (m) {
  // Only setup syncing between node-definition and node sync once
  if (!m.__synced) {
    var node = this._analysis().findNodeById(m.id);
    if (node) {
      m.__synced = true;
      var updateAnalysisQuerySchema = function () {
        m.querySchemaModel.set({
          query: node.get('query'),
          may_have_rows: node.get('status') === 'ready'
        });
      };
      updateAnalysisQuerySchema();
      m.listenTo(node, 'change', updateAnalysisQuerySchema);
      m.listenToOnce(node, 'destroy', m.stopListening);
    }
  }
};

F.prototype._onWidgetDefinitionAdded = function (m) {
  var widgetModel = this._diDashboard.getWidget(m.id);
  if (widgetModel) {
    widgetModel.set('show_stats', true);
  }
};

F.prototype._onWidgetDefinitionSynced = function (m) {
  var widgetModel = this._diDashboard.getWidget(m.id);
  if (!widgetModel) {
    this._createWidgetModel(m);
  }
};

F.prototype._onWidgetDefinitionChanged = function (m) {
  var widgetModel = this._diDashboard.getWidget(m.id);

  // Only try to update if there's a corresponding widget model
  // E.g. the change of type will remove the model and provoke change events, which are not of interest (here),
  // since the widget model should be re-created for the new type anyway.
  if (widgetModel) {
    if (m.hasChanged('type')) {
      widgetModel.remove();
      this._createWidgetModel(m);
    } else {
      var attrs = this._formatWidgetAttrs(m.changedAttributes());
      widgetModel.update(attrs);
    }
  }
};

F.prototype._onWidgetDefinitionDestroyed = function (m) {
  var widgetModel = this._diDashboard.getWidget(m.id);

  if (widgetModel) {
    widgetModel.remove();
  }
};

F.prototype._createWidgetModel = function (m) {
  // e.g. 'time-series' => createTimeSeriesWidget
  var infix = m.get('type').replace(/(^\w|-\w)/g, function (match) {
    return match.toUpperCase().replace('-', '');
  });
  var methodName = 'create' + infix + 'Widget';

  var layerModel = this.visMap().getLayerById(m.get('layer_id'));
  var attrs = this._formatWidgetAttrs(m.attributes);

  var widgetModel = this._diDashboard[methodName](attrs, layerModel);

  if (widgetModel) {
    widgetModel.set('show_stats', true);
  }
};

/**
 * Massage some data points to the expected format of deep-insights API
 */
F.prototype._formatWidgetAttrs = function (attrs) {
  if (!_.has(attrs, 'source')) return attrs; // nothing to format

  var formattedAttrs = _.omit(attrs, 'source');
  formattedAttrs.source = {id: attrs.source};

  return formattedAttrs;
};

F.prototype._onLayerDefinitionAdded = function (m, c, opts) {
  // If added but not yet saved, postpone the creation until persisted (see sync listener)
  if (!m.isNew()) {
    if (!this._getLayer(m)) {
      this._createLayer(m);
    }
  }
};

F.prototype._onLayerDefinitionSynced = function (m) {
  if (!this._getLayer(m)) {
    this._createLayer(m);
  }
};

F.prototype._onLayerDefinitionChanged = function (m) {
  if (!m.isNew()) {
    var layer = this._getLayer(m);

    if (!layer) {
      this._createLayer(m);
      return;
    }

    var attrs = m.changedAttributes();
    if (attrs.type) {
      layer.remove();
      this._createLayer(m);
    } else {
      if (attrs.type) {
        layer.remove();
        this._createLayer(m);
      } else {
        layer.update(attrs);
      }
    }
  }
};

F.prototype._onLayerDefinitionRemoved = function (m) {
  if (!m.isNew()) {
    this._getLayer(m).remove();
  }
};

F.prototype._onLayerDefinitionMoved = function (m, at, c) {
  this.visMap().layers.remove(m, { silent: true });
  this._createLayer(m, {
    at: at
  });
};

var LAYER_TYPE_TO_LAYER_CREATE_METHOD;
F.prototype._createLayer = function (layerDefModel, opts) {
  opts = opts || {};
  var attrs = JSON.parse(JSON.stringify(layerDefModel.attributes)); // deep clone;

  if (attrs.source) {
    // Make sure to analysis is created first
    var nodeDefModel = this._analysisDefinitionNodesCollection.get(attrs.source);
    this._analyseDefinitionNode(nodeDefModel);
  }

  LAYER_TYPE_TO_LAYER_CREATE_METHOD = LAYER_TYPE_TO_LAYER_CREATE_METHOD || {
    'cartodb': 'createCartoDBLayer',
    'gmapsbase': 'createGMapsBaseLayer',
    'plain': 'createPlainLayer',
    'tiled': 'createTileLayer',
    'torque': 'createTorqueLayer',
    'wms': 'createWMSLayer'
  };
  var createMethodName = LAYER_TYPE_TO_LAYER_CREATE_METHOD[attrs.type.toLowerCase()];
  if (!createMethodName) throw new Error('no create method name found for type ' + attrs.type);

  var visMap = this.visMap();
  visMap[createMethodName](attrs, opts);

  linkLayerInfowindow(layerDefModel, visMap);
  linkLayerTooltip(layerDefModel, visMap);
};

F.prototype._getLayer = function (m) {
  return this.visMap().getLayerById(m.id);
};

F.prototype.visMap = function () {
  return this._vis().map;
};

F.prototype._analysis = function () {
  return this._vis().analysis;
};

F.prototype._vis = function () {
  return this._diDashboard.getMap();
};

F.prototype._invalidateSize = function () {
  this._vis().mapView.invalidateSize();
};

module.exports = F;
