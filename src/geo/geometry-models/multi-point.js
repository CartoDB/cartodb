var _ = require('underscore');
var Backbone = require('backbone');
var Point = require('./point');
var GeometryBase = require('./geometry-base');

var MultiPoint = GeometryBase.extend({
  defaults: {
    editable: false,
    type: 'multiPoint'
  },

  initialize: function (attrs, options) {
    GeometryBase.prototype.initialize.apply(this, arguments);
    options = options || {};

    var points = [];
    if (options.latlngs) {
      points = _.map(options.latlngs, this._createPoint, this);
    }
    this.points = new Backbone.Collection(points);
  },

  getLatLngs: function () {
    return this.points.map(function (point) {
      return point.get('latlng');
    });
  },

  setLatLngs: function (latlngs) {
    this.points.reset(_.map(latlngs, this._createPoint, this));
  },

  update: function (latlng) {
    this.points.add(this._createPoint(latlng));
  },

  isComplete: function () {
    return this.points.all(function (point) {
      return point.isComplete();
    });
  },

  isEditable: function () {
    return !!this.get('editable');
  },

  _createPoint: function (latlng) {
    return new Point({
      latlng: latlng,
      editable: this.isEditable()
    });
  }
});

module.exports = MultiPoint;
