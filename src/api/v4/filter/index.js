const BoundingBox = require('./bounding-box');
const BoundingBoxLeaflet = require('./bounding-box-leaflet');
const BoundingBoxGoogleMaps = require('./bounding-box-gmaps');
const Category = require('./category');
const Range = require('./range');
const { AND, OR } = require('../../../filters/filters-collection');

/**
 *  @namespace carto.filter
 *  @api
 */
module.exports = {
  BoundingBox,
  BoundingBoxLeaflet,
  BoundingBoxGoogleMaps,
  Category,
  Range,
  AND,
  OR
};
