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
  return this._nativePath.getLatLngs();
};

LeafletPathAdapter.prototype.setCoordinates = function (coordinates) {
  this._nativePath.setLatLngs(coordinates);
};

module.exports = LeafletPathAdapter;
