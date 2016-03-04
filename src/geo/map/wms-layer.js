var LayerModelBase = require('./layer-model-base');

/**
 * WMS layer support
 */
var WMSLayer = LayerModelBase.extend({
  defaults: {
    service: 'WMS',
    request: 'GetMap',
    version: '1.1.1',
    layers: '',
    styles: '',
    format: 'image/jpeg',
    transparent: false
  }
});

module.exports = WMSLayer;
