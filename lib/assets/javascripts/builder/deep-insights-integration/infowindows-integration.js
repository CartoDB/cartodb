var _ = require('underscore');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var linkLayerInfowindow = require('./link-layer-infowindow');

var REQUIRED_OPTS = [
  'diDashboardHelpers',
  'layerDefinitionsCollection',
  'mapDefinitionModel'
];

module.exports = {
  track: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._visMap = this._diDashboardHelpers.visMap();
    this._infowindowModel = this._diDashboardHelpers.getInfowindowModel();

    this._visMap.on('featureClick', this._onFeatureClicked, this);

    this._layerDefinitionsCollection.each(function (layerDefinitionModel) {
      linkLayerInfowindow(layerDefinitionModel, this._infowindowModel, this._visMap);
    }, this);

    this._visMap.on('change:zoom', this._onZoomChanged, this);
  },

  untrack: function () {
    var visMap = this._diDashboardHelpers.visMap();
    visMap.off('featureClick', this._onFeatureClicked, this);
  },

  _onFeatureClicked: function (event) {
    var infowindowOptions = event.layer.changed.infowindow
      ? event.layer.changed.infowindow
      : event.layer.infowindow;

    var attributes = _.extend(infowindowOptions, {
      visibility: true,
      latlng: event.latlng,
      pos: event.position,
      size: this._visMap._mapViewSize,
      content: event.feature
    });

    this._infowindowModel.set(attributes);
  },

  _onZoomChanged: function () {
    this._infowindowModel.trigger('onZoomChanged');
  }
};
