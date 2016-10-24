var DrawingController = require('./drawing-controller');
var EditionController = require('./edition-controller');

var GeometryManagementController = function (mapView, map) {
  this._drawingController = new DrawingController(mapView, map);
  this._editionController = new EditionController(mapView, map);

  map.on('enterDrawingMode', this._enterDrawingMode, this);
  map.on('exitDrawingMode', this._exitDrawingMode, this);
  map.on('enterEditMode', this._enterEditMode, this);
  map.on('exitEditMode', this._exitEditMode, this);
};

GeometryManagementController.prototype._enterDrawingMode = function (geometry) {
  this._exitDrawingMode();
  this._exitEditMode();
  this._drawingController.enableDrawing(geometry);
};

GeometryManagementController.prototype._exitDrawingMode = function () {
  this._drawingController.disableDrawing();
};

GeometryManagementController.prototype._enterEditMode = function (geometry) {
  this._exitDrawingMode();
  this._exitEditMode();
  this._editionController.enableEdition(geometry);
};

GeometryManagementController.prototype._exitEditMode = function () {
  this._editionController.disableEdition();
};

module.exports = GeometryManagementController;
