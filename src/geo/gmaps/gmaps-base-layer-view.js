/* global google */
var _ = require('underscore');
var GMapsLayerView = require('./gmaps-layer-view');

var DEFAULT_MAP_STYLE = require('./gmaps-default-map-style');
var GOOGLE_MAP_TYPE_IDS = {
  'roadmap': google.maps.MapTypeId.ROADMAP,
  'gray_roadmap': google.maps.MapTypeId.ROADMAP,
  'dark_roadmap': google.maps.MapTypeId.ROADMAP,
  'hybrid': google.maps.MapTypeId.HYBRID,
  'satellite': google.maps.MapTypeId.SATELLITE,
  'terrain': google.maps.MapTypeId.TERRAIN
};

var GMapsBaseLayerView = function (layerModel, gmapsMap) {
  GMapsLayerView.call(this, layerModel, gmapsMap);
};

_.extend(
  GMapsBaseLayerView.prototype,
  GMapsLayerView.prototype, {
    addToMap: function () {
      this.gmapsMap.setOptions({
        mapTypeId: GOOGLE_MAP_TYPE_IDS[this.model.get('base_type')],
        styles: this.model.get('style') || DEFAULT_MAP_STYLE
      });
    },

    remove: function () { },

    _onModelUpdated: function () {
      this.gmapsMap.setOptions({
        mapTypeId: GOOGLE_MAP_TYPE_IDS[this.model.get('base_type')],
        styles: this.model.get('style') || DEFAULT_MAP_STYLE
      });
    }
  }
);

module.exports = GMapsBaseLayerView;
