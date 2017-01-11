var _ = require('underscore');
var Backbone = require('backbone');
var Point = require('./point');
var GeometryBase = require('./geometry-base');

var PathBase = GeometryBase.extend({
  initialize: function (attrs, options) {
    GeometryBase.prototype.initialize.apply(this, arguments);
    options = options || {};

    this.points = new Backbone.Collection();
    if (options.latlngs) {
      this.points.reset(this._createPoints(options.latlngs));
    }
    this.points.on('change', this._triggerChangeEvent, this);
  },

  getCoordinates: function () {
    return this.points.map(function (point) {
      return point.getCoordinates();
    });
  },

  setCoordinates: function (latlngs) {
    this.points.reset(this._createPoints(latlngs));
    this._triggerChangeEvent();
  },

  getCoordinatesForMiddlePoints: function () {
    return this.getCoordinates();
  },

  update: function (latlng) {
    var latlngs = this.getCoordinates();
    latlngs.push(latlng);
    this.setCoordinates(latlngs);
  },

  _createPoints: function (latlngs) {
    return _.map(latlngs, this._createPoint, this);
  },

  _createPoint: function (latlng) {
    return new Point({
      latlng: latlng,
      editable: this.isEditable()
    });
  },

  addPoint: function (point, options) {
    options = options || {};
    var at = options.at || 0;
    this.points.add(point, { at: at });
  },

  removePoint: function (point) {
    this.points.remove(point);
  }
});

module.exports = PathBase;
