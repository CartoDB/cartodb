var L = require('leaflet-proxy').get();
var LeafletCartoDBGroupLayerBase = require('./leaflet-cartodb-group-layer-base');
var LeafletLayerView = require('./leaflet-layer-view');
var NamedMap = require('../layer-definition/named-map');
var CartoDBLayerCommon = require('../cartodb-layer-common.js');

var LeafletNamedMap = LeafletCartoDBGroupLayerBase.extend({
  includes: [
    LeafletLayerView.prototype,
    NamedMap.prototype,
    CartoDBLayerCommon.prototype
  ],

  initialize: function (options) {
    options = options || {};
    // Set options
    L.Util.setOptions(this, options);

    // Some checks
    if (!options.named_map && !options.sublayers) {
        throw new Error('cartodb-leaflet needs at least the named_map');
    }

    NamedMap.call(this, this.options.named_map, this.options);

    this.fire = this.trigger;

    CartoDBLayerCommon.call(this);
    L.TileLayer.prototype.initialize.call(this);
    this.interaction = [];
    this.addProfiling();
  },

  _modelUpdated: function() {
    this.setLayerDefinition(this.model.get('named_map'));
  }
});

module.exports = LeafletNamedMap;
