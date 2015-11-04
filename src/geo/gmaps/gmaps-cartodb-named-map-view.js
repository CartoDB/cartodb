var LayerGroupView = require('./gmaps-layer-group-view-fn')
var CartoDBNamedMapGmaps = require('./cartodb-named-map-gmaps');

var GMapsCartoDBNamedMapView = LayerGroupView(CartoDBNamedMapGmaps);

module.exports = GMapsCartoDBNamedMapView;
