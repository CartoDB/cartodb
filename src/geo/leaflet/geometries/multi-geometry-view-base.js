var View = require('../../../core/view');

var MultiGeometryViewBase = View.extend({
  initialize: function (options) {
    if (!options.model) throw new Error('model is required');
    if (!options.nativeMap) throw new Error('nativeMap is required');
    if (!this.GeometryViewClass) throw new Error('subclasses of MultiGeometryViewBase must declare the GeometryViewClass instance variable');

    this.model = this.model || options.model;
    this.leafletMap = options.nativeMap;

    this.model.on('remove', this._onRemoveTriggered, this);
  },

  render: function () {
    this._renderGeometries();
  },

  _renderGeometries: function () {
    this.model.geometries.each(this._renderPath, this);
  },

  _renderPath: function (geometry) {
    var polygonView = new this.GeometryViewClass({
      model: geometry,
      nativeMap: this.leafletMap
    });
    polygonView.render();
  },

  _onRemoveTriggered: function () {
    this._removeGeometries();
    this.remove();
  },

  _removeGeometries: function () {
    this.model.geometries.each(function (geometry) {
      geometry.remove();
    }, this);
  }
});

module.exports = MultiGeometryViewBase;
