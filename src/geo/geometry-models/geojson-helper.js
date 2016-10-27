var _ = require('underscore');

var getGeometry = function (geoJSON) {
  return geoJSON.geometry || geoJSON;
};

module.exports = {
  getGeometryType: function (geoJSON) {
    return getGeometry(geoJSON).type;
  },

  getGeometryCoordinates: function (geoJSON) {
    return getGeometry(geoJSON).coordinates;
  },

  convertLatlngsToLnglats: function (latlngs) {
    return _.map(latlngs, this.convertLatlngToLngLat);
  },

  convertLatlngToLngLat: function (latlng) {
    return [latlng[1], latlng[0]];
  },

  convertLngLatsToLatLngs: function (lnglats) {
    return _.map(lnglats, this.convertLngLatToLatLng);
  },

  convertLngLatToLatLng: function (lnglat) {
    return [ lnglat[1], lnglat[0] ];
  },

  convertLatLngsToGeoJSONPointCoords: function (latlng) {
    return this.convertLatlngToLngLat(latlng);
  },

  convertLatLngsToGeoJSONPolylineCoords: function (latlngs) {
    return this.convertLatlngsToLnglats(latlngs);
  },

  convertLatLngsToGeoJSONPolygonCoords: function (latlngs) {
    latlngs = latlngs.concat([ latlngs[0] ]);
    return this.convertLatlngsToLnglats(latlngs);
  }
};
