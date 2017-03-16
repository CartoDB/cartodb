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
  // Leaflet provides the `setIcon` method which generates a new img for the icon.
  // We want to be able to update the markers icon while it's being dragged. That's
  // why we're doing this little hack that changes the src of the existing marker img.
  // Removing the image and adding a new one we lost the mousedown event so drag is not
  // working, reusing the node, we avoid some extra browser work and reuse the attached
  // events, having the desired behaviour.
  this._nativeMarker._icon.src = iconURL;
  this._nativeMarker.options.icon.options.iconUrl = iconURL;
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
