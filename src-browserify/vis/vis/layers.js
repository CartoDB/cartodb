var _ = require('underscore');
var log = require('cdb.log');

// layer factory
var Layers = {

  _types: {},

  register: function(type, creatorFn) {
    this._types[type] = creatorFn;
  },

  create: function(type, vis, data) {
    if (!type) {
      log.error("creating a layer without type");
      return null;
    }
    var t = this._types[type.toLowerCase()];

    var c = {};
    c.type = type;
    _.extend(c, data, data.options);
    return new t(vis, c);
  },

  moduleForLayer: function(type) {
    if (type.toLowerCase() === 'torque') {
      return 'torque';
    }
    return null;
  },

  modulesForLayers: function(layers) {
    var modules = _(layers).map(function(layer) {
      return Layers.moduleForLayer(layer.type || layer.kind);
    });
    return _.compact(_.uniq(modules));
  }

};

module.exports = Layers;
