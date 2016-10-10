var _ = require('underscore');
var Backbone = require('backbone');
var Polygon = require('./polygon');
var GeometryBase = require('./geometry-base');

var MultiPolygon = GeometryBase.extend({
  defaults: {
    type: 'multiPolygon'
  },

  initialize: function (attrs, options) {
    GeometryBase.prototype.initialize.apply(this, arguments);
    options = options || {};

    var polygons = [];
    if (options.latlngs) {
      polygons = _.map(options.latlngs, function (latlngs) {
        return new Polygon(null, { latlngs: latlngs });
      });
    }
    this.polygons = new Backbone.Collection(polygons);
  },

  isComplete: function () {
    // TODO ???
    return true;
  },

  getLatLngs: function () {
    return this.polygons.map('getLatLngs');
  },

  update: function (latlng) {
    // TODO: ????
  }
});

module.exports = MultiPolygon;
