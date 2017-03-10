// Get coordinates from a GeoJSON

module.exports = function (geometry) {
  try {
    var geojson = JSON.parse(geometry);
    return geojson.coordinates.join(', ');
  } catch (e) {
    return false;
  }
};
