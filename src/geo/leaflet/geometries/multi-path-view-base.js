var View = require('../../../core/view');
var MultiPathViewBase = View.extend({
  initialize: function (options) {
    if (!options.model) throw new Error('model is required');
    if (!options.nativeMap) throw new Error('nativeMap is required');
    if (!this.PathViewClass) throw new Error('subclasses of MultiPathViewBase must declare the PathViewClass instance variable');
    if (!this.geoJSONType) throw new Error('subclasses of geoJSONType must declare the PathViewClass instance variable');

    this.model = this.model || options.model;
    this.leafletMap = options.nativeMap;

    this.model.on('remove', this._onRemoveTriggered, this);
    this.model.paths.on('change', this._onPathsChanged, this);
  },

  render: function () {
    this._renderPaths();
    this._updateModelsGeoJSON();
  },

  _renderPaths: function () {
    this.model.paths.each(this._renderPath, this);
  },

  _renderPath: function (path) {
    var polygonView = new this.PathViewClass({
      model: path,
      nativeMap: this.leafletMap
    });
    polygonView.render();
  },

  _onPathsChanged: function () {
    this._updateModelsGeoJSON();
  },

  _updateModelsGeoJSON: function () {
    if (this._areAllPathsComplete()) {
      var geojson = {
        type: this.geoJSONType
      };

      geojson.coordinates = this.model.paths.map(function (path) {
        return path.toGeoJSON().geometry.coordinates;
      });

      this.model.set({
        geojson: geojson
      });
    }
  },

  _areAllPathsComplete: function () {
    return this.model.paths.all(function (path) {
      return path.isComplete();
    });
  },

  _onRemoveTriggered: function () {
    this._removePolygons();
    this.remove();
  },

  _removePolygons: function () {
    this.model.paths.each(function (path) {
      path.remove();
    }, this);
  }
});

module.exports = MultiPathViewBase;
