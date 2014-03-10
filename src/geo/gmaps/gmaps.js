
// if google maps is not defined do not load the class
if(typeof(google) != "undefined" && typeof(google.maps) != "undefined") {

  var DEFAULT_MAP_STYLE = [ { stylers: [ { saturation: -65 }, { gamma: 1.52 } ] },{ featureType: "administrative", stylers: [ { saturation: -95 }, { gamma: 2.26 } ] },{ featureType: "water", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "administrative.locality", stylers: [ { visibility: "off" } ] },{ featureType: "road", stylers: [ { visibility: "simplified" }, { saturation: -99 }, { gamma: 2.22 } ] },{ featureType: "poi", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "road.arterial", stylers: [ { visibility: "off" } ] },{ featureType: "road.local", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "transit", stylers: [ { visibility: "off" } ] },{ featureType: "road", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "poi", stylers: [ { saturation: -55 } ] } ];



  cdb.geo.GoogleMapsMapView = cdb.geo.MapView.extend({

    layerTypeMap: {
      "tiled": cdb.geo.GMapsTiledLayerView,
      "cartodb": cdb.geo.GMapsCartoDBLayerView,
      "carto": cdb.geo.GMapsCartoDBLayerView,
      "plain": cdb.geo.GMapsPlainLayerView,
      "gmapsbase": cdb.geo.GMapsBaseLayerView,
      "layergroup": cdb.geo.GMapsCartoDBLayerGroupView,
      "namedmap": cdb.geo.GMapsCartoDBNamedMapView,
      "torque": function(layer, map) {
        return new cdb.geo.GMapsTorqueLayerView(layer, map);
      },
      "wms": cdb.geo.LeafLetWMSLayerView
    },

    initialize: function() {
      _.bindAll(this, '_ready');
      this._isReady = false;
      var self = this;

      cdb.geo.MapView.prototype.initialize.call(this);

      var bounds = this.map.getViewBounds();

      if (bounds) {
        this.showBounds(bounds);
      }

      var center = this.map.get('center');

      if (!this.options.map_object) {

        this.map_googlemaps = new google.maps.Map(this.el, {
          center: new google.maps.LatLng(center[0], center[1]),
          zoom: this.map.get('zoom'),
          minZoom: this.map.get('minZoom'),
          maxZoom: this.map.get('maxZoom'),
          disableDefaultUI: true,
          scrollwheel: this.map.get("scrollwheel"),
          mapTypeControl:false,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          backgroundColor: 'white',
          tilt: 0
        });

        this.map.bind('change:maxZoom', function() {
          self.map_googlemaps.setOptions({ maxZoom: self.map.get('maxZoom') });
        }, this);

        this.map.bind('change:minZoom', function() {
          self.map_googlemaps.setOptions({ minZoom: self.map.get('minZoom') });
        }, this);

      } else {

        this.map_googlemaps = this.options.map_object;
        this.setElement(this.map_googlemaps.getDiv());

        // fill variables
        var c = self.map_googlemaps.getCenter();

        self._setModelProperty({ center: [c.lat(), c.lng()] });
        self._setModelProperty({ zoom: self.map_googlemaps.getZoom() });

        // unset bounds to not change mapbounds
        self.map.unset('view_bounds_sw', { silent: true });
        self.map.unset('view_bounds_ne', { silent: true });

      }

      this.map.geometries.bind('add', this._addGeometry, this);
      this.map.geometries.bind('remove', this._removeGeometry, this);


      this._bindModel();
      this._addLayers();

      google.maps.event.addListener(this.map_googlemaps, 'center_changed', function() {
        var c = self.map_googlemaps.getCenter();
        self._setModelProperty({ center: [c.lat(), c.lng()] });
      });

      google.maps.event.addListener(this.map_googlemaps, 'zoom_changed', function() {
        self._setModelProperty({
          zoom: self.map_googlemaps.getZoom()
        });
      });

      google.maps.event.addListener(this.map_googlemaps, 'click', function(e) {
        self.trigger('click', e, [e.latLng.lat(), e.latLng.lng()]);
      });

      google.maps.event.addListener(this.map_googlemaps, 'dblclick', function(e) {
        self.trigger('dblclick', e);
      });

      this.map.layers.bind('add', this._addLayer, this);
      this.map.layers.bind('remove', this._removeLayer, this);
      this.map.layers.bind('reset', this._addLayers, this);
      this.map.layers.bind('change:type', this._swicthLayerView, this);

      this.projector = new cdb.geo.CartoDBLayerGroupGMaps.Projector(this.map_googlemaps);

      this.projector.draw = this._ready;

    },

    _ready: function() {
      this.projector.draw = function() {};
      this.trigger('ready');
      this._isReady = true;
    },

    _setScrollWheel: function(model, z) {
      this.map_googlemaps.setOptions({ scrollwheel: z });
    },

    _setZoom: function(model, z) {
      z = z || 0;
      this.map_googlemaps.setZoom(z);
    },

    _setCenter: function(model, center) {
      var c = new google.maps.LatLng(center[0], center[1]);
      this.map_googlemaps.setCenter(c);
    },

    createLayer: function(layer) {
      var layer_view,
      layerClass = this.layerTypeMap[layer.get('type').toLowerCase()];

      if (layerClass) {
        try {
          layer_view = new layerClass(layer, this.map_googlemaps);
        } catch(e) {
          cdb.log.error("MAP: error creating layer" + layer.get('type') + " " + e);
        }
      } else {
        cdb.log.error("MAP: " + layer.get('type') + " can't be created");
      }
      return layer_view;
    },

    _addLayer: function(layer, layers, opts) {
      opts = opts || {};
      var self = this;
      var lyr, layer_view;

      layer_view = this.createLayer(layer);

      if (!layer_view) {
        return;
      }

      this.layers[layer.cid] = layer_view;

      if (layer_view) {
        var idx = _(this.layers).filter(function(lyr) { return !!lyr.getTile; }).length - 1;
        var isBaseLayer = _.keys(this.layers).length === 1 || (opts && opts.index === 0);
        // set base layer
        if(isBaseLayer && !opts.no_base_layer) {
          var m = layer_view.model;
          if(m.get('type') === 'GMapsBase') {
            layer_view._update();
          } else {
            layer_view.isBase = true;
            layer_view._update();
          }
        } else {
          idx -= 1;
          idx = Math.max(0, idx); // avoid -1
          if (layer_view.getTile) {
            if (!layer_view.gmapsLayer) {
              cdb.log.error("gmaps layer can't be null");
            }
            self.map_googlemaps.overlayMapTypes.setAt(idx, layer_view.gmapsLayer);
          } else {
            layer_view.gmapsLayer.setMap(self.map_googlemaps);
          }
        }
        if(opts === undefined || !opts.silent) {
          this.trigger('newLayerView', layer_view, layer, this);
        }
      } else {
        cdb.log.error("layer type not supported");
      }

      var attribution = layer.get('attribution');

      if (attribution) {
        // Setting attribution in map model
        // it doesn't persist in the backend, so this is needed.
        var attributions = this.map.get('attribution') || [];
        if (!_.contains(attributions, attribution)) {
          attributions.push(attribution);
        }

        this.map.set({ attribution: attributions });
      }

      return layer_view;

    },


    latLonToPixel: function(latlon) {
      return this.projector.latLngToPixel(new google.maps.LatLng(latlon[0], latlon[1]));
    },

    getSize: function() {
      return {
        x: this.$el.width(),
        y: this.$el.height()
      };
    },

    panBy: function(p) {
      var c = this.map.get('center');
      var pc = this.latLonToPixel(c);
      p.x += pc.x;
      p.y += pc.y;
      var ll = this.projector.pixelToLatLng(p);
      this.map.setCenter([ll.lat(), ll.lng()]);
    },

    getBounds: function() {
      if(this._isReady) {
        var b = this.map_googlemaps.getBounds();
        var sw = b.getSouthWest();
        var ne = b.getNorthEast();
        return [
          [sw.lat(), sw.lng()],
          [ne.lat(), ne.lng()]
        ];
      }
      return [ [0,0], [0,0] ];
    },

  setAttribution: function(m) {
    // Remove old one
    var old = document.getElementById("cartodb-gmaps-attribution")
      , attribution = m.get("attribution").join(", ");

      // If div already exists, remove it
      if (old) {
        old.parentNode.removeChild(old);
      }

      // Add new one
      var container           = this.map_googlemaps.getDiv()
        , cartodb_attribution = document.createElement("div");

      cartodb_attribution.setAttribute('id','cartodb-gmaps-attribution');
      cartodb_attribution.setAttribute('class', 'gmaps');
      container.appendChild(cartodb_attribution);
      cartodb_attribution.innerHTML = attribution;
    },

    setCursor: function(cursor) {
      this.map_googlemaps.setOptions({ draggableCursor: cursor });
    },

    _addGeomToMap: function(geom) {
      var geo = cdb.geo.GoogleMapsMapView.createGeometry(geom);
      if(geo.geom.length) {
        for(var i = 0 ; i < geo.geom.length; ++i) {
          geo.geom[i].setMap(this.map_googlemaps);
        }
      } else {
          geo.geom.setMap(this.map_googlemaps);
      }
      return geo;
    },

    _removeGeomFromMap: function(geo) {
      if(geo.geom.length) {
        for(var i = 0 ; i < geo.geom.length; ++i) {
          geo.geom[i].setMap(null);
        }
      } else {
        geo.geom.setMap(null);
      }
    },

    getNativeMap: function() {
      return this.map_googlemaps;
    },

    invalidateSize: function() {
      google.maps.event.trigger(this.map_googlemaps, 'resize');
    }

  }, {

    addLayerToMap: function(layer, map, pos) {
      pos = pos || 0;
      if (!layer) {
        cdb.log.error("gmaps layer can't be null");
      }
      if (layer.getTile) {
        map.overlayMapTypes.setAt(pos, layer);
      } else {
        layer.setMap(map);
      }
    },

    /**
    * create the view for the geometry model
    */
    createGeometry: function(geometryModel) {
      if(geometryModel.isPoint()) {
        return new cdb.geo.gmaps.PointView(geometryModel);
      }
      return new cdb.geo.gmaps.PathView(geometryModel);
    }
  });

}
