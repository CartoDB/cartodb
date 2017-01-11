var _ = require('underscore');

var isCoordinateSimilar = function (coordinateA, coordinateB) {
  return coordinateA + 0.1 > coordinateB &&
         coordinateA - 0.1 < coordinateB;
};

module.exports = {
  areCoordinatesSimilar: function (coordinatesA, coordinatesB) {
    return _.every(coordinatesA, function (coordinate, index) {
      return isCoordinateSimilar(coordinate.lat, coordinatesB[index].lat) &&
        isCoordinateSimilar(coordinate.lng, coordinatesB[index].lng);
    });
  }
};
