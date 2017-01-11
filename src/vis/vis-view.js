var _ = require('underscore');
var $ = require('jquery');
var View = require('../core/view');
var MapViewFactory = require('../geo/map-view-factory');
var FeatureEvents = require('./feature-events');
var MapCursorManager = require('./map-cursor-manager');
var MapEventsManager = require('./map-events-manager');
var GeometryManagementController = require('./geometry-management-controller');
var LegendsView = require('../geo/ui/legends/legends-view');
var OverlaysView = require('../geo/ui/overlays-view');

var InfowindowModel = require('../geo/ui/infowindow-model');
var InfowindowView = require('../geo/ui/infowindow-view');
var InfowindowManager = require('./infowindow-manager');

var TooltipModel = require('../geo/ui/tooltip-model');
var TooltipView = require('../geo/ui/tooltip-view');
var TooltipManager = require('./tooltip-manager');

/**
 * Visualization creation
 */
var Vis = View.extend({
  initialize: function (options) {
    this.model.once('load', this.render, this);
    this.model.on('invalidateSize', this._invalidateSize, this);

    this._overlaysCollection = this.model.overlaysCollection;

    this.settingsModel = options.settingsModel;

    _.bindAll(this, '_onResize');
  },

  render: function () {
    // Create the MapView
    var div = $('<div>').css({
      position: 'relative',
      width: '100%',
      height: '100%'
    });

    this.container = div;

    // Another div to prevent leaflet grabbing the div
    var div_hack = $('<div>')
      .addClass('cartodb-map-wrapper')
      .css({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%'
      });

    div.append(div_hack);

    this.$el.html(div);

    var mapViewFactory = new MapViewFactory();

    this.mapView = mapViewFactory.createMapView(this.model.map.get('provider'), this.model.map, div_hack, this.model.layerGroupModel);
    // Bind events before the view is rendered and layer views are added to the map
    this.mapView.bind('newLayerView', this._bindLayerViewToLoader, this);
    this.mapView.render();

    new GeometryManagementController(this.mapView, this.model.map); // eslint-disable-line

    // Infowindows && Tooltips
    var infowindowModel = new InfowindowModel();
    var tooltipModel = new TooltipModel({
      offset: [4, 10]
    });

    var infowindowView = new InfowindowView({
      model: infowindowModel,
      mapView: this.mapView
    });
    infowindowView.render();
    this.$el.append(infowindowView.el);

    new InfowindowManager({ // eslint-disable-line
      visModel: this,
      mapModel: this.model.map,
      mapView: this.mapView,
      tooltipModel: tooltipModel,
      infowindowModel: infowindowModel
    }, {
      showEmptyFields: this.model.get('showEmptyInfowindowFields')
    });

    var tooltipView = new TooltipView({
      model: tooltipModel,
      mapView: this.mapView
    });
    tooltipView.render();
    this.$el.append(tooltipView.el);

    new TooltipManager({ // eslint-disable-line
      visModel: this.model,
      mapModel: this.model.map,
      mapView: this.mapView,
      tooltipModel: tooltipModel,
      infowindowModel: infowindowModel
    });

    var featureEvents = new FeatureEvents({
      mapView: this.mapView,
      layersCollection: this.model.map.layers
    });

    new MapCursorManager({ // eslint-disable-line
      mapView: this.mapView,
      mapModel: this.model.map,
      featureEvents: featureEvents
    });

    new MapEventsManager({ // eslint-disable-line
      mapModel: this.model.map,
      featureEvents: featureEvents
    });

    this._renderLegends();

    var overlaysView = new OverlaysView({
      visModel: this.model,
      visView: this,
      mapModel: this.model.map,
      mapView: this.mapView,
      overlaysCollection: this._overlaysCollection
    });
    overlaysView.render();
    this.$el.append(overlaysView.el);

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

  _renderLegends: function () {
    this._legendsView = new LegendsView({
      layersCollection: this.model.map.layers,
      settingsModel: this.settingsModel
    });

    this.$el.append(this._legendsView.render().$el);
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

  // returns an array of layers
  getLayerViews: function () {
    var self = this;
    return _.compact(this.model.map.layers.map(function (layer) {
      return self.mapView.getLayerViewByLayerCid(layer.cid);
    }));
  },

  _onResize: function () {
    $(window).unbind('resize', this._onResize);

    var self = this;
    // This timeout is necessary due to GMaps needs time
    // to load tiles and recalculate its bounds :S
    setTimeout(function () {
      self.model.centerMapToOrigin();
    }, 150);
  }
});

module.exports = Vis;
