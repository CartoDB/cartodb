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
    var newPoints = _.clone(this.points.models);
    newPoints.splice(at, 0, point);
    this.points.reset(newPoints);
  },

  removePoint: function (point) {
    var coordinates = this.getCoordinates();
    if (coordinates.length - 1 >= this.MIN_NUMBER_OF_VERTICES) {
      var index = coordinates.indexOf(point.getCoordinates());
      coordinates.splice(index, 1);
      this.setCoordinates(coordinates);
    }
  }
});

module.exports = PathBase;
