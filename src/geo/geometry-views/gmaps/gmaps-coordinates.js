var _ = require('underscore');

module.exports = {
  convertToGMapsCoordinates: function (coordinates) {
    return _.map(coordinates, function (coordinate) {
      return {
        lat: coordinate[0],
        lng: coordinate[1]
      };
    });
  }
};
