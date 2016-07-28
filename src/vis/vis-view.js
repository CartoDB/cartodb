var _ = require('underscore');
var $ = require('jquery');
var log = require('cdb.log');
var util = require('cdb.core.util');
var View = require('../core/view');
var StackedLegend = require('../geo/ui/legend/stacked-legend');
var MapViewFactory = require('../geo/map-view-factory');
var LegendModel = require('../geo/ui/legend-model');
var Legend = require('../geo/ui/legend');
var Layers = require('./vis/layers');
var OverlaysFactory = require('./overlays-factory');
var InfowindowManager = require('./infowindow-manager');
var TooltipManager = require('./tooltip-manager');

/**
 * Visualization creation
 */
var Vis = View.extend({
  initialize: function () {
    this.model.bind('change:loading', function () {
      if (this.loader) {
        if (this.model.get('loading')) {
          this.loader.show();
        } else {
          this.loader.hide();
        }
      }
    }, this);

    this.model.once('load', this.render, this);
    this.model.on('invalidateSize', this._invalidateSize, this);
    this.model.overlaysCollection.on('add remove change', this._resetOverlays, this);

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

    this.$el.append(div);

    var mapViewFactory = new MapViewFactory();

    this.mapView = mapViewFactory.createMapView(this.model.map.get('provider'), this.model.map, div_hack, this.model.layerGroupModel);
    // Bind events before the view is rendered and layer views are added to the map
    this.mapView.bind('newLayerView', this._bindLayerViewToLoader, this);
    this.mapView.render();

    // Infowindows && Tooltips
    var infowindowManager = new InfowindowManager(this.model, this, {
      showEmptyFields: this.model.get('showEmptyInfowindowFields')
    });
    infowindowManager.manage(this.mapView, this.model.map);

    var tooltipManager = new TooltipManager(this.model);
    tooltipManager.manage(this.mapView, this.model.map);

    // Bindings
    if (this.model.get('showLegends')) {
      this.addLegends();
    }

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

  _bindLayerViewToLoader: function (layerView) {
    layerView.bind('load', function () {
      this.model.untrackLoadingObject(layerView);
    }, this);
    layerView.bind('loading', function () {
      this.model.trackLoadingObject(layerView);
    }, this);
  },

  addLegends: function (layers) {
    this._addLegends(this.createLegendView(this.model.map.layers));
  },

  _addLegends: function (legends) {
    if (this.legends) {
      this.legends.remove();
    }

    this.legends = new StackedLegend({
      legends: legends
    });

    this.mapView.addOverlay(this.legends);
  },

  createLegendView: function (layers) {
    var legends = [];
    for (var i = layers.length - 1; i >= 0; --i) {
      var cid = layers.at(i).cid;
      var layer = layers.at(i).attributes;
      if (layer.visible) {
        var layerView = this.mapView.getLayerViewByLayerCid(cid);
        if (layerView) {
          legends.push(this._createLayerLegendView(layer, layerView));
        }
      }
    }
    return _.flatten(legends);
  },

  _createLegendView: function (layer, layerView) {
    if (layer.legend) {
      layer.legend.data = layer.legend.items;
      var legend = layer.legend;

      if ((legend.items && legend.items.length) || legend.template) {
        var legendAttrs = _.extend(layer.legend, {
          visible: layer.visible
        });
        var legendModel = new LegendModel(legendAttrs);
        var legendView = new Legend({ model: legendModel });
        layerView.bind('change:visibility', function (layer, hidden) {
          legendView[hidden ? 'hide' : 'show']();
        });
        layerView.legend = legendModel;
        return legendView;
      }
    }
    return null;
  },

  _createLayerLegendView: function (layer, layerView) {
    var self = this;
    var legends = [];
    var sublayers;
    if (layer.options && layer.options.layer_definition) {
      sublayers = layer.options.layer_definition.layers;
      _(sublayers).each(function (sub, i) {
        legends.push(self._createLegendView(sub, layerView.getSubLayer(i)));
      });
    } else if (layer.options && layer.options.named_map && layer.options.named_map.layers) {
      sublayers = layer.options.named_map.layers;
      _(sublayers).each(function (sub, i) {
        legends.push(self._createLegendView(sub, layerView.getSubLayer(i)));
      });
    } else {
      legends.push(this._createLegendView(layer, layerView));
    }
    return _.compact(legends).reverse();
  },

  _setLayerOptions: function (options) {
    var layers = [];

    // flatten layers (except baselayer)
    layers = _.map(this.getLayerViews().slice(1), function (layer) {
      if (layer.getSubLayers) {
        return layer.getSubLayers();
      }
      return layer;
    });

    layers = _.flatten(layers);

    for (var i = 0; i < Math.min(options.sublayer_options.length, layers.length); ++i) {
      var o = options.sublayer_options[i];
      var subLayer = layers[i];
      var legend = this.legends && this.legends.getLegendByIndex(i);

      if (legend) {
        legend[o.visible ? 'show' : 'hide']();
      }

      // HACK
      if (subLayer.model && subLayer.model.get('type') === 'torque') {
        if (o.visible === false) {
          subLayer.model.set('visible', false);
        }
      }
    }
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

      if (type === 'layer_selector' && options[type] || type === 'layer_selector' && overlay.model.get('display') && options[type] === undefined) {
        overlay.show();
      }

      if (type === 'fullscreen' && options[type] || type === 'fullscreen' && opt.display && options[type] === undefined) {
        overlay.show();
      }

      if (type === 'search' && options[type] || type === 'search' && opt.display && options[type] === undefined) {
        overlay.show();
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
      // Save tiles loader view for later
      if (overlay.type === 'loader') {
        this.loader = v;
      }

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

  createLayer: function (layerData) {
    var layerModel = Layers.create(layerData.type || layerData.kind, this, layerData);
    return this.mapView.createLayer(layerModel);
  },

  throwError: function (msg, lyr) {
    log.error(msg);
    var self = this;
    _.defer(function () {
      self.trigger('error', msg, lyr);
    });
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
