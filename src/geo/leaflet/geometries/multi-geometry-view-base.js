var GeometryViewBase = require('./geometry-view-base');

var MultiGeometryViewBase = GeometryViewBase.extend({
  initialize: function (options) {
    GeometryViewBase.prototype.initialize.apply(this, arguments);
    if (!this.GeometryViewClass) throw new Error('subclasses of MultiGeometryViewBase must declare the GeometryViewClass instance variable');
  },

  render: function () {
    this._renderGeometries();
  },

  _renderGeometries: function () {
    this.model.geometries.each(this._renderGeometry, this);
  },

  _renderGeometry: function (geometry) {
    var polygonView = new this.GeometryViewClass({
      model: geometry,
      nativeMap: this.leafletMap
    });
    polygonView.render();
  }
});

module.exports = MultiGeometryViewBase;
