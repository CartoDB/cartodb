var PathAdapterBase = function (nativePath) {};

PathAdapterBase.prototype.addToMap = function (nativeMap) {
  throw new Error('subclasses of PathAdapterBase must implement addToMap');
};

PathAdapterBase.prototype.removeFromMap = function (nativeMap) {
  throw new Error('subclasses of PathAdapterBase must implement removeFromMap');
};

PathAdapterBase.prototype.isAddedToMap = function (nativeMap) {
  throw new Error('subclasses of PathAdapterBase must implement isAddedToMap');
};

PathAdapterBase.prototype.getCoordinates = function () {
  throw new Error('subclasses of PathAdapterBase must implement getCoordinates');
};

PathAdapterBase.prototype.setCoordinates = function (coordinates) {
  throw new Error('subclasses of PathAdapterBase must implement setCoordinates');
};

module.exports = PathAdapterBase;
