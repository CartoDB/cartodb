var _ = require('underscore');
var wax = require('wax.cartodb.js');
var CartoDBDefaultOptions = require('./cartodb-default-options');
var Projector = require('./projector');
var CartoDBLayerGroupBase = require('./cartodb-layer-group-base');
var LayerDefinition = require('../layer-definition/layer-definition');
var CartoDBLayerCommon = require('../cartodb-layer-common');
var CartoDBLogo = require('../cartodb-logo');

var CartoDBLayerGroupGMaps = function(opts) {

  this.options = _.defaults(opts, CartoDBDefaultOptions);
  this.tiles = 0;
  this.tilejson = null;
  this.interaction = [];

  if (!opts.layer_definition && !opts.sublayers) {
      throw new Error('cartodb-leaflet needs at least the layer_definition or sublayer list');
  }

  // if only sublayers is available, generate layer_definition from it
  if(!opts.layer_definition) {
    opts.layer_definition = LayerDefinition.layerDefFromSubLayers(opts.sublayers);
  }

  // Add CartoDB logo
  if (this.options.cartodb_logo != false)
    CartoDBLogo.addWadus({ left: 74, bottom:8 }, 2000, this.options.map.getDiv());

  wax.g.connector.call(this, opts);

  // lovely wax connector overwrites options so set them again
  // TODO: remove wax.connector here
   _.extend(this.options, opts);
  this.projector = new Projector(opts.map);
  LayerDefinition.call(this, opts.layer_definition, this.options);
  CartoDBLayerCommon.call(this);
  // precache
  this.update();
};

CartoDBLayerGroupGMaps.Projector = Projector;
CartoDBLayerGroupGMaps.prototype = new wax.g.connector();
_.extend(CartoDBLayerGroupGMaps.prototype, LayerDefinition.prototype, CartoDBLayerGroupBase.prototype, CartoDBLayerCommon.prototype);
CartoDBLayerGroupGMaps.prototype.interactionClass = wax.g.interaction;

module.exports = CartoDBLayerGroupGMaps;
