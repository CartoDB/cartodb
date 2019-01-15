var ENDPOINT = 'https://api.mapbox.com/geocoding/v5/mapbox.places-permanent/{{address}}.json?access_token={{access_token}}';

var TYPES = {
  country: 'country',
  region: 'region',
  postcode: 'postal-area',
  district: 'localadmin',
  place: 'venue',
  locality: 'locality',
  neighborhood: 'neighbourhood',
  address: 'address',
  poi: 'venue',
  'poi.landmark': 'venue'
};

function MapboxGeocoder () { }

MapboxGeocoder.geocode = function (address, token) {
  if (!address) {
    throw new Error('MapboxGeocoder.geocode called with no address');
  }
  if (!token) {
    throw new Error('MapboxGeocoder.geocode called with no access_token');
  }
  return fetch(ENDPOINT.replace('{{address}}', address).replace('{{access_token}}', token))
    .then(function (response) {
      return response.json();
    })
    .then(function (response) {
      return _formatResponse(response);
    });
};

/**
 * Transform a mapbox geocoder response on a object friendly with our search widget.
 * @param {object} rawMapboxResponse - The raw mapbox geocoding response, {@see https://www.mapbox.com/api-documentation/?language=JavaScript#response-object}
 */
function _formatResponse (rawMapboxResponse) {
  if (!rawMapboxResponse.features.length) {
    return [];
  }
  return [{
    boundingbox: _getBoundingBox(rawMapboxResponse.features[0]),
    center: _getCenter(rawMapboxResponse.features[0]),
    type: _getType(rawMapboxResponse.features[0])
  }];
}

/**
 * Mapbox returns [lon, lat] while we use [lat, lon]
 */
function _getCenter (feature) {
  return [feature.center[1], feature.center[0]];
}

/**
 * Transform the feature type into a well known enum.
 */
function _getType (feature) {
  if (TYPES[feature.place_type[0]]) {
    return TYPES[feature.place_type[0]];
  }
  return 'default';
}

/**
 * Transform the feature bbox into a carto.js well known format.
 */
function _getBoundingBox (feature) {
  if (!feature.bbox) {
    return;
  }
  return {
    south: feature.bbox[0],
    west: feature.bbox[1],
    north: feature.bbox[2],
    east: feature.bbox[3]
  };
}

module.exports = MapboxGeocoder;
