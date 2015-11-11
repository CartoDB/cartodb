var L = require('leaflet');
var LeafletCartoDBGroupLayerBase = require('./leaflet-cartodb-group-layer-base');
var LeafletLayerView = require('./leaflet-layer-view');
var CartoDBLayerCommon = require('../cartodb-layer-common.js');

var LeafletNamedMap = LeafletCartoDBGroupLayerBase.extend({
  includes: [
    LeafletLayerView.prototype,
    CartoDBLayerCommon.prototype
  ],

  initialize: function (options) {
    options = options || {};
    // Set options
    L.Util.setOptions(this, options);

    this.fire = this.trigger;

    CartoDBLayerCommon.call(this);
    L.TileLayer.prototype.initialize.call(this);
    this.interaction = [];
    this.addProfiling();
  },

  _modelUpdated: function() {
  }
});

module.exports = LeafletNamedMap;
