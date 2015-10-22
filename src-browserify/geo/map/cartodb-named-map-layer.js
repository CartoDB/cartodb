var _ = require('underscore');
var MapLayer = require('./map-layer');

var CartoDBNamedMapLayer = MapLayer.extend({
  defaults: {
    visible: true,
    type: 'namedmap'
  },

  isEqual: function(other) {
    return _.isEqual(this.get('options').named_map, other.get('options').named_map);
  }

});

module.exports = CartoDBNamedMapLayer;
