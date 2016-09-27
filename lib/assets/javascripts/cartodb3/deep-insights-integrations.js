var _ = require('underscore');
var linkLayerInfowindow = require('./deep-insights-integration/link-layer-infowindow');
var linkLayerTooltip = require('./deep-insights-integration/link-layer-tooltip');
var LegendManager = require('./deep-insights-integration/legend-manager');
var AnalysisNotifications = require('./analysis-notifications');
var WidgetsNotifications = require('./widgets-notifications');
var AnalysisOnboardingLauncher = require('./components/onboardings/analysis/analysis-launcher');
var VisNotifications = require('./vis-notifications');

/**
 * Integration between various data collections/models with cartodb.js and deep-insights.
 */
var F = function (opts) {
  if (!opts.deepInsightsDashboard) throw new Error('deepInsightsDashboard is required');
  if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
  if (!opts.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
  if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
  if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
  if (!opts.legendDefinitionsCollection) throw new Error('legendDefinitionsCollection is required');
  if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
  if (!opts.userModel) throw new Error('userModel is required');
  if (!opts.onboardings) throw new Error('onboardings is required');
  if (!opts.mapDefinitionModel) throw new Error('mapDefinitionModel is required');

  this._diDashboard = opts.deepInsightsDashboard;
  this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
  this._analysisDefinitionsCollection = opts.analysisDefinitionsCollection;
  this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
  this._visDefinitionModel = opts.visDefinitionModel;
  this._userModel = opts.userModel;
  this._mapDefinitionModel = opts.mapDefinitionModel;
  this._onboardings = opts.onboardings;

  this._layerDefinitionsCollection.each(this._linkLayerErrors, this);

  this._analysisDefinitionNodesCollection.on('add', this._analyseDefinitionNode, this);
  this._analysisDefinitionNodesCollection.on('change', this._analyseDefinitionNode, this);
  this._analysisDefinitionNodesCollection.on('remove', this._onAnalysisDefinitionNodeRemoved, this);
  this._analysisDefinitionsCollection.on('add change:node_id sync', this._analyseDefinition, this);

  opts.layerDefinitionsCollection.on('add', this._onLayerDefinitionAdded, this);
  opts.layerDefinitionsCollection.on('sync', this._onLayerDefinitionSynced, this);
  opts.layerDefinitionsCollection.on('change', this._onLayerDefinitionChanged, this);
  opts.layerDefinitionsCollection.on('remove', this._onLayerDefinitionRemoved, this);
  opts.layerDefinitionsCollection.on('layerMoved', this._onLayerDefinitionMoved, this);
  opts.layerDefinitionsCollection.on('change:cartocss', this._onLayerChangeCheckWidgetAutoStyling, this);

  opts.layerDefinitionsCollection.each(function (layerDefModel) {
    LegendManager.track(layerDefModel);
    linkLayerInfowindow(layerDefModel, this.visMap());
    linkLayerTooltip(layerDefModel, this.visMap());
    if (layerDefModel.has('source')) {
      this._resetStylesIfNoneApplied(layerDefModel);
    }
  }, this);

  opts.legendDefinitionsCollection.on('add', this._onLegendDefinitionAdded, this);
  opts.legendDefinitionsCollection.on('change', this._onLegendDefinitionChanged, this);
  opts.legendDefinitionsCollection.on('remove', this._onLegendDefinitionRemoved, this);

  opts.widgetDefinitionsCollection.on('add', this._onWidgetDefinitionAdded, this);
  opts.widgetDefinitionsCollection.on('sync', this._onWidgetDefinitionSynced, this);
  opts.widgetDefinitionsCollection.on('change', this._onWidgetDefinitionChanged, this);
  opts.widgetDefinitionsCollection.on('destroy', this._onWidgetDefinitionDestroyed, this);
  opts.widgetDefinitionsCollection.on('add remove reset', this._invalidateSize, this);

  opts.mapDefinitionModel.on('change:scrollwheel', this._onScrollWheelChanged, this);
  // it seems that cartodb.js doesn't activate the scroll wheel by default
  this._onScrollWheelChanged();

  this.widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
  WidgetsNotifications.track(this.widgetDefinitionsCollection);

  this._analysisDefinitionsCollection.each(this._analyseDefinition, this);
  this._vis().on('reload', this._visReload, this);
  this._vis().on('change:error', this._visErrorChange, this);

  VisNotifications.track(this._vis());
};

F.prototype._resetStylesIfNoneApplied = function (layerDefModel) {
  var nodeDefModel = layerDefModel.getAnalysisDefinitionNodeModel();
  var analysisCollection = this._analysis();
  var nodeModel = analysisCollection && analysisCollection.findNodeById(layerDefModel.get('source'));
  var isAnalysisNode = nodeModel && nodeModel.get('type') !== 'source';
  var isDone = nodeModel && nodeModel.isDone();
  var queryGeometryModel = nodeDefModel.queryGeometryModel;
  var styleModel = layerDefModel.styleModel;

  if (isAnalysisNode && styleModel.hasNoneStyles() && isDone) {
    var simpleGeom = queryGeometryModel.get('simple_geom');

    var applyDefaultStyles = function () {
      simpleGeom = queryGeometryModel.get('simple_geom');
      styleModel.setDefaultPropertiesByType('simple', simpleGeom);
    };

    if (!simpleGeom) {
      queryGeometryModel.once('change:simple_geom', applyDefaultStyles, this);
      queryGeometryModel.fetch();
    } else {
      applyDefaultStyles();
    }
  }
};

F.prototype._onAnalysisDefinitionNodeRemoved = function (m) {
  var node = this._analysis().findNodeById(m.id);
  if (node) {
    node.set({avoidNotification: !!m.get('avoidNotification')}, {silent: true});
    node.remove();
  }
};

F.prototype._visReload = function () {
  this._visDefinitionModel && this._visDefinitionModel.trigger('vis:reload');
  this._visDefinitionModel.recordChange();
};

F.prototype._visErrorChange = function () {
  this._visDefinitionModel && this._visDefinitionModel.trigger('vis:error', this._vis().get('error'));
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
  if (m.__syncSetup) return; // only setup once

  var node = this._analysis().findNodeById(m.id);
  if (!node) return; // might not exist when method is called, so do nothing to allow retries

  m.__syncSetup = true;

  // Don't need to sync source nodes
  if (node.get('type') !== 'source') {
    AnalysisNotifications.track(node);

    var updateAnalysisQuerySchema = function () {
      var query = node.get('query');
      m.querySchemaModel.set({query: query});
      m.queryGeometryModel.set({
        query: query,
        ready: node.get('status') === 'ready'
      });
    };

    AnalysisOnboardingLauncher.init({
      onboardings: this._onboardings,
      userModel: this._userModel
    });

    m.listenTo(node, 'change:status', function (model, status) {
      if (status === 'ready') {
        AnalysisOnboardingLauncher.launch(node.get('type'), model);
      }
    });

    updateAnalysisQuerySchema();

    m.listenTo(node, 'change', updateAnalysisQuerySchema);
    m.listenToOnce(node, 'destroy', m.stopListening);
  } else {
    m.listenTo(m.querySchemaModel, 'resetDueToAlteredData', this._invalidateMap.bind(this));
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

F.prototype._onLayerChangeCheckWidgetAutoStyling = function (model, style) {
  var self = this;
  var currentLayerId = model.get('id');
  var layer = this._getLayer(model);
  if (!layer || layer.get('type') === 'torque') return;
  layer.attributes.initialStyle = style;
  var widgetsToInvalidate = this.widgetDefinitionsCollection.where({'layer_id': currentLayerId});
  widgetsToInvalidate.forEach(function (widget) {
    var widgetModel = self._diDashboard.getWidget(widget.id);
    if (widgetModel && _.contains(['histogram', 'category'], widgetModel.get('type'))) {
      widgetModel.cancelAutoStyle();
    }
  });
  this._diDashboard._dashboard.vis._layersCollection.where({'id': currentLayerId})[0];
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

F.prototype._onLayerDefinitionChanged = function (m, changedAttributes) {
  var attrs = m.changedAttributes();
  var attrsNames = _.keys(attrs);

  // return if only the 'error' attribute has changed (no need to sync anything)
  if (attrsNames.length === 1 && attrsNames[0] === 'error') {
    return;
  }

  if (!m.isNew()) {
    var layer = this._getLayer(m);

    if (!layer) {
      this._createLayer(m);
      return;
    }

    if (attrs.type) {
      layer.remove();
      this._createLayer(m);
    } else {
      if (m.get('source') && !layer.get('source')) {
        attrs.source = m.get('source');
      }
      attrs = this._adaptAttrsToCDBjs(attrs);
      layer.update(attrs);
    }
    this._manageTimeSeriesForTorque(m);
  }
};

var CARTODBJS_TO_CARTODB_ATTRIBUTE_MAPPINGS = {
  'layer_name': ['table_name_alias', 'table_name']
};

F.prototype._adaptAttrsToCDBjs = function (attrs) {
  _.each(CARTODBJS_TO_CARTODB_ATTRIBUTE_MAPPINGS, function (cdbAttrs, cdbjsAttr) {
    _.each(cdbAttrs, function (cdbAttr) {
      attrs[cdbjsAttr] = attrs[cdbjsAttr] || attrs[cdbAttr];
    });
  });

  return attrs;
};

F.prototype._onLegendDefinitionAdded = function (m) {
  var layerDefModel = m.layerDefinitionModel;
  var layer = this._getLayer(layerDefModel);
  var type = m.get('type');
  var legend;
  if (layer && layer.legends) {
    legend = layer.legends[type];
    legend && legend.reset();
    legend && legend.set(m.getAttributes());
    legend && legend.show();
  }
};

F.prototype._onLegendDefinitionRemoved = function (m) {
  var layerDefModel = m.layerDefinitionModel;
  var layer = this._getLayer(layerDefModel);
  var type = m.get('type');
  var legend;
  if (layer && layer.legends) {
    legend = layer.legends[type];
    legend && legend.hide();
  }
};

F.prototype._onLegendDefinitionChanged = function (m) {
  var layerDefModel = m.layerDefinitionModel;
  var layer = this._getLayer(layerDefModel);
  var type = m.get('type');
  var legend;
  if (layer && layer.legends) {
    legend = layer.legends[type];
    legend && legend.set(m.getAttributes());
  }
};

F.prototype._manageTimeSeriesForTorque = function (m) {
  function recreateWidget (currentTimeseries, newLayer, animated) {
    var persistName = currentTimeseries && currentTimeseries.get('title');
    this._createTimeseries(newLayer, animated, persistName);
  }

  // not a cartodb layer
  if (!m.styleModel) return;
  var animatedChanged = m.styleModel.changedAttributes().animated;
  var attributeChanged;
  if (animatedChanged) attributeChanged = animatedChanged.attribute;
  var typeChanged = m.styleModel.changedAttributes().type;

  if (!typeChanged && !attributeChanged) return;

  var type = m.styleModel.get('type');
  var widgetModel = this._diDashboard.getWidgets().filter(function (m) {
    return m.get('type') === 'time-series';
  })[0];

  var currentTimeseries = this._getTimeseriesDefinition();
  var persistWidget = !!(currentTimeseries && currentTimeseries.get('title') !== 'time_date__t');
  var newLayer = this._getLayer(m);

  if (type !== 'animation' && this._lastType !== type) {
    if (widgetModel) {
      this._removeTimeseries();
    }

    if (persistWidget) {
      recreateWidget.call(this, currentTimeseries, newLayer, animatedChanged);
    }
    this._lastType = type;
    this._lastTSAnimateChange = '';
  }

  if (type === 'animation' && (this._lastTSAnimateChange !== attributeChanged || this._lastType !== 'animation')) {
    if (widgetModel) {
      this._removeTimeseries();
    }

    if (newLayer.get('type') === 'torque' || m.get('type') === 'torque' || persistWidget) {
      recreateWidget.call(this, currentTimeseries, newLayer, animatedChanged);
    }

    this._lastType = type;
    this._lastTSAnimateChange = attributeChanged;
  }
};

F.prototype._removeTimeseries = function () {
  this.widgetDefinitionsCollection.models.forEach(function (def) {
    if (def.get('type') === 'time-series') {
      def.set({avoidNotification: true}, {silent: true});
      def.destroy();
    }
  });
};

F.prototype._getTimeseriesDefinition = function () {
  return this.widgetDefinitionsCollection.where({type: 'time-series'})[0];
};

F.prototype._createTimeseries = function (newLayer, animatedChanged, persist) {
  this._removeTimeseries();
  if (animatedChanged.attribute) {
    var baseAttrs = {
      type: 'time-series',
      layer_id: newLayer.get('id'),
      source: {
        id: newLayer.get('source')
      },
      options: {
        column: animatedChanged.attribute,
        title: persist || 'time_date__t',
        bins: 256
      }
    };
    this.widgetDefinitionsCollection.create(baseAttrs);
  }
};

F.prototype._onLayerDefinitionRemoved = function (m) {
  if (!m.isNew()) {
    var layer = this._getLayer(m);
    layer && layer.remove();
  }
};

F.prototype._onLayerDefinitionMoved = function (m) {
  this.visMap().layers.remove(m, { silent: true });
  this._createLayer(m);
};

var LAYER_TYPE_TO_LAYER_CREATE_METHOD = {
  'cartodb': 'createCartoDBLayer',
  'gmapsbase': 'createGMapsBaseLayer',
  'plain': 'createPlainLayer',
  'tiled': 'createTileLayer',
  'torque': 'createTorqueLayer',
  'wms': 'createWMSLayer'
};

F.prototype._createLayer = function (layerDefModel) {
  var attrs = JSON.parse(JSON.stringify(layerDefModel.attributes)); // deep clone
  attrs = this._adaptAttrsToCDBjs(attrs);

  var createMethodName = LAYER_TYPE_TO_LAYER_CREATE_METHOD[attrs.type.toLowerCase()];
  if (!createMethodName) throw new Error('no create method name found for type ' + attrs.type);

  if (attrs.source) {
    // Make sure the analysis is created first
    var nodeDefModel = this._analysisDefinitionNodesCollection.get(attrs.source);
    this._analyseDefinitionNode(nodeDefModel);
  }

  var visMap = this.visMap();
  var layerPosition = this._layerDefinitionsCollection.indexOf(layerDefModel);
  visMap[createMethodName](attrs, {
    at: layerPosition
  });

  linkLayerInfowindow(layerDefModel, visMap);
  linkLayerTooltip(layerDefModel, visMap);
  LegendManager.track(layerDefModel);

  this._linkLayerErrors(layerDefModel);
};

F.prototype._linkLayerErrors = function (m) {
  var layer = this._getLayer(m);
  if (layer) {
    if (layer.get('error')) {
      this._setLayerError(m, layer.get('error'));
    }
    layer.on('change:error', function (model, cdbError) {
      this._setLayerError(m, cdbError);
    }, this);
  }
};

F.prototype._setLayerError = function (layerDefinitionModel, cdbError) {
  if (!cdbError) {
    layerDefinitionModel.unset('error');
    return;
  }
  if (cdbError.type === 'turbo-carto') {
    var line;
    try {
      line = cdbError.context.source.start.line;
    } catch (error) {}
    layerDefinitionModel.set('error', {
      type: cdbError.type,
      line: line,
      message: cdbError.message
    });
  }
};

F.prototype._onScrollWheelChanged = function () {
  var scrollwheel = this._mapDefinitionModel.get('scrollwheel');
  var method = scrollwheel ? 'enableScrollWheel' : 'disableScrollWheel';
  var map = this.visMap();
  map && map[method] && map[method]();
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
  this._vis().invalidateSize();
};

F.prototype._invalidateMap = function () {
  this._vis().instantiateMap();
};

module.exports = F;
