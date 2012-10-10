/**
 * public api for cartodb
 */

(function() {

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
      callback(layer);
      return;
    } else if(layer.table !== undefined && layer.user !== undefined) {
      // layer object points to cartodbjson
      url = cartodbUrl(layer);
    } else if(layer.indexOf('http') === 0) {
      // fetch from url
      url = layer;
    }
    if(url) {
      $.getJSON(url + "?callback=?", callback);
    } else {
      callback(null);
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

    var layerView, MapType;
    var args = arguments,
    fn = args[args.length -1];
    if(_.isFunction(fn)) {
      callback = fn;
    }
    _getLayerJson(layer, function(layerData) {

      // check map type
      if(typeof(map) === "google.maps.Map") {
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

      layerView = viz.loadLayer(layerData);
      callback && callback(layerView);
    });

  };


})();
