var _ = require('underscore');
var MapLayer = require('./map-layer');

var TorqueLayer = MapLayer.extend({
  defaults: {
    type: 'torque',
    visible: true
  },

  isEqual: function(other) {
    var properties = ['query', 'query_wrapper', 'cartocss'];
    var self = this;
    return this.get('type') === other.get('type') && _.every(properties, function(p) {
      return other.get(p) === self.get(p);
    });
  }
});

module.exports = TorqueLayer;
