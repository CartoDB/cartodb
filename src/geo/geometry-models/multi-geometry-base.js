var _ = require('underscore');
var Backbone = require('backbone');
var GeometryBase = require('./geometry-base');

var MultiGeometryBase = GeometryBase.extend({
  initialize: function (attrs, options) {
    GeometryBase.prototype.initialize.apply(this, arguments);
    options = options || {};

    this.geometries = new Backbone.Collection();
    if (options.latlngs) {
      this.geometries.reset(this._createGeometries(options.latlngs));
    }
    this.geometries.on('change', this._triggerChangeEvent, this);
    this.geometries.on('reset', this._onGeometriesReset, this);
  },

  _createGeometries: function (latlngs) {
    return _.map(latlngs, this._createGeometry, this);
  },

  _createGeometry: function (latlngs) {
    throw new Error('subclasses of MultiGeometryBase must implement _createGeometry');
  },

  update: function (latlng) {},

  remove: function () {
    GeometryBase.prototype.remove.apply(this);
    this._removeGeometries();
  },

  isComplete: function () {
    return this.geometries.all(function (geometry) {
      return geometry.isComplete();
    });
  },

  _onGeometriesReset: function (collection, options) {
    this._removeGeometries(options.previousModels);
    this._triggerChangeEvent();
  },

  _removeGeometries: function (geometries) {
    geometries = geometries || this.geometries.models;
    _.each(geometries, function (geometry) {
      geometry.remove();
    }, this);
  }
});

module.exports = MultiGeometryBase;
