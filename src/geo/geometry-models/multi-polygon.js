var _ = require('underscore');
var Backbone = require('backbone');
var Polygon = require('./polygon');
var GeometryBase = require('./geometry-base');

var MultiPolygon = GeometryBase.extend({
  defaults: {
    type: 'multiPolygon',
    editable: false
  },

  initialize: function (attrs, options) {
    GeometryBase.prototype.initialize.apply(this, arguments);
    options = options || {};

    var polygons = [];
    if (options.latlngs) {
      polygons = _.map(options.latlngs, this._createPolygon, this);
    }
    this.polygons = new Backbone.Collection(polygons);
  },

  isComplete: function () {
    return this.polygons.all(function (polygon) {
      return polygon.isComplete();
    });
  },

  getLatLngs: function () {
    return this.polygons.map('getLatLngs');
  },

  update: function (latlng) {},

  isEditable: function () {
    return !!this.get('editable');
  },

  _createPolygon: function (latlngs) {
    var polygonAttrs = {};
    if (this.isEditable()) {
      polygonAttrs = {
        editable: true
      };
    }
    return new Polygon(polygonAttrs, { latlngs: latlngs });
  }
});

module.exports = MultiPolygon;
