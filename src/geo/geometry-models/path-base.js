var _ = require('underscore');
var Backbone = require('backbone');
var Point = require('./point');
var GeometryBase = require('./geometry-base');

var PathBase = GeometryBase.extend({
  initialize: function (attrs, options) {
    GeometryBase.prototype.initialize.apply(this, arguments);
    options = options || {};

    var points = [];
    if (options.latlngs) {
      points = _.map(options.latlngs, this._createPoint, this);
    }
    this.points = new Backbone.Collection(points);
    this.points.on('change', this._triggerChangeEvent, this);
    this.points.on('reset', this._onPointsResetted, this);
  },

  getLatLngs: function () {
    return this.points.map(function (point) {
      return point.get('latlng');
    });
  },

  setLatLngs: function (latlngs) {
    this.points.reset(_.map(latlngs, this._createPoint, this));
    this._triggerChangeEvent();
  },

  update: function (latlng) {
    var latlngs = this.getLatLngs();
    latlngs.push(latlng);
    this.setLatLngs(latlngs);
  },

  remove: function () {
    GeometryBase.prototype.remove.apply(this);
    this._removePoints();
  },

  _createPoint: function (latlng) {
    return new Point({
      latlng: latlng,
      editable: this.isEditable()
    });
  },

  _onPointsResetted: function (collection, options) {
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
