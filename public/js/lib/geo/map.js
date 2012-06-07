/**
 * classes to manage maps
 */


/**
 * map layer, could be tiled or whatever 
 */
cdb.geo.MapLayer = Backbone.Model.extend({

    TILED: 'tiled', 

    defaults: {
        visible: true
    }
});

cdb.geo.TileLayer = cdb.geo.MapLayer.extend({
    initialize: function() {
        this.set({'type': cdb.geo.MapLayer.TILE});
    }
});

cdb.geo.MapLayers = Backbone.Collection.extend({
    model: cdb.geo.MapLayer
});

/**
 * map model itself
 */
cdb.geo.Map = Backbone.Model.extend({

    defaults: {
        center: [0, 0],
        zoom: 9
    },

    initialize: function() {
        this.layers = new cdb.geo.MapLayers();
    },

    setZoom: function(z) {
        this.set({zoom:  z});
   },

    setCenter: function(latlng) {
        this.set({center: latlng});
    },

    /** 
     * add a layer to the map
     */
    addLayer: function(layer) {
        this.layers.add(layer);
    }

});


/**
 * base view for all impl
 */
cdb.geo.MapView = cdb.core.View.extend({

    initialize: function() {
        if(this.options.map === undefined) {
            throw new Exception("you should specify a map model");
        }
        this.map = this.options.map;
        this.add_related_model(this.map);
    }

});

/**
 * leatlef impl
 */
cdb.geo.LeafletMapView = cdb.geo.MapView.extend({

    initialize: function() {
        _.bindAll(this, '_addLayer', '_setZoom', '_setCenter');
        cdb.geo.MapView.prototype.initialize.call(this);
        var self = this;
        
        this.map_leaflet = new L.Map(this.el);
        this.map.layers.bind('add', this._addLayer);
        this._bindModel();
        
        //set options
        this._setCenter(this.map, this.map.get('center'));
        this._setZoom(this.map, this.map.get('zoom'));

        this.map_leaflet.on('zoomend', function() {
            self._setModelProperty({zoom: self.map_leaflet.getZoom()});

        }, this);
        this.map_leaflet.on('drag', function () {
            var c = self.map_leaflet.getCenter();
            self._setModelProperty({center: [c.lat, c.lng]});
        }, this);
    },

    /** bind model properties */
    _bindModel: function() {
        this.map.bind('change:zoom', this._setZoom, this);
        this.map.bind('change:center', this._setCenter, this);
    },

    /** unbind model properties */
    _unbindModel: function() {
        this.map.unbind('change:zoom', this._setZoom, this);
        this.map.unbind('change:center', this._setCenter, this);
    },

    /**
     * set model property but unbind changes first in order to not create an infinite loop
     */
    _setModelProperty: function(prop) {
        this._unbindModel();
        this.map.set(prop);
        this._bindModel();
    },

    _setZoom: function(model, z) {
        this.map_leaflet.setZoom(z);
    },

    _setCenter: function(model, center) {
        this.map_leaflet.panTo(new L.LatLng(center[0], center[1]));
    },

    _addLayer: function(layer) {
        if(layer.get('type') == cdb.geo.MapLayer.TILED) {
            var lyr = new L.TileLayer(layer.get('urlTemplate'));
            this.map_leaflet.addLayer(lyr);
        } else {
            cdb.error("layer type not supported");
        }
    }
});
