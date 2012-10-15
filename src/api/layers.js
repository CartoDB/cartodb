/**
 * public api for cartodb
 */

(function() {

  function _Promise() {}
  _.extend(_Promise.prototype,  Backbone.Events);

  /**
   * compose cartodb url
   */
  function cartodbUrl(opts) {
    var host = opts.host || 'cartodb.com';
    var protocol = opts.protocol || 'https';
    return protocol + '://' + opts.user + '.' + host + '/api/v1/viz/' + opts.table + '/layer.json';
  }

  /**
   * given layer params fetchs the layer json
   */
  function _getLayerJson(layer, callback) {
    var url = null;
    if(layer.kind !== undefined && layer.options !== undefined) {
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
      $.getJSON(url + "?callback=?", callback);
    } else {
      _.defer(function() { callback(null); });
    }
  }

  /**
   * load a layer in the specified map
   * 
   * @param map should be a L.Map or google.maps.Map object
   * @param layer should be an url or a javascript object with the data to create the layer
   * @param options layer options
   *
   */

  cartodb.loadLayer = function(map, layer, options, callback) {

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
    
    _getLayerJson(layer, function(layerData) {
      if(!layerData) {
        promise.trigger('error');
        return;
      }

      // check map type
      // TODO: improve checking
      if(typeof(map.overlayMapTypes) !== "undefined") {
        MapType = cdb.geo.GoogleMapsMapView;
      } else if(map._mapPane.className === "leaflet-map-pane") {
        MapType = cdb.geo.LeafletMapView;
      }

      // update options
      if(options) {
        _.extend(layerData, options);
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
      }

      layerView = viz.loadLayer(layerData, { no_base_layer: true });
      callback && callback(layerView);
      promise.trigger('done', layerView);
    });

    return promise;

  };


})();
