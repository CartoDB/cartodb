var MapLayer = require('./map-layer');

var GMapsBaseLayer = MapLayer.extend({
  OPTIONS: ['roadmap', 'satellite', 'terrain', 'custom'],
  defaults: {
    type: 'GMapsBase',
    base_type: 'gray_roadmap',
    style: null
  }
});

module.exports = GMapsBaseLayer;
