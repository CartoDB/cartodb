var LeafletCartoDBGroupLayerBase = require('./leaflet-cartodb-group-layer-base');
var LayerDefinition = require('../layer-definition/layer-definition');

var LeafletCartoDBGroupLayer = LeafletCartoDBGroupLayerBase.extend({
  includes: [
    LayerDefinition.prototype,
  ],

  _modelUpdated: function() {
    this.setLayerDefinition(this.model.get('layer_definition'));
  }
});

module.exports = LeafletCartoDBGroupLayer;
