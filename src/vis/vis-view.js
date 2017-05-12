var _ = require('underscore');
var $ = require('jquery');
var View = require('../core/view');
var MapViewFactory = require('../geo/map-view-factory');
var LegendsView = require('../geo/ui/legends/legends-view');
var OverlaysView = require('../geo/ui/overlays-view');

/**
 * Visualization creation
 */
var Vis = View.extend({
  initialize: function (options) {
    this.model.once('reloaded', this.render, this);
    this.model.on('invalidateSize', this._invalidateSize, this);

    this._overlaysCollection = this.model.overlaysCollection;

    this.settingsModel = options.settingsModel;

    _.bindAll(this, '_onResize');
  },

  render: function () {
    this.model.map.off('change:provider', this.render, this);
    this.model.map.on('change:provider', this.render, this);

    this._cleanMapView();
    this._renderMapView();

    this._cleanLegendsView();
    this._renderLegendsView();

    this._cleanOverlaysView();
    this._renderOverlaysView();

    // If a CartoDB embed map is hidden by default, its
    // height is 0 and it will need to recalculate its size
    // and re-center again.
    // We will wait until it is resized and then apply
    // the center provided in the parameters and the
    // correct size.
    var map_h = this.$el.outerHeight();
    if (map_h === 0) {
      $(window).bind('resize', this._onResize);
    }
  },

  _renderMapView: function () {
    this.mapView = this._getMapViewFactory().createMapView(this.model.map.get('provider'), this.model, this.model.map, this.model.layerGroupModel);
    // Add the element to the DOM before the native map is created
    this.$el.html(this.mapView.el);

    // Bind events before the view is rendered and layer views are added to the map
    this.mapView.bind('newLayerView', this._bindLayerViewToLoader, this);
    this.mapView.render();
  },

  _getMapViewFactory: function () {
    return this.mapViewFactory || new MapViewFactory();
  },

  _cleanMapView: function () {
    this.mapView && this.mapView.clean();
  },

  _renderLegendsView: function () {
    this._legendsView = new LegendsView({
      layersCollection: this.model.map.layers,
      settingsModel: this.settingsModel
    });

    this.$el.append(this._legendsView.render().$el);
  },

  _cleanLegendsView: function () {
    this._legendsView && this._legendsView.clean();
  },

  _renderOverlaysView: function () {
    this._overlaysView = new OverlaysView({
      visModel: this.model,
      visView: this,
      mapModel: this.model.map,
      mapView: this.mapView,
      overlaysCollection: this._overlaysCollection
    });
    this.$el.append(this._overlaysView.render().$el);
  },

  _cleanOverlaysView: function () {
    this._overlaysView && this._overlaysView.clean();
  },

  _bindLayerViewToLoader: function (layerView) {
    layerView.bind('load', function () {
      this.model.untrackLoadingObject(layerView);
    }, this);
    layerView.bind('loading', function () {
      this.model.trackLoadingObject(layerView);
    }, this);
  },

  _invalidateSize: function () {
    this.mapView.invalidateSize();
  },

  _onResize: function () {
    $(window).unbind('resize', this._onResize);

    var self = this;
    // This timeout is necessary due to GMaps needs time
    // to load tiles and recalculate its bounds :S
    setTimeout(function () {
      self.model.invalidateSize();
    }, 150);
  }
});

module.exports = Vis;
