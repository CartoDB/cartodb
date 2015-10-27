var LeafletProxy = require('leaflet-proxy');
var config = require('config-proxy').get();
var LeafletCartoDBGroupLayer = require('./leaflet-cartodb-group-layer');
var LayerDefinition = require('../layer-definition/layer-definition');

var LeafletCartoDBLayer = LeafletCartoDBGroupLayer.extend({

  options: {
    query:          "SELECT * FROM {{table_name}}",
    opacity:        0.99,
    attribution:    config.get('cartodb_attributions'),
    debug:          false,
    visible:        true,
    added:          false,
    extra_params:   {},
    layer_definition_version: '1.0.0'
  },


  initialize: function (options) {
    var L = LeafletProxy.get();
    L.Util.setOptions(this, options);

    if (!options.table_name || !options.user_name || !options.tile_style) {
        throw ('cartodb-leaflet needs at least a CartoDB table name, user_name and tile_style');
    }

    LeafletCartoDBGroupLayer.prototype.initialize.call(this, {
      layer_definition: {
        version: this.options.layer_definition_version,
        layers: [{
          type: 'cartodb',
          options: this._getLayerDefinition(),
          infowindow: this.options.infowindow
        }]
      }
    });

    this.setOptions(this.options);
  },

  setQuery: function(layer, sql) {
    if(sql === undefined) {
      sql = layer;
      layer = 0;
    }
    sql = sql || 'select * from ' + this.options.table_name;
    LayerDefinition.prototype.setQuery.call(this, layer, sql);
  },

  /**
   * Returns if the layer is visible or not
   */
  isVisible: function() {
    return this.visible;
  },


  /**
   * Returns if the layer belongs to the map
   */
  isAdded: function() {
    return this.options.added;
  }

});

module.exports = LeafletCartoDBLayer;
