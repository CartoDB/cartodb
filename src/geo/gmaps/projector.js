/* global google */

function Projector (map) {
  this._map = map;
}

Projector.prototype.latLngToPixel = function (latlng) {
  var projection = this._map.getProjection();
  if (projection) {
    return projection.fromLatLngToPoint(latlng);
  }
  console.warn('Projector has no projection');
  return new google.maps.Point(0, 0);
};

Projector.prototype.pixelToLatLng = function (point) {
  var projection = this._map.getProjection();
  if (projection) {
    return projection.fromPointToLatLng(point);
  }
  console.warn('Projector has no projection');
  return new google.maps.LatLng(0, 0);
};

module.exports = Projector;
