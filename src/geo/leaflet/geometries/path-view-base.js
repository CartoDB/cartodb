var _ = require('underscore');
var GeometryViewBase = require('./geometry-view-base');
var Point = require('../../geometry-models/point.js');
var PointView = require('./point-view');

var MIDDLE_POINT_ICON_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEwAACxMBAJqcGAAABCRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDx0aWZmOkNvbXByZXNzaW9uPjU8L3RpZmY6Q29tcHJlc3Npb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjIyPC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj4yMjwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgICAgIDxkYzpzdWJqZWN0PgogICAgICAgICAgICA8cmRmOkJhZy8+CiAgICAgICAgIDwvZGM6c3ViamVjdD4KICAgICAgICAgPHhtcDpNb2RpZnlEYXRlPjIwMTY6MTE6MjIgMTI6MTE6NDU8L3htcDpNb2RpZnlEYXRlPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPlBpeGVsbWF0b3IgMy41LjE8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cq7wSAUAAAGbSURBVDgR1ZQ9S8RAEIYTPYlaJAiK2AiChY1gYyvX+CMsrr/aH2Jtb+GPsBFbmwMbC0GwEVGQBPw4/Ijvu+wMk42X3ME1N7CZ7O6bJ7PJzETRrFncFHBZlofY38PYwki8dgh/jzGI4/jCr9Xcv2AA96E8wshqT1QXckzP8YLr6nIU1cCAdiHqhcKW+Rngl1bTsRMfqUKLj6/k5uF14ykfpt8/5Ry1nfn4dz1Lit3Nlcd0aYGfhdbDs2828krE2DyByB3/pfhcvrp93hage9xc+IKDnbW71XTx3S/nAB+LxEXBCaD8UQ7KSJug1POF1FDLOSzzDDdRMGb8+854/FGRioaeGmrNmjIsmCnljN9U7tt8oFWGBcuRXCRtQNkPTqYMCxbtVLwFS+q4lBqXzuwwWmVYMMvUGfNU7tt8oFWGBQ8EwuQPIpGtiqeGWrOoDAUjudlQWPsRK4rJ3wTnHjWm+lgg2pTCymPz6RNOm6CkKT8dWdLcRfV04bRfcG0MqzWhSsQCAHz6bVPg9L72WaasKEl+plRro4dmxuwPhneqyxRY7WEAAAAASUVORK5CYII=';

var PathViewBase = GeometryViewBase.extend({
  initialize: function (options) {
    GeometryViewBase.prototype.initialize.apply(this, arguments);

    this.model.points.on('change', this._onPointsChanged, this);
    this.model.points.on('reset', this._onPointsResetted, this);
    this.add_related_model(this.model.points);

    this._geometry = this._createGeometry();

    this._middlePoints = [];
    this._middlePointViews = {};

    this.leafletMap.on('zoomend', this._renderMiddlePoints.bind(this));
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
    pointView.on('click', function (point) {
      this.model.removePoint(point);
    }, this);
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
        iconUrl: MIDDLE_POINT_ICON_URL
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
      this.model.addPoint(point, { at: index +  1 });
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

  _onGeometryRemoved: function () {
    GeometryViewBase.prototype._onGeometryRemoved.apply(this);
    this.leafletMap.removeLayer(this._geometry);
  },

  remove: function () {
    GeometryViewBase.prototype.remove.call(this);
    this._clearMiddlePoints();
  },

  _getPointKey: function (point) {
    return point.getCoordinates().join(',');
  }
});

module.exports = PathViewBase;
