var _ = require('underscore');
var wax = require('wax.cartodb.js');
var CartoDBDefaultOptions = require('./cartodb-default-options');
var Projector = require('./projector');
var CartoDBLayerGroupBase = require('./cartodb-layer-group-base');
var CartoDBLayerCommon = require('../cartodb-layer-common');
var CartoDBLogo = require('../cartodb-logo');

var CartoDBLayerGroupGMaps = function(opts) {

  this.options = _.defaults(opts, CartoDBDefaultOptions);
  this.tiles = 0;
  this.tilejson = null;
  this.interaction = [];

  // Add CartoDB logo
  if (this.options.cartodb_logo != false)
    CartoDBLogo.addWadus({ left: 74, bottom:8 }, 2000, this.options.map.getDiv());

  wax.g.connector.call(this, opts);

  // lovely wax connector overwrites options so set them again
  // TODO: remove wax.connector here
   _.extend(this.options, opts);
  this.projector = new Projector(opts.map);
  CartoDBLayerCommon.call(this);
  CartoDBLayerGroupBase.call(this);
};

CartoDBLayerGroupGMaps.Projector = Projector;
CartoDBLayerGroupGMaps.prototype = new wax.g.connector();
_.extend(CartoDBLayerGroupGMaps.prototype, CartoDBLayerGroupBase.prototype, CartoDBLayerCommon.prototype);
CartoDBLayerGroupGMaps.prototype.interactionClass = wax.g.interaction;

module.exports = CartoDBLayerGroupGMaps;
