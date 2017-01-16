/* global google */
// helper to get pixel position from latlon
var Projector = function (map) { this.setMap(map); };
Projector.prototype = new google.maps.OverlayView();
Projector.prototype.draw = function () {};
Projector.prototype.latLngToPixel = function (point) {
  var p = this.getProjection();
  if (p) {
    return p.fromLatLngToContainerPixel(point);
  }
  return new google.maps.Point(0, 0);
};
Projector.prototype.pixelToLatLng = function (point) {
  var p = this.getProjection();
  if (p) {
    return p.fromContainerPixelToLatLng(point);
  }
  return new google.maps.LatLng(0, 0);
};

module.exports = Projector;
