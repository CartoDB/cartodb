/* global google */
// helper to get pixel position from latlon

function Projector (map) {
  this.setMap(map);
}
Projector.prototype = new google.maps.OverlayView();
Projector.prototype.draw = function () {};
Projector.prototype.latLngToPixel = function (latlng) {
  var projection = this.getProjection();
  if (projection) {
    return projection.fromLatLngToContainerPixel(latlng);
  }
  console.warn('Projector has no projection');
  return new google.maps.Point(0, 0);
};

Projector.prototype.pixelToLatLng = function (point) {
  var projection = this.getProjection();
  if (projection) {
    return projection.fromContainerPixelToLatLng(point);
  }
  console.warn('Projector has no projection');
  return new google.maps.LatLng(0, 0);
};

module.exports = Projector;
