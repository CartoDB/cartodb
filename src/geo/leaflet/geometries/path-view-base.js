var GeometryViewBase = require('./geometry-view-base');
var PointView = require('./point-view');

var PathViewBase = GeometryViewBase.extend({
  initialize: function (options) {
    GeometryViewBase.prototype.initialize.apply(this, arguments);

    this.model.points.on('change', this._onPointsChanged, this);
    this.model.points.on('reset', this._onPointsResetted, this);
    this.add_related_model(this.model.points);

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
    this.model.points.each(this._renderPoint, this);
    this._updateGeometry();
  },

  _updateGeometry: function () {
    this._geometry.setLatLngs(this.model.getCoordinates());
  },

  _onGeometryRemoved: function () {
    GeometryViewBase.prototype._onGeometryRemoved.apply(this);
    this.leafletMap.removeLayer(this._geometry);
  }
});

module.exports = PathViewBase;
