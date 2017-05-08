var LegendManager = require('./legend-manager');
var linkLayerInfowindow = require('./link-layer-infowindow');
var linkLayerTooltip = require('./link-layer-tooltip');

var LAYER_TYPE_TO_LAYER_CREATE_METHOD = {
  'cartodb': 'createCartoDBLayer',
  'gmapsbase': 'createGMapsBaseLayer',
  'plain': 'createPlainLayer',
  'tiled': 'createTileLayer',
  'torque': 'createTorqueLayer',
  'wms': 'createWMSLayer'
};


module.exports = {

  track: function (params) {
    if (!params.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!params.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    layerDefinitionsCollection.each(this._linkLayerErrors, this);
    layerDefinitionsCollection.on('add', this._onLayerDefinitionAdded, this);
    layerDefinitionsCollection.on('sync', this._onLayerDefinitionSynced, this);
    layerDefinitionsCollection.on('change', this._onLayerDefinitionChanged, this);
    layerDefinitionsCollection.on('remove', this._onLayerDefinitionRemoved, this);
    layerDefinitionsCollection.on('layerMoved', this._onLayerDefinitionMoved, this);
    layerDefinitionsCollection.on('baseLayerChanged', this._onBaseLayerChanged, this);

    layerDefinitionsCollection.each(function (layerDefModel) {
      LegendManager.track(layerDefModel);

      linkLayerInfowindow(layerDefModel, this.visMap());
      linkLayerTooltip(layerDefModel, this.visMap());

      if (layerDefModel.has('source')) {
        this._resetStylesIfNoneApplied(layerDefModel);
      }
    }, this);
  },

  _onLayerDefinitionRemoved: function (m) {
    if (!m.isNew()) {
      var layer = this._getLayer(m);
      layer && layer.remove();
    }
  },

  _onLayerDefinitionMoved: function (m, from, to) {
    this.visMap().moveCartoDBLayer(from, to);
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
      this._analyseDefinitionNode(nodeDefModel);
    }

    var visMap = this.visMap();
    var layerPosition = this._layerDefinitionsCollection.indexOf(layerDefModel);
    visMap[createMethodName](attrs, _.extend({
      at: layerPosition
    }, options));

    linkLayerInfowindow(layerDefModel, visMap);
    linkLayerTooltip(layerDefModel, visMap);
    LegendManager.track(layerDefModel);

    this._linkLayerErrors(layerDefModel);
  },

  _linkLayerErrors: function (m) {
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
  },

  _onLayerDefinitionAdded: function (m, c, opts) {
    // Base and labels layers are synced in a separate method
    if (!layerTypesAndKinds.isTypeDataLayer(m.get('type'))) {
      return;
    }

    // If added but not yet saved, postpone the creation until persisted (see sync listener)
    if (!m.isNew()) {
      if (!this._getLayer(m)) {
        this._createLayer(m);
      } else {
        // we need to sync model positions
        this._tryUpdateLayerPosition(m);
      }
    }
  };

  _tryUpdateLayerPosition: function (m) {
    var builderPosition = this._layerDefinitionsCollection.indexOf(m);
    var cdbLayer = this._getLayer(m);
    var cdbPosition;

    if (cdbLayer) {
      cdbPosition = this._getLayers().indexOf(cdbLayer);
    }

    var indexChanges = m.isDataLayer() && cdbPosition > 0 && builderPosition > 0 && builderPosition !== cdbPosition;

    if (indexChanges) {
      this.visMap().moveCartoDBLayer(cdbPosition, builderPosition);
    }
  };

  _onLayerDefinitionSynced: function (m) {
    // Base and labels layers are synced in a separate method
    if (!layerTypesAndKinds.isTypeDataLayer(m.get('type'))) {
      return;
    }

    if (!this._getLayer(m)) {
      this._createLayer(m);
    }
  };

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

    var layer = this._getLayer(layerDefinitionModel);
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
        attrs = this._adaptAttrsToCDBjs(layerDefinitionModel.get('type'), attrs);
        layer.update(attrs);
      }
      this._manageTimeSeriesForTorque(layerDefinitionModel);
    }
  };

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
    var cdbjsLayer = this._getLayer(baseLayerDefinition);

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
    var cdbjsTopLayer = this._getLayers().last();
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
    this.visMap().set('provider', newMapProvider);

    if (handleLayersSilently) {
      // Reload map if everything (previously) was done silently
      this._deepInsightsDashboard.reloadMap();
    }

    // Render again the edit-feature-overlay, in order to
    // decide if delegate or not events
    this._editFeatureOverlay.render();
    this._setMapConverters();
  },

  _resetStylesIfNoneApplied: function (layerDefModel) {
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
  }
}