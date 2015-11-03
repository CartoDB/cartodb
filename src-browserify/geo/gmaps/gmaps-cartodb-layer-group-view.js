var LayerGroupView = require('./gmaps-layer-group-view-fn')
var CartoDBLayerGroupGmaps = require('./cartodb-layer-group-gmaps');

var GMapsCartoDBLayerGroupView = LayerGroupView(CartoDBLayerGroupGmaps);

module.exports = GMapsCartoDBLayerGroupView;
