var _ = require('underscore');
var $ = require('jquery');
var util = require('cdb.core.util');
var View = require('../core/view');
var MapViewFactory = require('../geo/map-view-factory');
var OverlaysFactory = require('./overlays-factory');
var InfowindowManager = require('./infowindow-manager');
var TooltipManager = require('./tooltip-manager');
var FeatureEvents = require('./feature-events');
var MapCursorManager = require('./map-cursor-manager');
var MapEventsManager = require('./map-events-manager');
var GeometryManagementController = require('./geometry-management-controller');
var LegendsView = require('../geo/ui/legends/legends-view.js');

/**
 * Visualization creation
 */
var Vis = View.extend({
  initialize: function (options) {
    this.model.once('load', this.render, this);
    this.model.on('invalidateSize', this._invalidateSize, this);
    this.model.on('change:loading', this._toggleLoader, this);
    this.model.overlaysCollection.on('add remove change', this._resetOverlays, this);

    this.settingsModel = options.settingsModel;

    this.overlays = [];

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
    var infowindowManager = new InfowindowManager(this.model, {
      showEmptyFields: this.model.get('showEmptyInfowindowFields')
    });
    infowindowManager.manage(this.mapView, this.model.map);

    var tooltipManager = new TooltipManager(this.model);
    tooltipManager.manage(this.mapView, this.model.map);

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

    this._resetOverlays({});

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

  _resetOverlays: function (options) {
    var overlays = this.model.overlaysCollection.toJSON();
    // Sort the overlays by its internal order
    overlays = _.sortBy(overlays, function (overlay) {
      return overlay.order === null ? Number.MAX_VALUE : overlay.order;
    });

    // clean current overlays
    while (this.overlays.length !== 0) {
      this.overlays.pop().clean();
    }

    this._createOverlays(overlays, options);
  },

  _createOverlays: function (overlays, options) {
    _(overlays).each(function (data) {
      var type = data.type;

      // IE<10 doesn't support the Fullscreen API
      if (type === 'fullscreen' && util.browser.ie && util.browser.ie.version <= 10) return;

      // Decide to create or not the custom overlays
      if (type === 'image' || type === 'text' || type === 'annotation') {
        var isDevice = (data.options.device === 'mobile');
        if (this.mobile !== isDevice) return;
        if (!options[type] && options[type] !== undefined) {
          return;
        }
      }

      // We add the header overlay
      var overlay;
      if (type === 'header') {
        overlay = this._addHeader(data);
      } else {
        overlay = this.addOverlay(data);
      }

      // We show/hide the overlays
      if (overlay && (type in options) && options[type] === false) overlay.hide();

      var opt = data.options;

      if (type === 'fullscreen' && options[type] || type === 'fullscreen' && opt.display && options[type] === undefined) {
        overlay.show();
      }

      if (type === 'search' && options[type] || type === 'search' && opt.display && options[type] === undefined) {
        overlay.show();
      }

      if (type === 'search') {
        overlay.updatePosition(this._hasZoomOverlay());
      }

      if (type === 'header') {
        var m = overlay.model;

        var title = this.model.get('title');
        if (title) {
          m.set('show_title', title);
        }
        var description = this.model.get('description');
        if (description) {
          m.set('show_description', description);
        }

        if (m.get('show_title') || m.get('show_description')) {
          $('.cartodb-map-wrapper').addClass('with_header');
        }

        overlay.render();
      }
    }, this);
  },

  _hasZoomOverlay: function () {
    var overlays = this.model.overlaysCollection.pluck('type');
    return overlays.indexOf('zoom') > -1;
  },

  _setupSublayers: function (layers, options) {
    options.sublayer_options = [];

    _.each(layers.slice(1), function (lyr) {
      if (lyr.type === 'layergroup') {
        _.each(lyr.options.layer_definition.layers, function (l) {
          options.sublayer_options.push({ visible: (l.visible !== undefined ? l.visible : true) });
        });
      } else if (lyr.type === 'namedmap') {
        _.each(lyr.options.named_map.layers, function (l) {
          options.sublayer_options.push({ visible: (l.visible !== undefined ? l.visible : true) });
        });
      } else if (lyr.type === 'torque') {
        options.sublayer_options.push({ visible: (lyr.options.visible !== undefined ? lyr.options.visible : true) });
      }
    });
  },

  _invalidateSize: function () {
    this.mapView.invalidateSize();
  },

  _addHeader: function (data) {
    return this.addOverlay({
      type: 'header',
      options: data.options
    });
  },

  addOverlay: function (overlay) {
    var v = OverlaysFactory.create(overlay.type, overlay, {
      visView: this,
      map: this.model.map
    });

    if (v) {
      this.mapView.addOverlay(v);

      this.overlays.push(v);

      v.bind('clean', function () {
        for (var i in this.overlays) {
          var o = this.overlays[i];
          if (v.cid === o.cid) {
            this.overlays.splice(i, 1);
            return;
          }
        }
      }, this);
    }
    return v;
  },

  // returns an array of layers
  getLayerViews: function () {
    var self = this;
    return _.compact(this.model.map.layers.map(function (layer) {
      return self.mapView.getLayerViewByLayerCid(layer.cid);
    }));
  },

  getOverlays: function () {
    return this.overlays;
  },

  getOverlay: function (type) {
    return _(this.overlays).find(function (v) {
      return v.type === type;
    });
  },

  getOverlaysByType: function (type) {
    return _(this.overlays).filter(function (v) {
      return v.type === type;
    });
  },

  _toggleLoader: function () {
    var loaderOverlay = this._getLoaderOverlay();
    if (loaderOverlay) {
      if (this.model.get('loading')) {
        loaderOverlay.show();
      } else {
        loaderOverlay.hide();
      }
    }
  },

  _getLoaderOverlay: function () {
    return this.getOverlay('loader');
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
