var _ = require('underscore');
var Backbone = require('backbone');
var Point = require('./point');
var GeometryBase = require('./geometry-base');

var PathBase = GeometryBase.extend({
  initialize: function () {
    GeometryBase.prototype.initialize.apply(this, arguments);
    this.points = new Backbone.Collection(null, { model: Point });
  },

  getLatLngs: function () {
    return this.points.map(function (point) {
      return point.get('latlng');
    });
  },

  setLatLngs: function (latlngs) {
    this.points.reset(_.map(latlngs, function (latlng) {
      return {
        latlng: latlng
      };
    }));
  },

  update: function (latlng) {
    this.points.add(new Point({
      latlng: latlng
    }));
  }
});

module.exports = PathBase;
