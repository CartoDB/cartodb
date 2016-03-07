var _ = require('underscore');
var log = require('cdb.log');

// TODO: can't use these requires since they in turn depends on this file (i.e. cyclic dependency), how to break?
// var TorqueLayer = require('./torque-layer');
// var CartoDBNamedMapLayer = require('./cartodb-named-map-layer');
var cdb = require('cdb'); // cdb.geo.TorqueLayer, cdb.geo.CartoDBNamedMapLayer
var Model = require('../../core/model');

// Map layer, could be tiled or whatever
var MapLayer = Model.extend({

  defaults: {
    visible: true,
    type: 'Tiled'
  },

  initialize: function () {
    this.bind('change:type', function () {
      log.error('changing layer type is not allowed, remove it and add a new one instead');
    });
  },

  // PUBLIC API METHODS

  remove: function () {
    this.trigger('destroy', this);
  },

  update: function (attrs) {
    // TODO: Pick the attributes for the specific type of layer
    // Eg: this.set(_.pick(attrs, this.ATTR_NAMES))
    this.set(attrs);
  },

  show: function () {
    this.set('visible', true);
  },

  hide: function () {
    this.set('visible', false);
  },

  toggle: function () {
    this.set('visible', !this.get('visible'));
  },

  // INTERNAL CartoDB.js METHODS

  /*
   * Compare the layer with the received one
   * @method isEqual
   * @param layer {Layer}
   */
  isEqual: function (layer) {
    var me = this.toJSON();
    var other = layer.toJSON();
    // Select params generated when layer is added to the map
    var map_params = ['id', 'order'];

    // Delete from the layers copy
    _.each(map_params, function (param) {
      delete me[param];
      delete other[param];
      if (me.options) delete me.options[param];
      if (other.options) delete other.options[param];
    });

    var myType = me.type ? me.type : me.options.type;
    var itsType = other.type ? other.type : other.options.type;
    var myTemplate;
    var itsTemplate;
    if (myType && (myType === itsType)) {
      if (myType === 'Tiled') {
        myTemplate = me.urlTemplate ? me.urlTemplate : me.options.urlTemplate;
        itsTemplate = other.urlTemplate ? other.urlTemplate : other.options.urlTemplate;
        var myName = me.name ? me.name : me.options.name;
        var itsName = other.name ? other.name : other.options.name;

        return myTemplate === itsTemplate && myName === itsName;
      } else if (myType === 'WMS') {
        myTemplate = me.urlTemplate ? me.urlTemplate : me.options.urlTemplate;
        itsTemplate = other.urlTemplate ? other.urlTemplate : other.options.urlTemplate;
        var myLayer = me.layers ? me.layers : me.options.layers;
        var itsLayer = other.layers ? other.layers : other.options.layers;
        return myTemplate === itsTemplate && myLayer === itsLayer;
      } else if (myType === 'torque') {
        return cdb.geo.TorqueLayer.prototype.isEqual.call(this, layer);
      } else if (myType === 'named_map') {
        return cdb.geo.CartoDBNamedMapLayer.prototype.isEqual.call(this, layer);
      } else { // same type but not tiled
        var myBaseType = me.base_type ? me.base_type : me.options.base_type;
        if (myBaseType) {
          if (_.isEqual(me, other)) {
            return true;
          } else {
            return false;
          }
        } else { // not gmaps
          return true;
        }
      }
    }
    return false; // different type
  }
});

module.exports = MapLayer;
