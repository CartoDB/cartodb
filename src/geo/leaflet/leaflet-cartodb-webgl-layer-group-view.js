var log = require('cdb.log');
var _ = require('underscore');
var L = require('leaflet');
var TC = require('tangram.cartodb');
var LeafletLayerView = require('./leaflet-layer-view');
var Profiler = require('../../core/profiler');

var LeafletCartoDBWebglLayerGroupView = function (layerGroupModel, leafletMap) {
  var self = this;
  LeafletLayerView.apply(this, arguments);
  var metric = Profiler.metric('tangram.rendering');

  metric.start();

  this.trigger('loading');

  this.tangram = new TC(leafletMap, this.initConfig.bind(this, layerGroupModel));

  this.tangram.onLoaded(function () {
    if (metric) {
      self.trigger('load');
      metric.end();
      metric = void 0;

      log.info('Rendered Geometries Count: ', self.tangram.getTotalGeometries());
    }
  });

  this.layerGroupModel = layerGroupModel;
};

LeafletCartoDBWebglLayerGroupView.prototype = _.extend(
  {},
  LeafletLayerView.prototype,
  {
    initConfig: function (layerGroupModel) {
      var onURLsChanged = this._onURLsChanged(layerGroupModel);

      layerGroupModel.bind('change:urls', onURLsChanged);

      layerGroupModel.forEachGroupedLayer(this._onLayerAdded, this);
      layerGroupModel.onLayerAdded(this._onLayerAdded.bind(this));

      this._addInteractiveEvents();
    },

    _addInteractiveEvents: function () {
      var hovered = false;
      var self = this;
      this.tangram.layer.setSelectionEvents({
        hover: function (e) {
          if (e.feature) {
            hovered = true;
            self.trigger('featureOver', self._getFeatureObject(e));
          } else if (hovered) {
            hovered = false;
            self.trigger('featureOut', self._getFeatureObject(e));
          }
        },
        click: function (e) {
          if (e.feature) {
            self.trigger('featureClick', self._getFeatureObject(e));
          }
        }
      });
    },
    _getFeatureObject: function (e) {
      var layer = this.layerGroupModel.getCartoLayerById(e.feature && e.feature.source_layer);
      if (layer) {
        var index = this.layerGroupModel.getIndexOfLayerInLayerGroup(layer);
        this.lastLayer = layer;
        this.lastLayerIndex = index;
        return {
          layer: layer,
          layerIndex: index,
          latlng: e.leaflet_event.latlng,
          position: e.pixel,
          feature: e.feature.properties
        };
      } else {
        return {
          layer: this.lastLayer,
          layerIndex: this.lastLayerIndex
        };
      }
    },

    _createLeafletLayer: function () {
      var leafletLayer = new L.Layer();
      leafletLayer.onAdd = function () {};
      leafletLayer.onRemove = function () {};
      leafletLayer.setZIndex = function () {};
      return leafletLayer;
    },

    _onLayerAdded: function (layer, i) {
      var self = this;
      layer.bind('change:meta change:visible', function (e) {
        self.tangram.addLayer(e.attributes, (i + 1));
      });

      self.tangram.addLayer(layer.attributes, (i + 1));
    },

    _onURLsChanged: function (layerGroupModel) {
      var self = this;

      self.tangram.addDataSource(layerGroupModel.getTileURLTemplate('mvt'), layerGroupModel.getSubdomains());

      return function () {
        self.tangram.addDataSource(layerGroupModel.getTileURLTemplate('mvt'), layerGroupModel.getSubdomains());
      };
    }
  }
);

module.exports = LeafletCartoDBWebglLayerGroupView;
