var _ = require('underscore');
var $ = require('jquery');
var linkLayerInfowindow = require('./deep-insights-integration/link-layer-infowindow');
var linkLayerTooltip = require('./deep-insights-integration/link-layer-tooltip');
var LegendManager = require('./deep-insights-integration/legend-manager');
var AnalysisNotifications = require('./editor/layers/analysis-views/analysis-notifications');
var WidgetsNotifications = require('./widgets-notifications');
var AnalysisOnboardingLauncher = require('./components/onboardings/analysis/analysis-launcher');
var NotificationErrorMessageHandler = require('./editor/layers/notification-error-message-handler');
var VisNotifications = require('./vis-notifications');
var FeatureDefinitionModel = require('./data/feature-definition-model');
var Notifier = require('./components/notifier/notifier');

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
  if (!opts.stateDefinitionModel) throw new Error('stateDefinitionModel is required');
  if (!opts.overlayDefinitionsCollection) throw new Error('overlayDefinitionsCollection is required');
  if (!opts.mapModeModel) throw new Error('mapModeModel is required');
  if (!opts.configModel) throw new Error('configModel is required');
  if (!opts.editorModel) throw new Error('editorModel is required');
  if (!opts.editFeatureOverlay) throw new Error('editFeatureOverlay is required');

  this._diDashboard = opts.deepInsightsDashboard;
  this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
  this._analysisDefinitionsCollection = opts.analysisDefinitionsCollection;
  this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
  this._visDefinitionModel = opts.visDefinitionModel;
  this._stateDefinitionModel = opts.stateDefinitionModel;
  this._userModel = opts.userModel;
  this._mapDefinitionModel = opts.mapDefinitionModel;
  this._onboardings = opts.onboardings;
  this._overlayDefinitionsCollection = opts.overlayDefinitionsCollection;
  this._mapModeModel = opts.mapModeModel;
  this._configModel = opts.configModel;
  this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
  this._editorModel = opts.editorModel;
  this._editFeatureOverlay = opts.editFeatureOverlay;

  this._layerDefinitionsCollection.each(this._linkLayerErrors, this);

  this._analysisDefinitionNodesCollection.on('add', this._analyseDefinitionNode, this);
  this._analysisDefinitionNodesCollection.on('change', this._analyseDefinitionNode, this);
  this._analysisDefinitionNodesCollection.on('change:id', this._onAnalysisDefinitionNodeIdChanged, this);
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

  opts.overlayDefinitionsCollection.on('add', this._onOverlayDefinitionAdded, this);
  opts.overlayDefinitionsCollection.on('remove', this._onOverlayDefinitionRemoved, this);

  opts.mapDefinitionModel.on('change:minZoom change:maxZoom', _.debounce(this._onMinMaxZoomChanged.bind(this), 300), this);
  opts.mapDefinitionModel.on('change:scrollwheel', this._onScrollWheelChanged, this);
  opts.mapDefinitionModel.on('change:legends', this._onLegendsChanged, this);
  opts.mapDefinitionModel.on('change:layer_selector', this._onLayerSelectorChanged, this);
  // it seems that cartodb.js doesn't activate the scroll wheel by default
  this._onScrollWheelChanged();

  WidgetsNotifications.track(this._widgetDefinitionsCollection);

  opts.editorModel.on('change:settingsView', this._onEditorSettingsChanged, this);

  this._analysisDefinitionsCollection.each(this._analyseDefinition, this);
  this._vis().on('reload', this._visReload, this);
  this._vis().on('change:error', this._visErrorChange, this);

  var saveStateDefinition = this._saveStateDefinition.bind(this);
  this._diDashboard._dashboard.widgets._widgetsCollection.bind('change', _.debounce(saveStateDefinition, 500), this);
  this.visMap().on('change', _.debounce(saveStateDefinition, 500), this);

  this._stateDefinitionModel.on('boundsSet', this._onBoundsSet, this);

  // In order to sync layer selector and layer visbility
  this._getLayers().on('change:visible', function (layer, visible) {
    var layerDefModel = opts.layerDefinitionsCollection.findWhere({id: layer.id});
    if (layerDefModel) {
      if (layerDefModel.get('visible') !== visible) {
        layerDefModel.save({visible: visible});
      }
    }
  }, this);

  VisNotifications.track(this._vis());

  opts.mapModeModel.on('change:mode', this._onMapModeChanged, this);

  this.visMap().on('featureClick', this._onFeatureClicked, this);
};

F.prototype._onFeatureClicked = function (event) {
  var layerId = event.layer.id;
  var featureId = event.feature.cartodb_id;
  var position = event.position;
  var layerDefinitionModel = this._layerDefinitionsCollection.get(layerId);

  var featureDefinition = new FeatureDefinitionModel({
    cartodb_id: featureId
  }, {
    configModel: this._configModel,
    layerDefinitionModel: layerDefinitionModel
  });

  if (featureDefinition.isEditable()) {
    var isFeatureBeingEdited = false;
    if (this._mapModeModel.isEditingFeatureMode()) {
      var editingFeatureDefinitionModel = this._mapModeModel.getFeatureDefinition();
      isFeatureBeingEdited = featureDefinition.isEqual(editingFeatureDefinitionModel);
    }

    if (!isFeatureBeingEdited) {
      this._editFeatureOverlay.setPosition(position);
      this._editFeatureOverlay.setFeatureDefinition(featureDefinition);
      this._editFeatureOverlay.show();
    }
  }
};

F.prototype._onMapModeChanged = function (mapModeModel) {
  var map = this.visMap();
  var featureDefinition;
  var geometry;

  // VIEWING MODE
  if (mapModeModel.isViewingMode()) {
    map.stopDrawingGeometry();
    map.stopEditingGeometry();
  }

  // DRAWING FEATURES
  if (mapModeModel.isDrawingFeatureMode()) {
    featureDefinition = mapModeModel.getFeatureDefinition();
    if (featureDefinition.isPoint()) {
      geometry = map.drawPoint();
    } else if (featureDefinition.isLine()) {
      geometry = map.drawPolyline();
    } else if (featureDefinition.isPolygon()) {
      geometry = map.drawPolygon();
    }

    if (!geometry) {
      throw new Error("couldn't get geometry for feature of type " + featureDefinition.get('type'));
    }
  }

  // EDITING FEATURES
  if (mapModeModel.isEditingFeatureMode()) {
    featureDefinition = mapModeModel.getFeatureDefinition();
    var geojson = JSON.parse(featureDefinition.get('the_geom'));
    geometry = map.editGeometry(geojson);
  }

  if (featureDefinition && geometry) {
    this._bindGeometryToFeatureDefinition(geometry, featureDefinition);
    featureDefinition.on('save', function () {
      if (featureDefinition.hasChanged('the_geom') || featureDefinition.hasChanged('cartodb_id')) {
        this._invalidateMap();
        geometry.setCoordinatesFromGeoJSON(JSON.parse(featureDefinition.get('the_geom')));
      }
    }, this);
    featureDefinition.on('remove', function () {
      this._invalidateMap();
    }, this);
  }
};

F.prototype._bindGeometryToFeatureDefinition = function (geometry, featureDefinition) {
  geometry.on('change', function () {
    if (geometry.isComplete()) {
      $('.js-editOverlay').fadeOut(200, function () {
        $('.js-editOverlay').remove();
      });

      var geojson = geometry.toGeoJSON();
      geojson = geojson.geometry || geojson;
      featureDefinition.set({
        the_geom: JSON.stringify(geojson)
      });
      featureDefinition.trigger('updateFeature');
    }
  });
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

F.prototype._analyseDefinitionNode = function (m) {
  if (!this._hasUpdateOnlyNodeAnalysisId(m)) {
    var attrs = m.toJSON({skipOptions: true});
    this._analysis().analyse(attrs);

    // Unfortunately have to try to setup sync until this point, since a node doesn't exist until after analyse call
    this._analysisDefinitionNodesCollection.each(this._tryToSetupDefinitionNodeSync, this);
  }
};

F.prototype._onAnalysisDefinitionNodeIdChanged = function (m, changedAttributes) {
  if (this._hasUpdateOnlyNodeAnalysisId(m)) {
    var node = this._analysis().findNodeById(m.previous('id'));
    node && node.set('id', m.id);
  }
};

F.prototype._onAnalysisDefinitionNodeRemoved = function (m) {
  var node = this._analysis().findNodeById(m.id);
  if (node) {
    node.set({avoidNotification: (m && !!m.get('avoidNotification'))}, {silent: true});
    node.remove();
  }
};

F.prototype._hasUpdateOnlyNodeAnalysisId = function (nodeDefModel) {
  return nodeDefModel.hasChanged('id') && _.size(nodeDefModel.changed) === 1;
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
      var status = node.get('status');
      var error = node.get('error');

      m.querySchemaModel.set({
        query: query,
        ready: status === 'ready'
      });
      m.queryGeometryModel.set({
        query: query,
        ready: status === 'ready'
      });
      m.set({ status: status, error: error });
    };

    AnalysisOnboardingLauncher.init({
      onboardings: this._onboardings,
      userModel: this._userModel
    });

    m.listenTo(node, 'change:status', function (model, status) {
      m.set('status', status);

      if (status === 'ready' && m.USER_SAVED) {
        AnalysisOnboardingLauncher.launch(node.get('type'), model);
        m.USER_SAVED = false;
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
  var widgetsToInvalidate = this._widgetDefinitionsCollection.where({'layer_id': currentLayerId});
  widgetsToInvalidate.forEach(function (widget) {
    var widgetModel = self._diDashboard.getWidget(widget.id);
    if (widgetModel && _.contains(['histogram', 'category'], widgetModel.get('type')) && widgetModel.get('autoStyle')) {
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
      if (attrs[cdbAttr] && !attrs[cdbjsAttr]) {
        attrs[cdbjsAttr] = attrs[cdbAttr];
      }
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
    if (legend) {
      legend.reset();
      legend.set(m.getAttributes());
      legend.show();
    }
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
    if (legend) {
      legend.reset();
      legend.set(m.getAttributes());
    }
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
  var animatedAttribute = m.styleModel.get('animated') && m.styleModel.get('animated').attribute;
  var previousType = m.styleModel.previous('type');

  if (!typeChanged && !attributeChanged) return;

  var type = m.styleModel.get('type');
  var widgetModel = this._diDashboard.getWidgets().filter(function (m) {
    return m.get('type') === 'time-series';
  })[0];

  var currentTimeseries = this._getTimeseriesDefinition();
  var persistWidget = !!(currentTimeseries && currentTimeseries.get('title') !== 'time_date__t');
  var newLayer = this._getLayer(m);

  if (type !== 'animation' && previousType === 'animation' && this._lastType !== type) {
    if (widgetModel) {
      this._removeTimeseries();
    }

    if (persistWidget) {
      recreateWidget.call(this, currentTimeseries, newLayer, _.extend({ animated: false }, animatedChanged, { attribute: animatedAttribute }));
    }
    this._lastType = type;
    this._lastTSAnimateChange = '';
  }

  if (type === 'animation' && (this._lastTSAnimateChange !== attributeChanged || this._lastType !== 'animation')) {
    if (widgetModel) {
      this._removeTimeseries();
    }

    if (newLayer.get('type') === 'torque' || m.get('type') === 'torque' || persistWidget) {
      recreateWidget.call(this, currentTimeseries, newLayer, _.extend({ animated: true }, animatedChanged, { attribute: animatedAttribute }));
    }

    this._lastType = type;
    this._lastTSAnimateChange = attributeChanged;
  }
};

F.prototype._removeTimeseries = function () {
  this._widgetDefinitionsCollection.models.forEach(function (def) {
    if (def.get('type') === 'time-series') {
      def.set({avoidNotification: true}, {silent: true});
      def.destroy();
    }
  });
};

F.prototype._getTimeseriesDefinition = function () {
  return this._widgetDefinitionsCollection.where({type: 'time-series'})[0];
};

F.prototype._createTimeseries = function (newLayer, animatedChanged, persist) {
  this._removeTimeseries();
  var attribute = animatedChanged && animatedChanged.attribute || '';
  var animated = animatedChanged && animatedChanged.animated;
  if (attribute) {
    var baseAttrs = {
      type: 'time-series',
      layer_id: newLayer.get('id'),
      source: {
        id: newLayer.get('source')
      },
      options: {
        column: attribute,
        title: persist || 'time_date__t',
        bins: 256,
        animated: animated
      }
    };
    this._widgetDefinitionsCollection.create(baseAttrs);
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
  var notification = Notifier.getNotification(layerDefinitionModel.id);
  var mainErrorMessage = layerDefinitionModel.getName() + ': ' + (cdbError && cdbError.message);

  if (!cdbError) {
    layerDefinitionModel.unset('error');
    notification && Notifier.removeNotification(notification);
    return;
  }

  var errorMessage = NotificationErrorMessageHandler.extractError(mainErrorMessage);

  if (notification) {
    notification.update({
      status: errorMessage.type,
      info: errorMessage.message
    });
  } else {
    Notifier.addNotification({
      id: layerDefinitionModel.id,
      status: errorMessage.type,
      closable: true,
      button: false,
      info: errorMessage.message
    });
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
  } else if (errorMessage) {
    layerDefinitionModel.set('error', {
      type: errorMessage.type,
      message: errorMessage.message
    });
  }
};

F.prototype._onOverlayDefinitionAdded = function (mdl) {
  this._vis().overlaysCollection.add(mdl.toJSON());
};

F.prototype._onOverlayDefinitionRemoved = function (mdl) {
  var collection = this._vis().overlaysCollection;
  var overlay = collection.findWhere({ type: mdl.get('type') });
  overlay && collection.remove(overlay);
};

F.prototype._onMinMaxZoomChanged = function () {
  var currentZoom = this.visMap().get('zoom');
  var maxZoom = this._mapDefinitionModel.get('maxZoom');
  var minZoom = this._mapDefinitionModel.get('minZoom');

  this.visMap().set({
    minZoom: minZoom,
    maxZoom: maxZoom,
    zoom: Math.min(currentZoom, maxZoom)
  });
};

F.prototype._saveStateDefinition = function () {
  var state = this._diDashboard.getState();
  this._stateDefinitionModel.updateState(state);
};

F.prototype._onScrollWheelChanged = function () {
  var scrollwheel = this._mapDefinitionModel.get('scrollwheel');
  var method = scrollwheel ? 'enableScrollWheel' : 'disableScrollWheel';
  var map = this.visMap();
  map && map[method] && map[method]();
};

F.prototype._onLegendsChanged = function () {
  var legends = this._mapDefinitionModel.get('legends');
  this._vis().settings.set('showLegends', legends);
};

F.prototype._onLayerSelectorChanged = function () {
  var layerSelector = this._mapDefinitionModel.get('layer_selector');
  this._vis().settings.set('showLayerSelector', layerSelector);
};

F.prototype._onEditorSettingsChanged = function () {
  var settingsView = this._editorModel.get('settingsView');
  this._vis().settings.set('layerSelectorEnabled', settingsView);
};

F.prototype._getLayer = function (m) {
  return this.visMap().getLayerById(m.id);
};

F.prototype._getLayers = function (m) {
  return this.visMap().layers;
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
  this._vis().reload();
};

F.prototype._onBoundsSet = function (bounds) {
  this._diDashboard._dashboard.vis.map.setBounds(bounds);
};

module.exports = F;
