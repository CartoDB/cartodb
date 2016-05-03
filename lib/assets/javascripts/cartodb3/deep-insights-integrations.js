/**
 * Integration between various data collections/models with cartodb.js and deep-insights.
 */
var F = function (opts) {
  if (!opts.deepInsightsDashboard) throw new Error('deepInsightsDashboard is required');
  if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
  if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');

  this._diDashboard = opts.deepInsightsDashboard;

  opts.layerDefinitionsCollection.on('add', this._onLayerDefinitionAdded, this);
  opts.layerDefinitionsCollection.on('sync', this._onLayerDefinitionSynced, this);
  opts.layerDefinitionsCollection.on('change', this._onLayerDefinitionChanged, this);
  opts.layerDefinitionsCollection.on('remove', this._onLayerDefinitionRemoved, this);

  opts.widgetDefinitionsCollection.on('add', this._onWidgetDefinitionAdded, this);
  opts.widgetDefinitionsCollection.on('sync', this._onWidgetDefinitionSynced, this);
  opts.widgetDefinitionsCollection.on('change', this._onWidgetDefinitionChanged, this);
  opts.widgetDefinitionsCollection.on('destroy', this._onWidgetDefinitionDestroyed, this);
  opts.widgetDefinitionsCollection.on('add remove reset', this._invalidateSize, this);
};

F.prototype.visMap = function () {
  return this._diDashboard.getMap().map;
};

F.prototype._invalidateSize = function () {
  this._diDashboard.getMap().mapView.invalidateSize();
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

module.exports = F;
