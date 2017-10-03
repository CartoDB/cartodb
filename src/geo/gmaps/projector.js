/* global google */

function Projector (map) {
  this._projection = map.getProjection();
  if (!this._projection) {
    google.maps.event.addListenerOnce(map, 'projection_changed', function () {
      this._projection = map.getProjection();
    });
  }
}

Projector.prototype.latLngToPixel = function (latlng) {
  if (this._projection) {
    return this._projection.fromLatLngToPoint(latlng);
  }
  // FIXME
  console.warn('Projector has no projection');
  return new google.maps.Point(latlng.lat(), latlng.lng());
};

Projector.prototype.pixelToLatLng = function (point) {
  if (this._projection) {
    return this._projection.fromPointToLatLng(point);
  }
  // FIXME
  console.warn('Projector has no projection');
  return new google.maps.LatLng(point.x, point.y);
};

module.exports = Projector;
