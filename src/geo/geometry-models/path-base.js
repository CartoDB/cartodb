var _ = require('underscore');
var Backbone = require('backbone');
var Point = require('./point');
var GeometryBase = require('./geometry-base');

var PathBase = GeometryBase.extend({
  initialize: function (attrs, options) {
    GeometryBase.prototype.initialize.apply(this, arguments);
    options = options || {};

    var latlngs = [];
    if (options.latlngs) {
      latlngs = _.map(options.latlngs, function (latlng) {
        return { latlng: latlng };
      });
    }
    this.points = new Backbone.Collection(latlngs, { model: Point });
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
