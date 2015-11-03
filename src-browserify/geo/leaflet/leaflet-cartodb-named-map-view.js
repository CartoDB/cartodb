var layerView = require('./leaflet-layer-view-fn');
var LeafletNamedMap = require('./leaflet-named-map');

var LeafletCartoDBNamedMapView = layerView(LeafletNamedMap);

module.exports = LeafletCartoDBNamedMapView;
