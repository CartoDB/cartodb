var log = require('cdb.log');
var _ = require('underscore');
var L = require('leaflet');
var TC = require('tangram.cartodb');
var LeafletLayerView = require('./leaflet-layer-view');
var Profiler = require('../../core/profiler');

var LeafletCartoDBWebglLayerGroupView = function (layerGroupModel, leafletMap, showLimitErrors) {
  var self = this;
  LeafletLayerView.apply(this, arguments);
  var metric = Profiler.metric('tangram.rendering');

  metric.start();

  this.trigger('loading');

  this.tangram = new TC(leafletMap, this.initConfig.bind(this, layerGroupModel), showLimitErrors);

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
      this._addErrorsEvents();
    },

    _addInteractiveEvents: function () {
      var hovered = false;
      var self = this;
      this.tangram.layer.setSelectionEvents({
        hover: function (e) {
          if (!e.feature || !e.feature.cartodb_id) {
            return;
          }

          if (e.feature) {
            hovered = true;
            self.trigger('featureOver', self._getFeatureObject(e));
          } else if (hovered) {
            hovered = false;
            self.trigger('featureOut', self._getFeatureObject(e));
          }
        },
        click: function (e) {
          if (e.feature && e.feature.cartodb_id) {
            self.trigger('featureClick', self._getFeatureObject(e));
          }
        }
      });
    },

    // This errors/warnings will come from Tangram. Bad thing is tangram doesn't
    // include error stus code, only error text, so we need to make some parsing
    // in order to segment limits errors (Too many requests)
    _addErrorsEvents: function () {
      this.tangram.scene.subscribe({
        tileError: function (error) {
          var code = parseInt(error.statusCode);

          switch (code) {
            case 429:
              this.layerGroupModel.addError({ type: 'limit' });
              break;
            case 204:
              // This error is thrown when the tile has no data
              break;
            default:
              this.layerGroupModel.addError({ type: 'tile' });
          }
        }.bind(this)
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
