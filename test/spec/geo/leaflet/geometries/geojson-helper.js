var _ = require('underscore');

var convertLatlngsToLnglats = function (latlngs) {
  return _.map(latlngs, function (lnglat) {
    return [lnglat[1], lnglat[0]];
  });
};

module.exports = {
  convertLatLngsToGeoJSONPolygonCoords: function (latlngs) {
    latlngs.push(latlngs[0]);
    return convertLatlngsToLnglats(latlngs);
  },

  convertLatLngsToGeoJSONPolylineCoords: function (latlngs) {
    return convertLatlngsToLnglats(latlngs);
  }
};
