var MapLayer = require('./map-layer');

/**
 * WMS layer support
 */
var WMSLayer = MapLayer.extend({
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
