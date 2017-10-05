/* global google */

function Projector (map) {
  this._projection = map.getProjection();
  if (!this._projection) {
    google.maps.event.addListenerOnce(map, 'projection_changed', function () {
      this._projection = map.getProjection();
    }.bind(this));
  }
}

Projector.prototype.latLngToPixel = function (latlng) {
  if (this._projection) {
    return this._projection.fromLatLngToPoint(latlng);
  }
  console.warn('Projector has no projection');
  return new google.maps.Point(0, 0);
};

Projector.prototype.pixelToLatLng = function (point) {
  if (this._projection) {
    return this._projection.fromPointToLatLng(point);
  }
  console.warn('Projector has no projection');
  return new google.maps.LatLng(0, 0);
};

module.exports = Projector;
