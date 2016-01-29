var L = require('leaflet');
require('d3.cartodb');
var LeafletLayerView = require('./leaflet-layer-view');

var LeafletCartoDBLayerGroupView = L.CartoDBd3Layer.extend({
  includes: [
    LeafletLayerView.prototype
  ],

  initialize: function (layerModel, leafletMap) {
    LeafletLayerView.call(this, layerModel, this, leafletMap);
    L.CartoDBd3Layer.prototype.initialize.call(this);

    // Bind changes to the urls of the model
    layerModel.bind('change:urls', this._onTileJSONChanged, this);

    layerModel.layers.bind('change:cartocss', function (child, style) {
      var index = child.get('order') - 1;
      this.setCartoCSS(index, style);
    }, this);
  },

  _onTileJSONChanged: function () {
    var tilejson = this.model.get('urls');
    this.options.styles = this.model.layers.pluck('cartocss');
    this.setUrl(tilejson.tiles[0]);
  },

  // Invoked by LeafletLayerView
  _modelUpdated: function () {}
});

module.exports = LeafletCartoDBLayerGroupView;
