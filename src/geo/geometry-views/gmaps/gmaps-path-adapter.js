var _ = require('underscore');
var PathAdapterBase = require('../base/path-adapter-base');
var GMapsCoordinates = require('./gmaps-coordinates');

var GMapsPathAdapter = function (nativePath) {
  this._nativePath = nativePath;
};

GMapsPathAdapter.prototype = new PathAdapterBase();
GMapsPathAdapter.prototype.constructor = GMapsPathAdapter;

GMapsPathAdapter.prototype.addToMap = function (gMapsMap) {
  this._nativePath.setMap(gMapsMap);
};

GMapsPathAdapter.prototype.removeFromMap = function (gMapsMap) {
  this._nativePath.setMap(null);
};

GMapsPathAdapter.prototype.isAddedToMap = function (gMapsMap) {
  return !!this._nativePath.getMap();
};

GMapsPathAdapter.prototype.getCoordinates = function () {
  var path = this._nativePath.getPath();
  return _.map(path.getArray(), function (coordinates) {
    return {
      lat: coordinates.lat(),
      lng: coordinates.lng()
    };
  });
};

GMapsPathAdapter.prototype.setCoordinates = function (coordinates) {
  var path = GMapsCoordinates.convertToGMapsCoordinates(coordinates);
  this._nativePath.setPath(path);
};

module.exports = GMapsPathAdapter;
