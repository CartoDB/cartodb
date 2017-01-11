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
    // Append the first latlng to "close" the polygon
    latlngs = latlngs.concat([ latlngs[0] ]);
    return this.convertLatlngsToLnglats(latlngs);
  },

  getPointLatLngFromGeoJSONCoords: function (geoJSON) {
    var lnglat = this.getGeometryCoordinates(geoJSON);
    return this.convertLngLatToLatLng(lnglat);
  },

  getPolylineLatLngsFromGeoJSONCoords: function (geoJSON) {
    var lnglats = this.getGeometryCoordinates(geoJSON);
    return this.convertLngLatsToLatLngs(lnglats);
  },

  getPolygonLatLngsFromGeoJSONCoords: function (geoJSON) {
    var lnglats = this.getGeometryCoordinates(geoJSON)[0];
    var latlngs = this.convertLngLatsToLatLngs(lnglats);
    // Remove the last latlng, which is duplicated
    latlngs = latlngs.slice(0, -1);
    return latlngs;
  },

  getMultiPointLatLngsFromGeoJSONCoords: function (geoJSON) {
    var lnglats = this.getGeometryCoordinates(geoJSON);
    return this.convertLngLatsToLatLngs(lnglats);
  },

  getMultiPolylineLatLngsFromGeoJSONCoords: function (geoJSON) {
    var lnglats = this.getGeometryCoordinates(geoJSON);
    return _.map(lnglats, function (lnglats) {
      return this.convertLngLatsToLatLngs(lnglats);
    }, this);
  },

  getMultiPolygonLatLngsFromGeoJSONCoords: function (geoJSON) {
    var lnglats = this.getGeometryCoordinates(geoJSON);
    return _.map(lnglats, function (lnglats) {
      // Remove the last latlng, which is duplicated
      var latlngs = this.convertLngLatsToLatLngs(lnglats[0]);
      latlngs = latlngs.slice(0, -1);
      return latlngs;
    }, this);
  }
};
