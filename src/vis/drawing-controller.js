var DrawingController = function (mapView, map) {
  this._map = map;
  this._mapView = mapView;
};

DrawingController.prototype.enableDrawing = function (geometry) {
  this.disableDrawing();

  this._geometry = geometry;
  this._map.addGeometry(this._geometry);

  this._map.disableInteractivity();
  this._mapView.on('click', this._onMapClicked, this);
};

DrawingController.prototype.disableDrawing = function () {
  if (this._isDrawingEnabled()) {
    this._geometry.remove();
    this._map.removeGeometry(this._geometry);
    delete this._geometry;

    this._map.enableInteractivity();
    this._mapView.off('click', this._onMapClicked, this);
  }
};

DrawingController.prototype._isDrawingEnabled = function () {
  return !!this._geometry;
};

DrawingController.prototype._onMapClicked = function (event, latlng) {
  this._geometry.update(latlng);
};

module.exports = DrawingController;
