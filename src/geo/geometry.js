var Model = require('../core/model');

/**
 * basic geometries, all of them based on geojson
 */
var Geometry = Model.extend({
  isPoint: function() {
    var type = this.get('geojson').type;
    if(type && type.toLowerCase() === 'point')
      return true;
    return false;
  }
});

module.exports = Geometry;
