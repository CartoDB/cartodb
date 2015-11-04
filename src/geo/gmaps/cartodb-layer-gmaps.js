var _ = require('underscore');
var config = require('cdb.config');
var CartoDBLayerGroupGMaps = require('./cartodb-layer-group-gmaps');
var LayerDefinition = require('../layer-definition/layer-definition');

var CartoDBLayerGMaps = function(options) {

  var default_options = {
    query:          "SELECT * FROM {{table_name}}",
    opacity:        0.99,
    attribution:    config.get('cartodb_attributions'),
    opacity:        1,
    debug:          false,
    visible:        true,
    added:          false,
    extra_params:   {},
    layer_definition_version: '1.0.0'
  };

  this.options = _.defaults(options, default_options);

  if (!options.table_name || !options.user_name || !options.tile_style) {
      throw ('cartodb-gmaps needs at least a CartoDB table name, user_name and tile_style');
  }


  this.options.layer_definition = {
    version: this.options.layer_definition_version,
    layers: [{
      type: 'cartodb',
      options: this._getLayerDefinition(),
      infowindow: this.options.infowindow
    }]
  };
  CartoDBLayerGroupGMaps.call(this, this.options);

  this.setOptions(this.options);

};

_.extend(CartoDBLayerGMaps.prototype, CartoDBLayerGroupGMaps.prototype);

CartoDBLayerGMaps.prototype.setQuery = function (layer, sql) {
  if(sql === undefined) {
    sql = layer;
    layer = 0;
  }
  sql = sql || 'select * from ' + this.options.table_name;
  LayerDefinition.prototype.setQuery.call(this, layer, sql);
};

module.exports = CartoDBLayerGMaps;
