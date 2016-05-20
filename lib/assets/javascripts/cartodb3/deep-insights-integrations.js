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

  this._analysisDefinitionNodesCollection.on('remove', this._onAnalysisDefinitionNodeRemoved, this);
  this._analysisDefinitionNodesCollection.on('change', this._onAnalysisDefinitionNodeChanged, this);

  this._analysisDefinitionsCollection.on('add change:node_id sync', this._analyseDefinition, this);

  opts.layerDefinitionsCollection.on('add', this._onLayerDefinitionAdded, this);
  opts.layerDefinitionsCollection.on('sync', this._onLayerDefinitionSynced, this);
  opts.layerDefinitionsCollection.on('change', this._onLayerDefinitionChanged, this);
  opts.layerDefinitionsCollection.on('remove', this._onLayerDefinitionRemoved, this);

  opts.widgetDefinitionsCollection.on('add', this._onWidgetDefinitionAdded, this);
  opts.widgetDefinitionsCollection.on('sync', this._onWidgetDefinitionSynced, this);
  opts.widgetDefinitionsCollection.on('change', this._onWidgetDefinitionChanged, this);
  opts.widgetDefinitionsCollection.on('destroy', this._onWidgetDefinitionDestroyed, this);
  opts.widgetDefinitionsCollection.on('add remove reset', this._invalidateSize, this);

  this._analysisDefinitionsCollection.each(this._analyseDefinition, this);
};

F.prototype._onAnalysisDefinitionNodeChanged = function () {
  this._analysisDefinitionsCollection.each(function (m) {
    m.save();
    this._analyseDefinition(m);
  }, this);
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
      widgetModel.update(m.changedAttributes());
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

  var layerId = m.get('layer_id');
  var layerModel = this.visMap().getLayerById(layerId);

  var widgetModel = this._diDashboard[methodName](m.attributes, layerModel);
  if (widgetModel) {
    widgetModel.set('show_stats', true);
  }
};

F.prototype._onLayerDefinitionAdded = function (m) {
  // If added but not yet saved, postpone the creation until persisted (see sync listener)
  if (!m.isNew() && !this._getLayer(m)) {
    this._createLayer(m);
  }
};

F.prototype._onLayerDefinitionSynced = function (m) {
  if (!this._getLayer(m)) {
    this._createLayer(m);
  }
};

F.prototype._onLayerDefinitionChanged = function (m) {
  var attrs = m.changedAttributes();
  var layer = this._getLayer(m);

  if (!m.isNew()) {
    if (attrs.type) {
      layer.remove();
      this._createLayer(m);
    } else {
      layer.update(attrs);
    }
  }
};

F.prototype._onLayerDefinitionRemoved = function (m) {
  if (!m.isNew()) {
    this._getLayer(m).remove();
  }
};

var LAYER_TYPE_TO_LAYER_CREATE_METHOD;
F.prototype._createLayer = function (m) {
  var attrs = JSON.parse(JSON.stringify(m.attributes)); // deep clone;
  delete attrs.source; // a new layer should not have an analyse to begin with, even if we have it in the context of editor

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

  this.visMap()[createMethodName](attrs);
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
