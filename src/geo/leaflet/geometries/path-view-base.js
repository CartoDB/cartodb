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
    this.model.points.on('add', this._onPointsAdded, this);
    this.model.points.on('reset', this._onPointsResetted, this);

    this._geometry = this._createGeometry();
    this._pointViews = {};
  },

  _createGeometry: function () {
    throw new Error('Subclasses of MyLeafletPathViewBase must implement _createGeometry');
  },

  render: function () {
    this._renderPoints();
    this._geometry.addTo(this.leafletMap);
    this._updateModelsGeoJSON();
  },

  _renderPoints: function () {
    this.model.points.each(this._renderPoint, this);
  },

  _renderPoint: function (point) {
    var pointView = new PointView({
      model: point,
      nativeMap: this.leafletMap
    });
    this._pointViews[point.cid] = pointView;
    pointView.render();
  },

  _onPointsChanged: function () {
    this._updateGeometry();
    this._updateModelsGeoJSON();
  },

  _onPointsAdded: function () {
    var newPoints = this.model.points.select(function (point) {
      return !this._pointViews[point.cid];
    }, this);
    _.each(newPoints, this._renderPoint, this);
    this._updateGeometry();
    this._updateModelsGeoJSON();
  },

  _onPointsResetted: function () {
    this._removePoints();
    var newPoints = this.model.points.select(function (point) {
      return !this._pointViews[point.cid];
    }, this);
    _.each(newPoints, this._renderPoint, this);
    this._updateGeometry();
    this._updateModelsGeoJSON();
  },

  _updateGeometry: function () {
    this._geometry.setLatLngs(this.model.getLatLngs());
  },

  _updateModelsGeoJSON: function () {
    this.model.set({
      geojson: this._geometry.toGeoJSON()
    });
  },

  _onRemoveTriggered: function () {
    this._removePoints();
    this.leafletMap.removeLayer(this._geometry);
    this.remove();
  },

  _removePoints: function () {
    this.model.points.each(function (point) {
      point.remove();
    }, this);
  }
});

module.exports = PathViewBase;
