var CartoDBLayerGroupBase = require('./cartodb-layer-group-base');

var CartoDBLayerGroupNamedMap = CartoDBLayerGroupBase.extend({
  defaults: {
    type: 'namedmap'
  },

  // Returns the index of the CartoDB layer in relation to all layers when the map is
  // an "Named Map". In this case Windshaft knows about all layers (even the not visible ones)
  // and the windshaft map template includes the basemap so we just need to return the given
  // index increased by one.
  _getIndexOfVisibleLayer: function (layerIndex) {
    return ++layerIndex;
  }
});

module.exports = CartoDBLayerGroupNamedMap;
