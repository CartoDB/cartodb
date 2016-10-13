var EditionController = function (mapView, map) {
  this._map = map;
  this._mapView = mapView;
};

EditionController.prototype.enableEdition = function (geometry) {
  this._geometry = geometry;
  this._map.addGeometry(this._geometry);

  this._map.disableInteractivity();
};

EditionController.prototype.disableEdition = function () {
  if (this._isEditionEnabled()) {
    this._geometry.remove();
    this._map.removeGeometry(this._geometry);
    delete this._geometry;

    this._map.enableInteractivity();
  }
};

EditionController.prototype._isEditionEnabled = function () {
  return !!this._geometry;
};

module.exports = EditionController;
