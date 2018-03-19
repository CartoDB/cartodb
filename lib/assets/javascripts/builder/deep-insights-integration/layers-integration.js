var _ = require('underscore');
var Backbone = require('backbone');
var LegendManager = require('./legend-manager');
var linkLayerInfowindow = require('./link-layer-infowindow');
var linkLayerTooltip = require('./link-layer-tooltip');
var layerTypesAndKinds = require('builder/data/layer-types-and-kinds');
var Notifier = require('builder/components/notifier/notifier');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var NotificationErrorMessageHandler = require('builder/editor/layers/notification-error-message-handler');
var basemapProvidersAndCategories = require('builder/data/basemap-providers-and-categories');

var REQUIRED_OPTS = [
  'analysisDefinitionNodesCollection',
  'editFeatureOverlay',
  'layerDefinitionsCollection',
  'legendDefinitionsCollection',
  'diDashboardHelpers'
];

var LAYER_TYPE_TO_LAYER_CREATE_METHOD = {
  'cartodb': 'createCartoDBLayer',
  'gmapsbase': 'createGMapsBaseLayer',
  'plain': 'createPlainLayer',
  'tiled': 'createTileLayer',
  'torque': 'createTorqueLayer',
  'wms': 'createWMSLayer'
};

var CARTODBJS_TO_CARTODB_ATTRIBUTE_MAPPINGS = {
  'layer_name': ['table_name_alias', 'table_name']
};

var BLACKLISTED_LAYER_DEFINITION_ATTRS = {
  'all': [ 'letter', 'kind' ],
  'Tiled': [ 'category', 'selected', 'highlighted' ],
  'CartoDB': [ 'color', 'letter' ],
  'torque': [ 'color', 'letter' ]
};

/**
 *  Only manage **LAYER** actions between Deep-Insights (CARTO.js) and Builder
 *
 */

var LayersIntegration = {

  track: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._visMap = this._diDashboardHelpers.visMap();

    this._layerDefinitionsCollection.each(this._linkLayerErrors, this);
    this._layerDefinitionsCollection.on('add', this._onLayerDefinitionAdded, this);
    this._layerDefinitionsCollection.on('sync', this._onLayerDefinitionSynced, this);
    this._layerDefinitionsCollection.on('change', this._onLayerDefinitionChanged, this);
    this._layerDefinitionsCollection.on('remove', this._onLayerDefinitionRemoved, this);
    this._layerDefinitionsCollection.on('layerMoved', this._onLayerDefinitionMoved, this);
    this._layerDefinitionsCollection.on('baseLayerChanged', this._onBaseLayerChanged, this);

    this._layerDefinitionsCollection.each(function (layerDefModel) {
      LegendManager.track(layerDefModel);

      linkLayerInfowindow(layerDefModel, this._visMap);
      linkLayerTooltip(layerDefModel, this._visMap);

      if (layerDefModel.has('source')) {
        this._resetStylesIfNoneApplied(layerDefModel);
      }
    }, this);

    // In order to sync layer selector and layer visibility
    this._diDashboardHelpers.getLayers().on('change:visible', function (layer, visible) {
      var layerDefModel = this._layerDefinitionsCollection.findWhere({id: layer.id});
      if (layerDefModel) {
        if (layerDefModel.get('visible') !== visible) {
          layerDefModel.save({visible: visible});
        }
      }
    }, this);

    return this;
  },

  _onLayerDefinitionRemoved: function (m) {
    if (!m.isNew()) {
      var layer = this._diDashboardHelpers.getLayer(m.id);
      layer && layer.remove();
    }
  },

  _onLayerDefinitionMoved: function (m, from, to) {
    this._diDashboardHelpers.moveCartoDBLayer(from, to);
  },

  _createLayer: function (layerDefModel, options) {
    options = options || {};
    var attrs = JSON.parse(JSON.stringify(layerDefModel.attributes)); // deep clone
    attrs = this._adaptAttrsToCDBjs(layerDefModel.get('type'), attrs);

    // create the legends for the new layer
    var legends = this._legendDefinitionsCollection.findByLayerDefModel(layerDefModel);
    if (legends.length > 0) {
      attrs.legends = _.map(legends, function (legend) {
        return legend.toJSON();
      });
    }

    var createMethodName = LAYER_TYPE_TO_LAYER_CREATE_METHOD[attrs.type.toLowerCase()];
    if (!createMethodName) throw new Error('no create method name found for type ' + attrs.type);

    if (attrs.source) {
      // Make sure the analysis is created first
      var nodeDefModel = this._analysisDefinitionNodesCollection.get(attrs.source);
      // Dependency with another integration
      this.trigger('onLayerCreation', nodeDefModel);
      // Set analysis model instead of the string ID source
      attrs.source = this._diDashboardHelpers.getAnalysisByNodeId(attrs.source);
    }

    var layerPosition = this._layerDefinitionsCollection.indexOf(layerDefModel);

    this._visMap[createMethodName](attrs, _.extend({
      at: layerPosition
    }, options));

    linkLayerInfowindow(layerDefModel, this._visMap);
    linkLayerTooltip(layerDefModel, this._visMap);
    LegendManager.track(layerDefModel);

    this._linkLayerErrors(layerDefModel);
  },

  _linkLayerErrors: function (m) {
    var layer = this._diDashboardHelpers.getLayer(m.id);
    if (layer) {
      if (layer.get('error')) {
        this._setLayerError(m, layer.get('error'));
      }
      layer.on('change:error', function (model, cdbError) {
        this._setLayerError(m, cdbError);
      }, this);
    }
  },

  _setLayerError: function (layerDefinitionModel, cdbError) {
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

    if (cdbError.subtype === 'turbo-carto') {
      var line;
      try {
        line = cdbError.context.source.start.line;
      } catch (error) {}

      layerDefinitionModel.set('error', {
        type: cdbError.type,
        subtype: cdbError.subtype,
        line: line,
        message: cdbError.message
      });
    } else if (errorMessage) {
      layerDefinitionModel.set('error', {
        type: errorMessage.type,
        subtype: cdbError.subtype,
        message: errorMessage.message
      });
    }
  },

  _onLayerDefinitionAdded: function (m, c, opts) {
    // Base and labels layers are synced in a separate method
    if (!layerTypesAndKinds.isTypeDataLayer(m.get('type'))) {
      return;
    }

    // If added but not yet saved, postpone the creation until persisted (see sync listener)
    if (!m.isNew()) {
      if (!this._diDashboardHelpers.getLayer(m.id)) {
        this._createLayer(m);
      } else {
        // we need to sync model positions
        this._tryUpdateLayerPosition(m);
      }
    }
  },

  _tryUpdateLayerPosition: function (m) {
    var builderPosition = this._layerDefinitionsCollection.indexOf(m);
    var cdbLayer = this._diDashboardHelpers.getLayer(m.id);
    var cdbPosition;

    if (cdbLayer) {
      cdbPosition = this._diDashboardHelpers.getLayers().indexOf(cdbLayer);
    }

    var indexChanges = m.isDataLayer() && cdbPosition > 0 && builderPosition > 0 && builderPosition !== cdbPosition;

    if (indexChanges) {
      this._diDashboardHelpers.moveCartoDBLayer(cdbPosition, builderPosition);
    }
  },

  _onLayerDefinitionSynced: function (m) {
    // Base and labels layers are synced in a separate method
    if (!layerTypesAndKinds.isTypeDataLayer(m.get('type'))) {
      return;
    }

    if (!this._diDashboardHelpers.getLayer(m.id)) {
      this._createLayer(m);
    }
  },

  _onLayerDefinitionChanged: function (layerDefinitionModel, changedAttributes) {
    var attrs = layerDefinitionModel.changedAttributes();
    var attrsNames = _.keys(attrs);

    // Base and labels layers are synced in a separate method
    if (!layerTypesAndKinds.isTypeDataLayer(layerDefinitionModel.get('type'))) {
      return;
    }

    // return if only the 'error' attribute has changed (no need to sync anything)
    if (attrsNames.length === 1 && attrsNames[0] === 'error') {
      return;
    }

    var layer = this._diDashboardHelpers.getLayer(layerDefinitionModel.id);
    if (!layerDefinitionModel.isNew()) {
      if (!layer) {
        this._createLayer(layerDefinitionModel);
        return;
      }

      if (attrs.type) {
        layer.remove();
        this._createLayer(layerDefinitionModel);
      } else {
        if (layerDefinitionModel.get('source') && !layer.get('source')) {
          attrs.source = layerDefinitionModel.get('source');
        }
        var onlySourceChanged = attrs.source && _.keys(attrs).length === 1;
        if (attrs.source) {
          // Set analysis model instead of the string ID source
          attrs.source = this._diDashboardHelpers.getAnalysisByNodeId(attrs.source);
          // Set source with setSource method
          layer.setSource(attrs.source, { silent: !onlySourceChanged });
          // Remove source form attrs to avoid updating source
          delete attrs.source;
        }
        attrs = this._adaptAttrsToCDBjs(layerDefinitionModel.get('type'), attrs);
        layer.update(attrs, { silent: onlySourceChanged });
      }
      // Dependency with widgets-integration
      this.trigger('onLayerChanged', layerDefinitionModel);
    }
  },

  _onBaseLayerChanged: function () {
    var baseLayerDefinition = this._layerDefinitionsCollection.getBaseLayer();
    var newBaseLayerAttrs = baseLayerDefinition.changedAttributes();

    var newBaseLayerType = baseLayerDefinition.get('type');
    var newMapProvider = basemapProvidersAndCategories.getProvider(newBaseLayerType);
    var mapProviderChanged = false;
    if (baseLayerDefinition.hasChanged('type')) {
      var previousBaseLayerType = baseLayerDefinition.previous('type');
      var previousMapProvider = basemapProvidersAndCategories.getProvider(previousBaseLayerType);
      mapProviderChanged = previousMapProvider !== newMapProvider;
    }

    // If the map provider has changed (eg: Leaflet -> Google Maps), we add/update/remove base and
    // labels layers silently so that CartoDB.js doesn't pick up those changes and tries to add/update/remove
    // layers until the new map provider has been set
    var handleLayersSilently = mapProviderChanged;

    // Base layer
    var cdbjsLayer = this._diDashboardHelpers.getLayer(baseLayerDefinition.id);

    // If the type of base layer has changed. eg: Tiled -> Plain
    if (newBaseLayerAttrs.type) {
      cdbjsLayer.remove({ silent: handleLayersSilently });
      this._createLayer(baseLayerDefinition, { silent: handleLayersSilently });
    } else {
      cdbjsLayer.update(this._adaptAttrsToCDBjs(baseLayerDefinition.get('type'), newBaseLayerAttrs), {
        silent: handleLayersSilently
      });
    }

    // Labels layer
    var labelsLayerDefinition = this._layerDefinitionsCollection.getLabelsLayer();
    var cdbjsTopLayer = this._diDashboardHelpers.getLayers().last();
    var cdbjsHasLabelsLayer = cdbjsTopLayer.get('type') === 'Tiled';

    if (labelsLayerDefinition) {
      if (cdbjsHasLabelsLayer) {
        var changedAttrs = labelsLayerDefinition.changedAttributes();
        if (changedAttrs) {
          cdbjsTopLayer.update(this._adaptAttrsToCDBjs(labelsLayerDefinition.get('type'), changedAttrs), {
            silent: handleLayersSilently
          });
        }
      } else {
        this._createLayer(labelsLayerDefinition, { silent: handleLayersSilently });
      }
    } else if (cdbjsHasLabelsLayer) {
      cdbjsTopLayer.remove({ silent: handleLayersSilently });
    }

    // Map provider
    this._visMap.set('provider', newMapProvider);

    if (handleLayersSilently) {
      // Reload map if everything (previously) was done silently
      this._diDashboardHelpers.reloadMap();
    }

    // Render again the edit-feature-overlay, in order to
    // decide if delegate or not events
    this._editFeatureOverlay.render();

    // Dependency with map-integration class
    this.trigger('onBaseLayerChanged');
  },

  _resetStylesIfNoneApplied: function (layerDefModel) {
    var nodeDefModel = layerDefModel.getAnalysisDefinitionNodeModel();
    var nodeModel = this._diDashboardHelpers.getAnalysisByNodeId(layerDefModel.get('source'));
    var isAnalysisNode = nodeModel && nodeModel.get('type') !== 'source';
    var isDone = nodeModel && nodeModel.isDone();
    var queryGeometryModel = nodeDefModel && nodeDefModel.queryGeometryModel;
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
  },

  _adaptAttrsToCDBjs: function (layerType, attrs) {
    attrs = _.omit(attrs, BLACKLISTED_LAYER_DEFINITION_ATTRS['all'], BLACKLISTED_LAYER_DEFINITION_ATTRS[layerType]);
    _.each(CARTODBJS_TO_CARTODB_ATTRIBUTE_MAPPINGS, function (cdbAttrs, cdbjsAttr) {
      _.each(cdbAttrs, function (cdbAttr) {
        if (attrs[cdbAttr] && !attrs[cdbjsAttr]) {
          attrs[cdbjsAttr] = attrs[cdbAttr];
        }
      });
    });

    return attrs;
  }
};

_.extend(LayersIntegration, Backbone.Events);

module.exports = LayersIntegration;
