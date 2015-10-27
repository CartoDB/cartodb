 var _ = require('underscore');
 var L = require('leaflet-proxy').get();
 var GeometryView = require('../geometry-view');

/**
 * view for other geometries (polygons/lines)
 */
function PathView(geometryModel) {
  // events to link
  var events = [
    'click',
    'dblclick',
    'mousedown',
    'mouseover',
    'mouseout',
  ];

  this._eventHandlers = {};
  this.model = geometryModel;
  this.points = [];


  this.geom = L.GeoJSON.geometryToLayer(geometryModel.get('geojson'));
  this.geom.setStyle(geometryModel.get('style'));
}

PathView.prototype = new GeometryView();

PathView.prototype._leafletLayers = function() {
  // check if this is a multi-feature or single-feature
  if (this.geom.getLayers) {
    return this.geom.getLayers();
  }
  return [this.geom];
};


PathView.prototype.enableEdit = function() {
  var self = this;
  var layers = this._leafletLayers();
  _.each(layers, function(g) {
    g.setStyle(self.model.get('style'));
    g.on('edit', function() {
      self.model.set('geojson', self.geom.toGeoJSON().geometry);
    }, self);
  });
};

PathView.prototype.disableEdit = function() {
  var self = this;
  var layers = this._leafletLayers();
  _.each(layers, function(g) {
    g.off('edit', null, self);
  });
};

PathView.prototype.edit = function(enable) {
  var self = this;
  var fn = enable ? 'enable': 'disable';
  var layers = this._leafletLayers();
  _.each(layers, function(g) {
    g.editing[fn]();
    enable ? self.enableEdit(): self.disableEdit();
  });
};

module.exports = PathView;
