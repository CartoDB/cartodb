var EditionController = function (mapView, map) {
  this._map = map;
  this._mapView = mapView;
};

EditionController.prototype.enableEdition = function (geometry) {
  this.disableEdition();

  this._geometry = geometry;
  this._map.addGeometry(this._geometry);

  this._werePopupsEnabled = this._map.arePopupsEnabled();
  this._map.disablePopups();
};

EditionController.prototype.disableEdition = function () {
  if (this._isEditionEnabled()) {
    this._geometry.remove();
    this._map.removeGeometry(this._geometry);
    delete this._geometry;
    this._reEnableOrDisablePopups();
  }
};

EditionController.prototype._isEditionEnabled = function () {
  return !!this._geometry;
};

EditionController.prototype._reEnableOrDisablePopups = function () {
  if (this._werePopupsEnabled) {
    this._map.enablePopups();
  } else {
    this._map.disablePopups();
  }
};

module.exports = EditionController;
