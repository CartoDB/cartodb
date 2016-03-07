var LayerModelBase = require('./layer-model-base');

/**
 * this layer allows to put a plain color or image as layer (instead of tiles)
 */
var PlainLayer = LayerModelBase.extend({
  defaults: {
    type: 'Plain',
    base_type: "plain",
    className: "plain",
    color: '#FFFFFF',
    image: ''
  }
});

module.exports = PlainLayer;
