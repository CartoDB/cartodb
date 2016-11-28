var _ = require('underscore');
var GeometryViewBase = require('./geometry-view-base');
var Point = require('../../geometry-models/point.js');
var PointView = require('./point-view');

var PathViewBase = GeometryViewBase.extend({
  initialize: function (options) {
    GeometryViewBase.prototype.initialize.apply(this, arguments);

    this.model.points.on('change:latlng', this._onPointsChanged, this);
    this.model.points.on('add', this._onPointAdded, this);
    this.model.points.on('remove', this._onPointRemoved, this);
    this.model.points.on('reset', this._onPointsReset, this);
    this.add_related_model(this.model.points);

    this._geometry = this._createGeometry();

    this._pointViews = {};
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

  _renderPoints: function (points) {
    points = points || this.model.points.models;
    _.each(points, this._renderPoint, this);
  },

  _renderPoint: function (point) {
    var pointView = this._tryToReuseMiddlePointView(point);
    if (pointView) {
      delete this._middlePointViews[point.cid];
    } else {
      pointView = this._createPointView(point);
    }
    this.addView(pointView);
    this._pointViews[point.cid] = pointView;
    pointView.render();
  },

  _renderMiddlePoints: function () {
    if (this.model.isExpandable()) {
      this._clearMiddlePoints();
      var middlePoints = this._calculateMiddlePoints();
      _.each(middlePoints, this._renderMiddlePoint, this);
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
    this._middlePointViews[point.cid] = pointView;
    pointView.render();
    pointView.once('mousedown', function (point) {
      this._middlePointViewForNewPoint = pointView;

      // Add the coordinates of the new point to the path
      this.model.addPoint(point, { at: index + 1 });
    }.bind(this));
    this.addView(pointView);
  },

  _clearMiddlePoints: function () {
    _.each(this._middlePointViews, function (view, point) {
      view.clean();
    });
  },

  _tryToReuseMiddlePointView: function (point) {
    var pointView;

    // If there's a view for middle point -> resuse the native geometry
    if (this._middlePointViewForNewPoint) {
      // "Transform" the middle point marker to a regular point marker
      point.set({
        iconUrl: Point.prototype.defaults.iconUrl
      });

      pointView = new PointView({
        model: point,
        nativeMap: this.leafletMap,
        nativeMarker: this._middlePointViewForNewPoint.getNativeMarker()
      });

      // we're reusing the marker and we don't want this view
      // to remove it from the map, so we unset it before cleaning
      // the view
      this._middlePointViewForNewPoint.unsetMarker();
      this._middlePointViewForNewPoint.clean();
      delete this._middlePointViewForNewPoint;
    }

    return pointView;
  },

  _createPointView: function (point) {
    var pointView = new PointView({
      model: point,
      nativeMap: this.leafletMap
    });
    return pointView;
  },

  _onPointsChanged: function () {
    this._renderMiddlePoints();

    this._updateGeometry();
  },

  _onPointAdded: function (point) {
    this._renderPoints([ point ]);
    this._renderMiddlePoints();

    this._updateGeometry();
  },

  _onPointRemoved: function (point) {
    this._removePoints([ point ]);
    this._renderMiddlePoints();

    this._updateGeometry();
  },

  _onPointsReset: function (collection, options) {
    var previousPoints = options.previousModels;
    var newPoints = this.model.points.models;
    var pointsToRemove = _.difference(previousPoints, newPoints);
    var pointsToAdd = _.difference(newPoints, previousPoints);

    this._removePoints(pointsToRemove);
    this._renderPoints(pointsToAdd);
    this._renderMiddlePoints();

    this._updateGeometry();
  },

  _removePoints: function (points) {
    points = points || this.model.points.models;
    _.each(points, function (point) {
      var pointView = this._pointViews[point.cid];
      if (pointView) {
        pointView.clean();
        delete this._pointViews[point.cid];
      }
    }, this);
  },

  _updateGeometry: function () {
    this._geometry.setLatLngs(this.model.getCoordinates());
  },

  clean: function () {
    GeometryViewBase.prototype.clean.call(this);
    this.leafletMap.removeLayer(this._geometry);
    this.leafletMap.off('zoomend', this._renderMiddlePoints);
  },

  _getPointKey: function (point) {
    return point.cid;
  }
});

module.exports = PathViewBase;
