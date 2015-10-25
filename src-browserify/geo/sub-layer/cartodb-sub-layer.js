var _ = require('underscore');
var SubLayerBase = require('./sub-layer-base');
var BackboneProxy = require('backbone-proxy');

// CartoDB / Mapnik sublayers
function CartoDBSubLayer(layer, position) {
  SubLayerBase.call(this, layer, position);
  this._bindInteraction();

  var layer = this._parent.getLayer(this._position);
  var Backbone = BackboneProxy.get();
  if (Backbone.Model && layer) {
    this.infowindow = new Backbone.Model(layer.infowindow);
    this.infowindow.bind('change', function() {
      layer.infowindow = this.infowindow.toJSON();
      this._parent.setLayer(this._position, layer);
    }, this);
  }
};

CartoDBSubLayer.prototype = _.extend({}, SubLayerBase.prototype, {

  toJSON: function() {
    var json = {
      type: 'cartodb',
      options: {
        sql: this.getSQL(),
        cartocss: this.getCartoCSS(),
        cartocss_version: this.get('cartocss_version') || '2.1.0'
      }
    };

    var interactivity = this.getInteractivity();
    if (interactivity && interactivity.length > 0) {
      json.options.interactivity = interactivity;
      var attributes = this.getAttributes();
      if (attributes.length > 0) {
        json.options.attributes = {
          id: 'cartodb_id',
          columns: attributes
        }
      }
    }

    if (this.get('raster')) {
      json.options.raster = true;
      json.options.geom_column = "the_raster_webmercator";
      json.options.geom_type = "raster";
      json.options.raster_band = this.get('raster_band') || 0;
      // raster needs 2.3.0 to work
      json.options.cartocss_version = this.get('cartocss_version') || '2.3.0';
    }
    return json;
  },

  isValid: function() {
    return this.get('sql') && this.get('cartocss');
  },

  _onRemove: function() {
    this._unbindInteraction();
  },

  setSQL: function(sql) {
    return this.set({
      sql: sql
    });
  },

  setCartoCSS: function(cartocss) {
    return this.set({
      cartocss: cartocss
    });
  },

  setInteractivity: function(fields) {
    return this.set({
      interactivity: fields
    });
  },

  setInteraction: function(active) {
    this._parent.setInteraction(this._position, active);
  },

  getSQL: function() {
    return this.get('sql');
  },

  getCartoCSS: function() {
    return this.get('cartocss');
  },

  getInteractivity: function() {
    var interactivity = this.get('interactivity');
    if (interactivity) {
      if (typeof(interactivity) === 'string') {
        interactivity = interactivity.split(',');
      }
      return this._trimArrayItems(interactivity);
    }
  },

  getAttributes: function() {
    var columns = [];
    if (this.get('attributes')) {
      columns = this.get('attributes');
    } else {
      columns = _.map(this.infowindow.get('fields'), function(field){
        return field.name;
      });
    }
    return this._trimArrayItems(columns);
  },

  _trimArrayItems: function(array) {
    return _.map(array, function(item) {
      return item.trim();
    })
  }
});

module.exports = CartoDBSubLayer;
