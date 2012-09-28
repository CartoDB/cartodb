

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
cdb.geo.Point = Backbone.Model.extend({ });
cdb.geo.Polygon = Backbone.Model.extend({ });
cdb.geo.PolyLine = Backbone.Model.extend({ });

cdb.geo.Geometries = Backbone.Collection.extend({
});
