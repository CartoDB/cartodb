var _ = require('underscore');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var VisNotifications = require('builder/vis-notifications');
var AppNotifications = require('builder/app-notifications');

var REQUIRED_OPTS = [
  'diDashboardHelpers',
  'editorModel',
  'mapDefinitionModel',
  'stateDefinitionModel',
  'visDefinitionModel'
];

/**
 *  Only manage **MAP**, **STATE** and **VIS** actions between Deep-Insights (CARTO.js) and Builder
 *
 */

module.exports = {

  track: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._map = this._diDashboardHelpers.getMap();
    this._vis = this._diDashboardHelpers.visMap();

    this._mapDefinitionModel.on('change:minZoom change:maxZoom', _.debounce(this._onMinMaxZoomChanged.bind(this), 300), this);
    this._mapDefinitionModel.on('change:scrollwheel', this._onScrollWheelChanged, this);
    this._mapDefinitionModel.on('change:legends', this._onLegendsChanged, this);
    this._mapDefinitionModel.on('change:layer_selector', this._onLayerSelectorChanged, this);

    var saveStateDefinition = _.debounce(this._saveStateDefinition.bind(this), 500);
    this._diDashboardHelpers.getDashboard().onStateChanged(saveStateDefinition);
    this._stateDefinitionModel.on('boundsSet', this._onBoundsSet, this);

    this._vis.on('mapViewSizeChanged', this._setMapViewSize, this);

    this._editorModel.on('change:settingsView', this._onEditorSettingsChanged, this);
    this._editorModel.on('change:edition', this._onEditionChanged, this);

    this._map.on('reload', this._visReload, this);
    this._map.on('change:error', this._visErrorChange, this);
    this._vis.on('featureError error:tile error:limit', function (error) {
      AppNotifications.addNotification(error);
    }, this);

    VisNotifications.track(this._map);

    this._onScrollWheelChanged();

    // Needed to image export feature
    this._getVisMetadata();
    this.setMapConverters();
    this._setMapViewSize();

    return this;
  },

  _onMinMaxZoomChanged: function () {
    var currentZoom = this._vis.get('zoom');
    var maxZoom = this._mapDefinitionModel.get('maxZoom');
    var minZoom = this._mapDefinitionModel.get('minZoom');

    this._vis.set({
      minZoom: minZoom,
      maxZoom: maxZoom,
      zoom: Math.min(currentZoom, maxZoom)
    });
  },

  _saveStateDefinition: function () {
    var state = this._diDashboardHelpers.getDashboard().getState();
    this._stateDefinitionModel.updateState(state);
    this._getVisMetadata();
  },

  _onScrollWheelChanged: function () {
    var scrollwheel = this._mapDefinitionModel.get('scrollwheel');
    var method = scrollwheel ? 'enableScrollWheel' : 'disableScrollWheel';
    var map = this._vis;
    map && map[method] && map[method]();
  },

  _onLegendsChanged: function () {
    var legends = this._mapDefinitionModel.get('legends');
    this._map.settings.set('showLegends', legends);
  },

  _onLayerSelectorChanged: function () {
    var layerSelector = this._mapDefinitionModel.get('layer_selector');
    this._map.settings.set('showLayerSelector', layerSelector);
  },

  _setMapViewSize: function () {
    this._mapDefinitionModel.setMapViewSize(
      this._vis.getMapViewSize()
    );
  },

  setMapConverters: function () {
    var map = this._diDashboardHelpers.visMap();
    this._mapDefinitionModel.setConverters({
      pixelToLatLng: map.pixelToLatLng(),
      latLngToPixel: map.latLngToPixel()
    });
  },

  _onBoundsSet: function (bounds) {
    this._diDashboardHelpers.setBounds(bounds);
  },

  _onEditorSettingsChanged: function () {
    var settingsView = this._editorModel.get('settingsView');
    this._map.settings.set('layerSelectorEnabled', settingsView);
  },

  _onEditionChanged: function () {
    this._diDashboardHelpers.forceResize();
  },

  _getVisMetadata: function () {
    var vis = this._map;
    var map = this._diDashboardHelpers.visMap();
    var layers = this._diDashboardHelpers.getLayers();

    var imageExportMetadata = {
      zoom: map.get('zoom'),
      mapType: map.getBaseLayer().get('baseType'),
      style: layers.at(0).get('style'),
      attribution: map.get('attribution'),
      provider: map.get('provider')
    };

    this._mapDefinitionModel.setImageExportMetadata(imageExportMetadata);
    this._mapDefinitionModel.setStaticImageURLTemplate(vis.getStaticImageURL.bind(vis));
  },

  _visReload: function () {
    this._getVisMetadata();
    this._visDefinitionModel.trigger('vis:reload');
    this._visDefinitionModel.recordChange();
  },

  _visErrorChange: function () {
    this._visDefinitionModel &&
      this._visDefinitionModel.trigger('vis:error', this._map.get('error'));
  }
};
