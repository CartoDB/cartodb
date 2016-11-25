var _ = require('underscore');
var GeometryViewBase = require('./geometry-view-base');
var Point = require('../../geometry-models/point.js');
var PointView = require('./point-view');

var PathViewBase = GeometryViewBase.extend({
  initialize: function (options) {
    GeometryViewBase.prototype.initialize.apply(this, arguments);

    this.model.points.on('change', this._onPointsChanged, this);
    this.model.points.on('reset', this._onPointsResetted, this);
    this.add_related_model(this.model.points);

    this._geometry = this._createGeometry();

    this._middlePoints = [];
    this._middlePointViews = {};

    _.bindAll(this, '_renderMiddlePoints');

    this.leafletMap.on('zoomend', this._renderMiddlePoints);
  },

  _createGeometry: function () {
    throw new Error('Subclasses of MyLeafletPathViewBase must implement _createGeometry');
  },

  render: function () {
    this._renderPoints();
    this._renderMiddlePoints();

    this._geometry.addTo(this.leafletMap);
  },

  _renderPoints: function () {
    this.model.points.each(this._renderPoint, this);
  },

  _renderPoint: function (point) {
    var pointView = this._createPointView(point);
    pointView.render();
  },

  _renderMiddlePoints: function () {
    if (this.model.isExpandable()) {
      this._clearMiddlePoints();
      this._middlePoints = this._calculateMiddlePoints();
      _.each(this._middlePoints, this._renderMiddlePoint, this);
    }
  },

  _calculateMiddlePoints: function () {
    var coordinates = this._getCoordinatesForMiddlePoints();
    return _.map(coordinates.slice(0, -1), function (latLngA, index) {
      var latLngB = coordinates[index + 1];
      return new Point({
        latlng: this._computeMidLatLng(latLngA, latLngB),
        editable: true,
        iconUrl: Point.MIDDLE_POINT_ICON_URL
      });
    }.bind(this));
  },

  _getCoordinatesForMiddlePoints: function () {
    return this.model.getCoordinates();
  },

  _computeMidLatLng: function (latLngA, latLngB) {
    var leftPoint = this.leafletMap.latLngToContainerPoint(latLngA);
    var rightPoint = this.leafletMap.latLngToContainerPoint(latLngB);
    var y = (leftPoint.y + rightPoint.y) / 2;
    var x = (leftPoint.x + rightPoint.x) / 2;
    var latlng = this.leafletMap.containerPointToLatLng([x, y]);
    return [ latlng.lat, latlng.lng ];
  },

  _renderMiddlePoint: function (point, index) {
    var pointView = this._createPointView(point);
    this._middlePointViews[this._getPointKey(point)] = pointView;
    pointView.render();
    pointView.once('mousedown', function (point) {
      // point is no longer a middlePoint so we remove it
      var indexOfMiddlePoint = this._middlePoints.indexOf(point);
      this._middlePoints.splice(indexOfMiddlePoint, 1);

      // "Transform" the middle point marker to a regular point marker
      point.set({
        iconUrl: Point.prototype.defaults.iconUrl
      });

      // Add the coordinates of the new point to the path
      this.model.addPoint(point, { at: index + 1 });
    }.bind(this));
    this.addView(pointView);
  },

  _clearMiddlePoints: function () {
    _.each(this._middlePoints, function (point) {
      point.remove();
    });
  },

  _createPointView: function (point) {
    var pointViewAttrs = {
      model: point,
      nativeMap: this.leafletMap
    };

    // If there's a view for middle point -> resuse the native geometry
    if (this._middlePointViews[this._getPointKey(point)]) {
      var existingMiddlePointView = this._middlePointViews[this._getPointKey(point)];
      pointViewAttrs.nativeMarker = existingMiddlePointView.getNativeMarker();
    }

    var pointView = new PointView(pointViewAttrs);
    return pointView;
  },

  _onPointsChanged: function () {
    this._renderMiddlePoints();

    this._updateGeometry();
  },

  _onPointsResetted: function (collection, options) {
    this._renderPoints();
    this._renderMiddlePoints();

    this._updateGeometry();
  },

  _updateGeometry: function () {
    this._geometry.setLatLngs(this.model.getCoordinates());
  },

  clean: function () {
    GeometryViewBase.prototype.clean.call(this);
    this._clearMiddlePoints();
    this.leafletMap.removeLayer(this._geometry);
    this.leafletMap.off('zoomend', this._renderMiddlePoints);
  },

  _getPointKey: function (point) {
    return point.getCoordinates().join(',');
  }
});

module.exports = PathViewBase;
