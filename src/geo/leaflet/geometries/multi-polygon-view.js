var View = require('../../../core/view');
var PolygonView = require('./polygon-view');

var MultiPolygonView = View.extend({
  initialize: function (options) {
    if (!options.model) throw new Error('model is required');
    if (!options.nativeMap) throw new Error('nativeMap is required');

    this.model = this.model || options.model;
    this.leafletMap = options.nativeMap;

    this.model.on('remove', this._onRemoveTriggered, this);
    this.model.polygons.on('change', this._onPolygonsChanged, this);
  },

  render: function () {
    this._renderPolygons();
    this._updateModelsGeoJSON();
  },

  _renderPolygons: function () {
    this.model.polygons.each(this._renderPolygon, this);
  },

  _renderPolygon: function (polygon) {
    var polygonView = new PolygonView({
      model: polygon,
      nativeMap: this.leafletMap
    });
    polygonView.render();
  },

  _onPolygonsChanged: function () {
    this._updateModelsGeoJSON();
  },

  _updateModelsGeoJSON: function () {
    if (this._areAllPolygonsComplete()) {
      var geojson = {
        type: 'MultiPolygon'
      };

      geojson.coordinates = this.model.polygons.map(function (polygon) {
        return polygon.toGeoJSON().geometry.coordinates;
      });

      this.model.set({
        geojson: geojson
      });
    }
  },

  _areAllPolygonsComplete: function () {
    return this.model.polygons.all(function (polygon) {
      return polygon.isComplete();
    });
  },

  _onRemoveTriggered: function () {
    this._removePolygons();
    this.remove();
  },

  _removePolygons: function () {
    this.model.polygons.each(function (polygon) {
      polygon.remove();
    }, this);
  }
});

module.exports = MultiPolygonView;
