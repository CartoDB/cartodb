const BoundingBox = require('./bounding-box');
const BoundingBoxLeaflet = require('./bounding-box-leaflet');
const BoundingBoxGoogleMaps = require('./bounding-box-gmaps');
const Category = require('./sql/category');
const Range = require('./sql/range');

/**
 *  @namespace carto.filter
 *  @api
 */
module.exports = {
  BoundingBox,
  BoundingBoxLeaflet,
  BoundingBoxGoogleMaps,
  Category,
  Range
};
