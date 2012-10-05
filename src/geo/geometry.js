

/**
 * basic geometries, all of them based on geojson
 */
cdb.geo.Geometry = Backbone.Model.extend({ 
  isPoint: function() {
    var type = this.get('geojson').type;
    if(type && type.toLowerCase() === 'point')
      return true;
    return false;
  }
});

cdb.geo.Geometries = Backbone.Collection.extend({});
