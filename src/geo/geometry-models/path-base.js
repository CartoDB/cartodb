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
    this.points.on('reset', this._onPointsReset, this);
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

  update: function (latlng) {
    var latlngs = this.getCoordinates();
    latlngs.push(latlng);
    this.setCoordinates(latlngs);
  },

  remove: function () {
    GeometryBase.prototype.remove.apply(this);
    this._removePoints();
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

  _onPointsReset: function (collection, options) {
    this._removePoints(options.previousModels);
  },

  _removePoints: function (points) {
    points = points || this.points.models;
    _.each(points, function (point) {
      point.remove();
    }, this);
  }
});

module.exports = PathBase;
