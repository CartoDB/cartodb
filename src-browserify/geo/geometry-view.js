var _ = require('underscore');
var Backbone = require('backbone');

/**
 * create a geometry
 * @param geometryModel geojson based geometry model, see cdb.geo.Geometry
 */
function GeometryView() { }

_.extend(GeometryView.prototype, Backbone.Events,{

  edit: function() {
    throw new Error("to be implemented");
  }

});

module.exports = GeometryView;
