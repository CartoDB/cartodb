var _ = require('underscore');
var L = require('leaflet');
var LeafletLayerView = require('./leaflet-layer-view');

var stamenSubstitute = function stamenSubstitute(type) {
  return {
    url: 'http://{s}.basemaps.cartocdn.com/'+ type +'_all/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    attribution: 'Map designs by <a href="http://stamen.com/">Stamen</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, Provided by <a href="https://carto.com">CARTO</a>'
  };
};

var nokiaSubstitute = function nokiaSubstitute(type) {
  return {
    url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/'+ type +'.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
    subdomains: '1234',
    minZoom: 0,
    maxZoom: 21,
    attribution: '©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a>'
  };
};

var substitutes = {
  roadmap: nokiaSubstitute('normal'),
  gray_roadmap: stamenSubstitute('light'),
  dark_roadmap: stamenSubstitute('dark'),
  hybrid: nokiaSubstitute('hybrid'),
  terrain: nokiaSubstitute('terrain'),
  satellite: nokiaSubstitute('satellite')
};

var LeafletGmapsTiledLayerView = L.TileLayer.extend({
  initialize: function(layerModel, leafletMap) {
    var substitute = substitutes[layerModel.get('baseType')];
    L.TileLayer.prototype.initialize.call(this, substitute.url, {
      tms:          false,
      attribution:  substitute.attribution,
      minZoom:      substitute.minZoom,
      maxZoom:      substitute.maxZoom,
      subdomains:   substitute.subdomains,
      errorTileUrl: '',
      opacity:      1
    });
    LeafletLayerView.call(this, layerModel, this, leafletMap);
  }

});

_.extend(LeafletGmapsTiledLayerView.prototype, LeafletLayerView.prototype, {

  _modelUpdated: function() {
    // do nothing, this map type does not support updating
  }

});

module.exports = LeafletGmapsTiledLayerView;
