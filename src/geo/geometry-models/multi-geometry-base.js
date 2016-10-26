var _ = require('underscore');
var Backbone = require('backbone');
var GeometryBase = require('./geometry-base');

var MultiGeometryBase = GeometryBase.extend({
  initialize: function (attrs, options) {
    GeometryBase.prototype.initialize.apply(this, arguments);
    options = options || {};

    var geometries = [];
    if (options.latlngs) {
      geometries = _.map(options.latlngs, this._createGeometry, this);
    }
    this.geometries = new Backbone.Collection(geometries);
    this.geometries.on('change', this._triggerChangeEvent, this);
  },

  _createGeometry: function (latlngs) {
    throw new Error('subclasses of MultiGeometryBase must implement _createGeometry');
  },

  update: function (latlng) {},

  isComplete: function () {
    return this.geometries.all(function (geometry) {
      return geometry.isComplete();
    });
  }
});

module.exports = MultiGeometryBase;
