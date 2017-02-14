/* global google */
var _ = require('underscore');
var GMapsLayerView = require('./gmaps-layer-view');

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
      this._updateNativeMapOptions();
    },

    remove: function () { },

    _onModelUpdated: function () {
      this._updateNativeMapOptions();
    },

    _updateNativeMapOptions: function () {
      var styles = {};
      try {
        styles = JSON.parse(this.model.get('style'));
      } catch (e) {}
      this.gmapsMap.setOptions({
        mapTypeId: GOOGLE_MAP_TYPE_IDS[this.model.get('baseType')],
        styles: styles
      });
    }
  }
);

module.exports = GMapsBaseLayerView;
