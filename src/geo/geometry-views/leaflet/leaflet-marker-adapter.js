var L = require('leaflet');
var MarkerAdapterBase = require('../base/marker-adapter-base');

var LeafletMarkerAdapter = function (nativeMarker) {
  this._nativeMarker = nativeMarker;
};

LeafletMarkerAdapter.prototype = new MarkerAdapterBase();
LeafletMarkerAdapter.prototype.constructor = LeafletMarkerAdapter;

LeafletMarkerAdapter.prototype.addToMap = function (leafletMap) {
  leafletMap.addLayer(this._nativeMarker);
};

LeafletMarkerAdapter.prototype.removeFromMap = function (leafletMap) {
  leafletMap.removeLayer(this._nativeMarker);
};

LeafletMarkerAdapter.prototype.isAddedToMap = function (leafletMap) {
  return leafletMap.hasLayer(this._nativeMarker);
};

LeafletMarkerAdapter.prototype.getCoordinates = function () {
  var latLng = this._nativeMarker.getLatLng();
  return {
    lat: latLng.lat,
    lng: latLng.lng
  };
};

LeafletMarkerAdapter.prototype.setCoordinates = function (coordinates) {
  this._nativeMarker.setLatLng(coordinates);
};

LeafletMarkerAdapter.prototype.isDraggable = function () {
  return this._nativeMarker.options.draggable;
};

LeafletMarkerAdapter.prototype.getIconURL = function () {
  return this._nativeMarker.options.icon.options.iconUrl;
};

LeafletMarkerAdapter.prototype.setIconURL = function (iconURL) {
  var newIcon = L.icon({
    iconUrl: iconURL
  });
  this._nativeMarker.setIcon(newIcon);
};

LeafletMarkerAdapter.prototype.on = function () {
  this._nativeMarker.on.apply(this._nativeMarker, arguments);
};

LeafletMarkerAdapter.prototype.off = function () {
  this._nativeMarker.off.apply(this._nativeMarker, arguments);
};

LeafletMarkerAdapter.prototype.trigger = function () {
  this._nativeMarker.fire.apply(this._nativeMarker, arguments);
};

module.exports = LeafletMarkerAdapter;
