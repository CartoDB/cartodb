var _ = require('underscore');
var Backbone = require('backbone');

var GeoJSONDataProvider = function (vectorLayerView, layerIndex) {
  this._layerIndex = layerIndex;
  this._features = [];

  // We have to wait until the layer has been added because
  // the d3 layer doesn't set the .tileloader until that moment.
  // This won't be needed when we have a better API.
  vectorLayerView.bind('added', function (layerView) {
    // These are just some temporary hacks to extract the
    // features from d3 layer view. Will be removed as soon as
    // the layer provides a better API.
    // (see https://github.com/CartoDB/d3.cartodb/issues/84)
    layerView.tileLoader.on('tileAdded', function () {
      var features = arguments[0].geometry.features;
      this._features = _.map(features, function (feature) {
        return feature.properties;
      });
    }.bind(this));

    layerView.tileLoader.on('tilesLoaded', function () {
      // This is the event that all data providers must trigger
      // when features have changed
      this.trigger('featuresChanged', this._features.slice());
      this._features = [];
    }.bind(this));
  }.bind(this));
};

_.extend(GeoJSONDataProvider.prototype, Backbone.Events);

module.exports = GeoJSONDataProvider;
