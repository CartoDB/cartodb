var _ = require('underscore');

module.exports = {
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
    latlngs.push(latlngs[0]);
    return this.convertLatlngsToLnglats(latlngs);
  }
};
