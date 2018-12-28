var ENDPOINT = 'https://api.tomtom.com/search/2/search/{{address}}.json?key={{apiKey}}';

var TYPES = {
  'Geography': 'region',
  'Geography:Country': 'country',
  'Geography:CountrySubdivision': 'region',
  'Geography:CountrySecondarySubdivision': 'region',
  'Geography:CountryTertiarySubdivision': 'region',
  'Geography:Municipality': 'localadmin',
  'Geography:MunicipalitySubdivision': 'locality',
  'Geography:Neighbourhood': 'neighbourhood',
  'Geography:PostalCodeArea': 'postal-area',
  'Street': 'neighbourhood',
  'Address Range': 'neighbourhood',
  'Point Address': 'address',
  'Cross Street': 'address',
  'POI': 'venue'
};

function TomTomGeocoder () { }

TomTomGeocoder.geocode = function (address, apiKey) {
  if (!address) {
    throw new Error('TomTomGeocoder.geocode called with no address');
  }
  if (!apiKey) {
    throw new Error('TomTomGeocoder.geocode called with no apiKey');
  }
  return fetch(ENDPOINT.replace('{{address}}', address).replace('{{apiKey}}', apiKey))
    .then(function (response) {
      return response.json();
    })
    .then(function (response) {
      return _formatResponse(response);
    });
};

/**
 * Transform a tomtom geocoder response into an object more friendly for our search widget.
 * @param {object} rawTomTomResponse - The raw tomtom geocoding response, {@see https://developer.tomtom.com/search-api/search-api-documentation-geocoding/geocode}
 */
function _formatResponse (rawTomTomResponse) {
  if (!rawTomTomResponse.results.length) {
    return [];
  }

  const bestCandidate = rawTomTomResponse.results[0];
  return [{
    boundingbox: _getBoundingBox(bestCandidate),
    center: _getCenter(bestCandidate),
    type: _getType(bestCandidate)
  }];
}

/**
 * TomTom returns { lon, lat } while we use [lat, lon]
 */
function _getCenter (result) {
  return [result.position.lat, result.position.lon];
}

/**
 * Transform the feature type into a well known enum.
 */
function _getType (result) {
  let type = result.type;
  if (TYPES[type]) {
    if (type === 'Geography' && result.entityType) {
      type = type + ':' + result.entityType;
    }
    return TYPES[type];
  }

  return 'default';
}

/**
 * Transform the feature bbox into a carto.js well known format.
 */
function _getBoundingBox (result) {
  if (!result.viewport) {
    return;
  }
  const upperLeft = result.viewport.topLeftPoint;
  const bottomRight = result.viewport.btmRightPoint;

  return {
    south: bottomRight.lat,
    west: upperLeft.lon,
    north: upperLeft.lat,
    east: bottomRight.lon
  };
}

module.exports = TomTomGeocoder;
