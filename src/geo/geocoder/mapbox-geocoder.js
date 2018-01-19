var ENDPOINT = 'https://api.mapbox.com/geocoding/v5/mapbox.places/{{address}}?access_token=pk.eyJ1IjoiY2FydG8tdGVhbSIsImEiOiJjamF0MWt0ZTI0d3FwMndwZGF6cTVlMmZjIn0._IA8bIh1s9NjT-cejwUeNQ';

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

MapboxGeocoder.geocode = function (address, callback) {
  // callback([{
  //   center: {
  //     lon: -118.2439,
  //     lat: 34.0544
  //   },
  //   lon: -118.2439,
  //   lat: 34.0544,
  //   type: 'venue'
  // }]);

  return fetch(ENDPOINT.replace('{{address}}', address))
    .then(function (response) {
      return response.json();
    })
    .then(function (response) {
      if (typeof callback === 'function') {
        callback(_formatResponse(response));
      } else {
        return _formatResponse(response);
      }
    });
};

/**
 * Transform a mapbox geocoder response on a object friendly with our search widget.
 * @param {object} rawMapboxResponse - The raw mapbox geocoding response, {@see https://www.mapbox.com/api-documentation/?language=JavaScript#response-object}
 */
function _formatResponse (rawMapboxResponse) {
  var center = _getCenter(rawMapboxResponse.features[0]);
  return [{
    center: center,
    lat: center.lat,
    lon: center.lon,
    bbox: _getBoundingBox(rawMapboxResponse.features[0]),
    type: _getType(rawMapboxResponse.features[0])
  }];
}

/**
 * Transform a lat, lon array into an object.
 */
function _getCenter (feature) {
  return {
    lon: feature.center[0],
    lat: feature.center[1]
  };
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
  return {
    south: feature.bbox[0],
    west: feature.bbox[1],
    north: feature.bbox[2],
    east: feature.bbox[3]
  };
}

module.exports = MapboxGeocoder;
