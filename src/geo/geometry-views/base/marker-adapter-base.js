var MarkerAdapterBase = function (nativeMarker) {};

MarkerAdapterBase.prototype.addToMap = function (nativeMap) {
  throw new Error('subclasses of MarkerAdapterBase must implement addToMap');
};

MarkerAdapterBase.prototype.removeFromMap = function (nativeMap) {
  throw new Error('subclasses of MarkerAdapterBase must implement removeFromMap');
};

MarkerAdapterBase.prototype.isAddedToMap = function (leafletMap) {
  throw new Error('subclasses of MarkerAdapterBase must implement isAddedToMap');
};

MarkerAdapterBase.prototype.getCoordinates = function () {
  throw new Error('subclasses of MarkerAdapterBase must implement getCoordinates');
};

MarkerAdapterBase.prototype.setCoordinates = function (coordinates) {
  throw new Error('subclasses of MarkerAdapterBase must implement setCoordinates');
};

MarkerAdapterBase.prototype.isDraggable = function () {
  throw new Error('subclasses of MarkerAdapterBase must implement isDraggable');
};

MarkerAdapterBase.prototype.getIconURL = function () {
  throw new Error('subclasses of MarkerAdapterBase must implement getIconURL');
};

MarkerAdapterBase.prototype.setIcon = function (iconURL, iconAnchor) {
  throw new Error('subclasses of MarkerAdapterBase must implement setIcon');
};

MarkerAdapterBase.prototype.on = function () {
  throw new Error('subclasses of MarkerAdapterBase must implement on');
};

MarkerAdapterBase.prototype.off = function () {
  throw new Error('subclasses of MarkerAdapterBase must implement off');
};

MarkerAdapterBase.prototype.trigger = function () {
  throw new Error('subclasses of MarkerAdapterBase must implement trigger');
};

module.exports = MarkerAdapterBase;
