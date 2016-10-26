var _ = require('underscore');

var convertLatlngsToLnglats = function (latlngs) {
  return _.map(latlngs, convertLatlngToLngLat);
};

var convertLatlngToLngLat = function (latlng) {
  return [latlng[1], latlng[0]];
};

module.exports = {
  convertLatLngsToGeoJSONPolygonCoords: function (latlngs) {
    latlngs.push(latlngs[0]);
    return convertLatlngsToLnglats(latlngs);
  },

  convertLatLngsToGeoJSONPolylineCoords: function (latlngs) {
    return convertLatlngsToLnglats(latlngs);
  },

  convertLatLngsToGeoJSONPointCoords: function (latlng) {
    return convertLatlngToLngLat(latlng);
  }
};
