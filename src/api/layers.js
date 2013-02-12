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
    var host = opts.host || 'cartodb.com';
    var protocol = opts.protocol || 'https';
    return protocol + '://' + opts.user + '.' + host + '/api/v1/viz/' + opts.table + '/viz.json';
  }

  /**
   * given layer params fetchs the layer json
   */
  function _getLayerJson(layer, callback) {
    var url = null;
    if(layer.layers !== undefined || ((layer.kind || layer.type) !== undefined && layer.options !== undefined)) {
      // layer object contains the layer data
      _.defer(function() { callback(layer); });
      return;
    } else if(layer.table !== undefined && layer.user !== undefined) {
      // layer object points to cartodbjson
      url = cartodbUrl(layer);
    } else if(layer.indexOf && layer.indexOf('http') === 0) {
      // fetch from url
      url = layer;
    }
    if(url) {
      cdb.vis.Loader.get(url, callback);
    } else {
      _.defer(function() { callback(null); });
    }
  }

  /**
   * create a layer for the specified map
   * 
   * @param map should be a L.Map or google.maps.Map object
   * @param layer should be an url or a javascript object with the data to create the layer
   * @param options layer options
   *
   */

  cartodb.createLayer = function(map, layer, options, callback) {

    var promise = new _Promise();
    var layerView, MapType;
    if(map === undefined) {
      throw new TypeError("map should be provided");
    }
    if(layer === undefined) {
      throw new TypeError("layer should be provided");
    }
    var args = arguments,
    fn = args[args.length -1];
    if(_.isFunction(fn)) {
      callback = fn;
    }
    
    _getLayerJson(layer, function(visData) {

      var layerData, MapType;

      if(!visData) {
        promise.trigger('error');
        return;
      }
      // extract layer data from visualization data
      if(visData.layers) {
        if(visData.layers.length < 2) {
          promise.trigger('error', "visualization file does not contain layer info");
        }
        layerData = visData.layers[1];
        // add the timestamp to options
        layerData.options.extra_params = layerData.options.extra_params || {};
        layerData.options.extra_params.updated_at = visData.updated_at;
        delete layerData.options.cache_buster;
      } else {
        layerData = visData;
      }

      if(!layerData) {
        promise.trigger('error');
        return;
      }

      // check map type
      // TODO: improve checking
      if(typeof(map.overlayMapTypes) !== "undefined") {
        MapType = cdb.geo.GoogleMapsMapView;
        // check if leaflet is loaded globally
      } else if(map instanceof L.Map || (window.L && map instanceof window.L.Map)) {
        MapType = cdb.geo.LeafletMapView;
      } else {
        promise.trigger('error', "cartodb.js can't guess the map type");
        return;
      }

      // update options
      if(options && !_.isFunction(options)) {
        _.extend(layerData.options, options);
      } 

      options = options || {};
      options = _.defaults(options, {
          infowindow: true
      })

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
      }

      layerView = viz.createLayer(layerData, { no_base_layer: true });
      if(options.infowindow && layerView.model.get('infowindow') && layerView.model.get('infowindow').fields.length > 0) {
        viz.addInfowindow(layerView);
      }
      callback && callback(layerView);
      promise.trigger('done', layerView);
    });

    return promise;

  };


})();
