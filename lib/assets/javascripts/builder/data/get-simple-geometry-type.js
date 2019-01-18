var MAP = {
  'st_multipolygon': 'polygon',
  'st_polygon': 'polygon',
  'st_multilinestring': 'line',
  'st_linestring': 'line',
  'st_multipoint': 'point',
  'st_point': 'point'
};

/**
 * @param {String} val e.g. 'ST_MultiPoint'
 * @return {String} e.g. 'point'
 */
module.exports = function (val) {
  return MAP[val.toLowerCase()];
};
