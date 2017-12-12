var BoundingBox = require('./bounding-box');
var BoundingBoxLeaflet = require('./bounding-box-leaflet');
var BoundingBoxGoogleMaps = require('./bounding-box-gmaps');

/**
 *  @namespace carto.filter
 *  @api
 */
module.exports = {
  BoundingBox: BoundingBox,
  BoundingBoxLeaflet: BoundingBoxLeaflet,
  BoundingBoxGoogleMaps: BoundingBoxGoogleMaps
};
