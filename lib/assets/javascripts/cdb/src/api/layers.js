/**
 * public api for cartodb
 */
(function() {
  function _Promise() {

  }
  _.extend(_Promise.prototype,  Backbone.Events, {
    done: function(fn) {
      return this.bind('done', fn);
    },
    error: function(fn) {
      return this.bind('error', fn);
    }
  });

  cdb._Promise = _Promise;

  var _requestCache = {};

  /**
   * compose cartodb url
   */
  function cartodbUrl(opts) {
    var host = opts.host || 'carto.com';
    var protocol = opts.protocol || 'https';
    return protocol + '://' + opts.user + '.' + host + '/api/v1/viz/' + opts.table + '/viz.json';
  }

  /**
   * given layer params fetchs the layer json
   */
  function _getLayerJson(layer, callback) {
    var url = null;
    if(layer.layers !== undefined || ((layer.kind || layer.type) !== undefined)) {
      // layer object contains the layer data
      _.defer(function() { callback(layer); });
      return;
    } else if(layer.table !== undefined && layer.user !== undefined) {
      // layer object points to cartodbjson
      url = cartodbUrl(layer);
    } else if(layer.indexOf) {
      // fetch from url
      url = layer;
    }
    if(url) {
      cdb.core.Loader.get(url, callback);
    } else {
      _.defer(function() { callback(null); });
    }
  }

  /**
   * create a layer for the specified map
   *
   * @param map should be a L.Map object, or equivalent depending on what provider you have.
   * @param layer should be an url or a javascript object with the data to create the layer
   * @param options layer options
   *
   */
  cartodb.createLayer = function(map, layer, options, callback) {
    if(map === undefined) {
      throw new TypeError("map should be provided");
    }
    if(layer === undefined) {
      throw new TypeError("layer should be provided");
    }

    var layerView, MapType;
    var options = options || {};
    var args = arguments;
    var fn = args[args.length -1];
    if(_.isFunction(fn)) {
      callback = fn;
    }
    var promise = new _Promise();

    promise.addTo = function(map, position) {
      promise.on('done', function() {
        MapType.addLayerToMap(layerView, map, position);
      });
      return promise;
    };

    _getLayerJson(layer, function(visData) {

      var layerData;

      if(!visData) {
        promise.trigger('error');
        return;
      }

      // extract layer data from visualization data
      if(visData.layers) {
        if(visData.layers.length < 2) {
          promise.trigger('error', "visualization file does not contain layer info");
        }
        var index = options.layerIndex;
        if (index !== undefined) {
          if(visData.layers.length <= index) {
            promise.trigger('error', 'layerIndex out of bounds');
            return;
          }
          layerData = visData.layers[index];
        } else {
          var DATA_LAYER_TYPES = ['namedmap', 'layergroup', 'torque'];

          // Select the first data layer (namedmap or layergroup)
          layerData = _.find(visData.layers, function(layer){
            return DATA_LAYER_TYPES.indexOf(layer.type) !== -1;
          });
        }
      } else {
        layerData = visData;
      }

      if(!layerData) {
        promise.trigger('error');
        return;
      }

      // update options
      if(options && !_.isFunction(options)) {
        layerData.options = layerData.options || {};
        _.extend(layerData.options, options);
      }

      options = _.defaults(options, {
        infowindow: true,
        https: false,
        legends: true,
        time_slider: true,
        tooltip: true
      });

      // check map type
      // TODO: improve checking
      if(typeof(map.overlayMapTypes) !== "undefined") {
        MapType = cdb.geo.GoogleMapsMapView;
        // check if leaflet is loaded globally
      } else if(map instanceof L.Map || (window.L && map instanceof window.L.Map)) {
        MapType = cdb.geo.LeafletMapView;
      } else {
        promise.trigger('error', "cartodb.js can't guess the map type");
        return promise;
      }

      // create a dummy viz
      var viz = map.viz;
      if(!viz) {
        var mapView = new MapType({
          map_object: map,
          map: new cdb.geo.Map()
        });

        map.viz = viz = new cdb.vis.Vis({
          mapView: mapView
        });

        viz.updated_at = visData.updated_at;
        viz.https = options.https;
      }

      function createLayer() {
        layerView = viz.createLayer(layerData, { no_base_layer: true });

        var torqueLayer;
        var mobileEnabled = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        var addMobileLayout = (options.mobile_layout && mobileEnabled) || options.force_mobile;

        if(!layerView) {
          promise.trigger('error', "layer not supported");
          return promise;
        }

        if(options.infowindow) {
          viz.addInfowindow(layerView);
        }

        if(options.tooltip) {
          viz.addTooltip(layerView);
        }

        if(options.legends) {
          var layerModel = cdb.vis.Layers.create(layerData.type || layerData.kind, viz, layerData);

          viz._addLegends(viz._createLayerLegendView(layerModel.attributes,  layerView))
        }

        if(options.time_slider && layerView.model.get('type') === 'torque') {

          if (!addMobileLayout) { // don't add the overlay if we are in mobile
            viz.addTimeSlider(layerView);
          }

          torqueLayer = layerView;
        }

        if (addMobileLayout) {

          options.mapView = map.viz.mapView;

          viz.addOverlay({
            type: 'mobile',
            layerView: layerView,
            overlays: [],
            torqueLayer: torqueLayer,
            options: options
          });
        }

        callback && callback(layerView);
        promise.trigger('done', layerView);
      }

      // load needed modules
      if(!viz.checkModules([layerData])) {
        viz.loadModules([layerData], function() {
          createLayer();
        });
      } else {
        createLayer();
      }
    });

    return promise;
  };
})();
