var _ = require('underscore');
var PathAdapterBase = require('../base/path-adapter-base');

var LeafletPathAdapter = function (nativePath) {
  this._nativePath = nativePath;
};

LeafletPathAdapter.prototype = new PathAdapterBase();
LeafletPathAdapter.prototype.constructor = LeafletPathAdapter;

LeafletPathAdapter.prototype.addToMap = function (leafletMap) {
  leafletMap.addLayer(this._nativePath);
};

LeafletPathAdapter.prototype.removeFromMap = function (leafletMap) {
  leafletMap.removeLayer(this._nativePath);
};

LeafletPathAdapter.prototype.isAddedToMap = function (leafletMap) {
  return leafletMap.hasLayer(this._nativePath);
};

LeafletPathAdapter.prototype.getCoordinates = function () {
  // L.Polygon#getLatLngs returns an array of arrays and
  // L.Path#getLatLngs returns an array of coordinates but we're
  // working with an array of coordinates internally and that's why
  // we're flattening latlngs
  var latlngs = _.flatten(this._nativePath.getLatLngs());
  return _.map(latlngs, function (latlng) {
    return {
      lat: latlng.lat,
      lng: latlng.lng
    };
  });
};

LeafletPathAdapter.prototype.setCoordinates = function (coordinates) {
  this._nativePath.setLatLngs(coordinates);
};

module.exports = LeafletPathAdapter;
