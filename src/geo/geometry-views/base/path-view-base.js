var _ = require('underscore');
var GeometryViewBase = require('./geometry-view-base');
var Point = require('../../geometry-models/point.js');

var computeMidLatLng = function (mapView, latLngA, latLngB) {
  var leftPoint = mapView.latLngToContainerPoint(latLngA);
  var rightPoint = mapView.latLngToContainerPoint(latLngB);
  var y = (leftPoint.y + rightPoint.y) / 2;
  var x = (leftPoint.x + rightPoint.x) / 2;
  var latlng = mapView.containerPointToLatLng({ x: x, y: y });
  return [ latlng.lat, latlng.lng ];
};

var PathViewBase = GeometryViewBase.extend({
  initialize: function (options) {
    GeometryViewBase.prototype.initialize.apply(this, arguments);

    if (!this.PointViewClass) throw new Error('subclasses of PathViewBase must declare the PointViewClass instance variable');

    this.model.points.on('change:latlng', this._onPointsChanged, this);
    this.model.points.on('add', this._onPointAdded, this);
    this.model.points.on('remove', this._onPointRemoved, this);
    this.model.points.on('reset', this._onPointsReset, this);
    this.add_related_model(this.model.points);

    this._geometry = this._createGeometry();

    this._pointViews = {};
    this._middlePointViews = {};

    _.bindAll(this, '_renderMiddlePoints');

    this.mapView.on('zoomend', this._renderMiddlePoints);
  },

  _createGeometry: function () {
    throw new Error('Subclasses of MyLeafletPathViewBase must implement _createGeometry');
  },

  render: function () {
    this._renderPoints();
    this._renderMiddlePoints();

    this.mapView.addPath(this._geometry);
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

  _tryToReuseMiddlePointView: function (point) {
    var pointView;

    // If there's a view for middle point -> resuse the native geometry
    if (this._middlePointViewForNewPoint) {
      // "Transform" the middle point marker to a regular point marker
      point.set({
        iconUrl: Point.prototype.defaults.iconUrl
      });

      pointView = new this.PointViewClass({
        model: point,
        mapView: this.mapView,
        marker: this._middlePointViewForNewPoint.getMarker()
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

  _renderMiddlePoints: function () {
    if (this.model.isExpandable()) {
      this._clearMiddlePoints();
      var middlePoints = this._calculateMiddlePoints();
      _.each(middlePoints, this._renderMiddlePoint, this);
    }
  },

  _calculateMiddlePoints: function () {
    var coordinates = this.model.getCoordinatesForMiddlePoints();
    var mapView = this.mapView;
    return _.map(coordinates.slice(0, -1), function (latLngA, index) {
      var latLngB = coordinates[index + 1];
      return new Point({
        latlng: computeMidLatLng(mapView, latLngA, latLngB),
        editable: true,
        iconUrl: Point.MIDDLE_POINT_ICON_URL
      });
    });
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

  _createPointView: function (point) {
    var pointView = new this.PointViewClass({
      model: point,
      mapView: this.mapView
    });
    return pointView;
  },

  _onPointsChanged: function () {
    this._renderMiddlePoints();

    this._updatePathFromModel();
  },

  _onPointAdded: function (point) {
    this._renderPoints([ point ]);
    this._renderMiddlePoints();

    this._updatePathFromModel();
  },

  _onPointRemoved: function (point) {
    this._removePoints([ point ]);
    this._renderMiddlePoints();

    this._updatePathFromModel();
  },

  _onPointsReset: function (collection, options) {
    var previousPoints = options.previousModels;
    var newPoints = this.model.points.models;
    var pointsToRemove = _.difference(previousPoints, newPoints);
    var pointsToAdd = _.difference(newPoints, previousPoints);

    this._removePoints(pointsToRemove);
    this._renderPoints(pointsToAdd);
    this._renderMiddlePoints();

    this._updatePathFromModel();
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

  _updatePathFromModel: function () {
    this._geometry.setCoordinates(this.model.getCoordinates());
  },

  clean: function () {
    GeometryViewBase.prototype.clean.call(this);
    this.mapView.removePath(this._geometry);
    this.mapView.off('zoomend', this._renderMiddlePoints);
  },

  _getPointKey: function (point) {
    return point.cid;
  }
});

module.exports = PathViewBase;
