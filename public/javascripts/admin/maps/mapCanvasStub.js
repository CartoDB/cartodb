mapCanvasStub = function(map) { this.setMap(map); }
mapCanvasStub.prototype = new google.maps.OverlayView(); 
mapCanvasStub.prototype.draw = function() {};
mapCanvasStub.prototype.transformCoordinates = function(point) {
  return this.getProjection().fromContainerPixelToLatLng(point);
};
