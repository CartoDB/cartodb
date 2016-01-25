/* global google */
var _ = require('underscore');
var DEFAULT_MAP_STYLE = require('./gmaps-default-map-style');
var GMapsLayerView = require('./gmaps-layer-view');

var GMapsBaseLayerView = function(layerModel, gmapsMap) {
  GMapsLayerView.call(this, layerModel, null, gmapsMap);
};

_.extend(
  GMapsBaseLayerView.prototype,
  GMapsLayerView.prototype,
  {
  _update: function() {
    var m = this.model;
    var types = {
      "roadmap":      google.maps.MapTypeId.ROADMAP,
      "gray_roadmap": google.maps.MapTypeId.ROADMAP,
      "dark_roadmap": google.maps.MapTypeId.ROADMAP,
      "hybrid":       google.maps.MapTypeId.HYBRID,
      "satellite":    google.maps.MapTypeId.SATELLITE,
      "terrain":      google.maps.MapTypeId.TERRAIN
    };

    this.gmapsMap.setOptions({
      mapTypeId: types[m.get('base_type')]
    });

    this.gmapsMap.setOptions({
      styles: m.get('style') || DEFAULT_MAP_STYLE
    });
  },
  remove: function() { }
});

module.exports = GMapsBaseLayerView;
