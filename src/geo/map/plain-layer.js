var MapLayer = require('./map-layer');

/**
 * this layer allows to put a plain color or image as layer (instead of tiles)
 */
var PlainLayer = MapLayer.extend({
  defaults: {
    type: 'Plain',
    base_type: "plain",
    className: "plain",
    color: '#FFFFFF',
    image: ''
  }
});

module.exports = PlainLayer;
