
function isLeafletLoaded () {
  if (!window.L) {
    throw new Error('Leaflet is required');
  }
  if (window.L.version < '1.0.0') {
    throw new Error('Leaflet +1.0 is required');
  }
}

function isGoogleMapsLoaded () {
  if (!window.google) {
    throw new Error('Google Maps is required');
  }
  if (!window.google.maps) {
    throw new Error('Google Maps is required');
  }
  if (window.google.maps.version < '3.0.0') {
    throw new Error('Google Maps +3.0 is required');
  }
}

module.exports = {
  isLeafletLoaded: isLeafletLoaded,
  isGoogleMapsLoaded: isGoogleMapsLoaded
};
