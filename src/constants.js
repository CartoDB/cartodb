module.exports = {
  OVERLAY_TYPES: {
    ATTRIBUTION: 'attribution',
    HEADER: 'header',
    LIMITS: 'limits',
    TILES: 'tiles',
    LOADER: 'loader',
    LOGO: 'logo',
    SEARCH: 'search',
    ZOOM: 'zoom'
  },

  MAP_PROVIDER_TYPES: {
    GMAPS: 'googlemaps',
    LEAFLET: 'leaflet'
  },

  GMAPS_BASE_LAYER_TYPES: ['roadmap', 'gray_roadmap', 'dark_roadmap', 'hybrid', 'satellite', 'terrain'],

  WINDSHAFT_ERRORS: {
    ANALYSIS: 'analysis',
    LAYER: 'layer',
    LIMIT: 'limit',
    TILE: 'tile', // Generic error for tiles
    GENERIC: 'generic',
    UNKNOWN: 'unknown'
  }
};
