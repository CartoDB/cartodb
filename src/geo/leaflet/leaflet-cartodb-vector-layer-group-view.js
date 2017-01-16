require('d3.cartodb');// TODO: The 'd3.cartodb' module doens't currently export L.CartoDBd3Layer
// and it's currently relying on window.L so weed to do the following trick.
// Check out: https://github.com/CartoDB/d3.cartodb/issues/93 for more info
var CartoDBd3Layer = window.L.CartoDBd3Layer;
var LeafletLayerView = require('./leaflet-layer-view');
var GeoJSONDataProvider = require('../data-providers/geojson/data-provider');

var LeafletCartoDBVectorLayerGroupView = CartoDBd3Layer.extend({
  includes: [
    LeafletLayerView.prototype
  ],

  // TODO: There's a conflict between LeafletLayerView.protoype.on
  // and L.CartoDBd3Layer.prototype.on. The GeoJSONDataProvider needs
  // to use the former one, so we have to add an alias.
  _on: CartoDBd3Layer.prototype.on,

  initialize: function (layerGroupModel, leafletMap) {
    LeafletLayerView.call(this, layerGroupModel, this, leafletMap);
    CartoDBd3Layer.prototype.initialize.call(this);

    // Bind changes to the urls of the model
    layerGroupModel.bind('change:urls', this._onURLsChanged, this);

    layerGroupModel.each(this._onLayerAdded, this);
    layerGroupModel.onLayerAdded(this._onLayerAdded.bind(this));

    this._on('featureClick', function (event, latlng, pos, data, layerIndex) {
      this.trigger('featureClick', {
        layer: this.model.getLayerAt(layerIndex),
        layerIndex: layerIndex,
        latlng: latlng,
        position: pos,
        feature: data
      });
    }.bind(this));

    this._on('featureOver', function (event, latlng, pos, data, layerIndex) {
      this.trigger('featureOver', {
        layer: this.model.getLayerAt(layerIndex),
        layerIndex: layerIndex,
        latlng: latlng,
        position: pos,
        feature: data
      });
    }.bind(this));

    this._on('featureOut', function (event, latlng, pos, data, layerIndex) {
      this.trigger('featureOut', {
        layer: this.model.getLayerAt(layerIndex),
        layerIndex: layerIndex
      });
    }.bind(this));
  },

  _onLayerAdded: function (layerModel, layerIndex) {
    // Set the dataProvider
    layerModel.setDataProvider(new GeoJSONDataProvider(this, layerIndex));

    layerModel.bind('change:cartocss', function (layerModel, style) {
      var index = layerModel.get('order') - 1;
      this.setCartoCSS(index, style);
    }, this);

    layerModel.bind('change:meta', function (layerModel, meta) {
      this.options.styles[layerIndex] = meta.cartocss;
    }, this);
  },

  _onURLsChanged: function () {
    this.setUrl(this.model.getTileURLTemplates()[0]);
  },

  onAdd: function (map) {
    CartoDBd3Layer.prototype.onAdd.call(this, map);
    this.trigger('added', this);
    this.added = true;
  },

  // Invoked by LeafletLayerView
  _modelUpdated: function () {}
});

module.exports = LeafletCartoDBVectorLayerGroupView;
