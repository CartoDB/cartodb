var layerView = require('./leaflet-layer-view-fn');
var CartoDBGroupLayer = require('./leaflet-cartodb-group-layer');

var LeafletCartoDBLayerGroupView = layerView(CartoDBGroupLayer);

module.exports = LeafletCartoDBLayerGroupView;
