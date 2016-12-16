/* global google */
var MarkerAdapterBase = require('../base/marker-adapter-base');

var GMapsMarkerAdapter = function (nativeMarker) {
  this._listeners = {};
  this._nativeMarker = nativeMarker;
};

GMapsMarkerAdapter.prototype = new MarkerAdapterBase();
GMapsMarkerAdapter.prototype.constructor = GMapsMarkerAdapter;

GMapsMarkerAdapter.prototype.addToMap = function (gMapsMap) {
  this._nativeMarker.setMap(gMapsMap);
};

GMapsMarkerAdapter.prototype.removeFromMap = function (gMapsMap) {
  this._nativeMarker.setMap(null);
};

GMapsMarkerAdapter.prototype.isAddedToMap = function (gMapsMap) {
  return !!this._nativeMarker.getMap();
};

GMapsMarkerAdapter.prototype.getCoordinates = function () {
  var position = this._nativeMarker.getPosition();
  return {
    lat: position.lat(),
    lng: position.lng()
  };
};

GMapsMarkerAdapter.prototype.setCoordinates = function (coordinates) {
  var position = new google.maps.LatLng(coordinates[0], coordinates[1]);
  this._nativeMarker.setPosition(position);
};

GMapsMarkerAdapter.prototype.isDraggable = function () {
  return this._nativeMarker.getDraggable();
};

GMapsMarkerAdapter.prototype.getIconURL = function () {
  return (this._nativeMarker.getIcon() && this._nativeMarker.getIcon().url) ||
    this._nativeMarker.getIcon();
};

GMapsMarkerAdapter.prototype.setIconURL = function (iconURL, iconAnchor) {
  var icon = {
    url: iconURL,
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(iconAnchor[0], iconAnchor[1])
  };
  this._nativeMarker.setIcon(icon);
};

GMapsMarkerAdapter.prototype.on = function (eventName, callback) {
  var listener = this._nativeMarker.addListener(eventName, callback);
  this._listeners[eventName] = listener;
};

GMapsMarkerAdapter.prototype.off = function (eventName) {
  var listener = this._listeners[eventName];
  google.maps.event.removeListener(listener);
};

GMapsMarkerAdapter.prototype.trigger = function (eventName) {
  var eventArgs = Array.prototype.slice.call(arguments, 1);
  google.maps.event.trigger(this._nativeMarker, eventName, eventArgs);
};

module.exports = GMapsMarkerAdapter;
