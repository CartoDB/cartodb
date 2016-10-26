var _ = require('underscore');
var View = require('../../../core/view');
var PointView = require('./point-view');

var PathViewBase = View.extend({
  initialize: function (options) {
    View.prototype.initialize.apply(this, arguments);

    if (!options.model) throw new Error('model is required');
    if (!options.nativeMap) throw new Error('nativeMap is required');

    this.model = this.model || options.model;
    this.leafletMap = options.nativeMap;

    this.model.on('remove', this._onRemoveTriggered, this);
    this.model.points.on('change', this._onPointsChanged, this);
    this.model.points.on('reset', this._onPointsResetted, this);

    this._geometry = this._createGeometry();
  },

  _createGeometry: function () {
    throw new Error('Subclasses of MyLeafletPathViewBase must implement _createGeometry');
  },

  render: function () {
    this._renderPoints();
    this._geometry.addTo(this.leafletMap);
  },

  _renderPoints: function () {
    this.model.points.each(this._renderPoint, this);
  },

  _renderPoint: function (point) {
    var pointView = new PointView({
      model: point,
      nativeMap: this.leafletMap
    });
    pointView.render();
  },

  _onPointsChanged: function () {
    this._updateGeometry();
  },

  _onPointsResetted: function (collection, options) {
    this._removePoints(options.previousModels);
    this.model.points.each(this._renderPoint, this);
    this._updateGeometry();
  },

  _updateGeometry: function () {
    this._geometry.setLatLngs(this.model.getLatLngs());
  },

  _onRemoveTriggered: function () {
    this._removePoints();
    this.leafletMap.removeLayer(this._geometry);
    this.remove();
  },

  _removePoints: function (points) {
    points = points || this.model.points.models;
    _.each(points, function (point) {
      point.remove();
    }, this);
  }
});

module.exports = PathViewBase;
