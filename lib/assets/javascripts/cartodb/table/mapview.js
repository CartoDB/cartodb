/**
 * map tab shown in cartodb admin
 */

/**
 * inside the UI all the cartodb layers should be shown merged.
 * the problem is that the editor needs the layers separated to work
 * with them so this class transform from multiple cartodb layers
 * and create only a view to represent all merged in a single layer group
 */
function GrouperLayerMapView(mapViewClass) {

  return {

    initialize: function() {
      this.groupLayer = null;
      this.activeLayerModel = null;
      mapViewClass.prototype.initialize.call(this);
    },

    _removeLayers: function() {
      var self = this;
      _.each(this.map.layers.getLayersByType('CartoDB'), function(layer) {
        layer.unbind(null, null, self);
      });
      cdb.geo.MapView.prototype._removeLayers.call(this);

      if(this.groupLayer) {
        this.groupLayer.model.unbind();
      }
      this.groupLayer = null;
    },

    _removeLayer: function(layer) {
      // if the layer is in layergroup
      if(layer.cid in this.layers) {
        if(this.layers[layer.cid] === this.groupLayer) {
          this._updateLayerDefinition(layer);
          layer.unbind(null, null, this);
          delete this.layers[layer.cid];
          this.trigger('removeLayerView', this);
        } else {
          this.trigger('removeLayerView', this);
          cdb.geo.MapView.prototype._removeLayer.call(this, layer);
        }
      } else {
        cdb.log.info("removing non existing layer");
      }
    },

    setActiveLayer: function(layer) {
      this.activeLayerModel = layer;
      this._setInteraction();
    },

    disableInteraction: function() {
      this.groupLayer._clearInteraction();
    },

    enableInteraction: function() {
      this._setInteraction();
    },

    // set interaction only for the active layer
    _setInteraction: function() {
      if(!this.groupLayer) return;
      if(this.activeLayerModel) {
        this.groupLayer._clearInteraction();
        var idx = this.map.layers.getLayerDefIndex(this.activeLayerModel);
        // when layer is not found idx == -1 so the interaction is 
        // disabled for all the layers
        for(var i = 0; i < this.groupLayer.getLayerCount(); ++i) {
          this.groupLayer.setInteraction(i, i == idx);
        }
      }
    },

    _updateLayerDefinition: function(layer) {
      if(!layer) throw "layer must be a valid layer (not null)";
      if(this.groupLayer) {
        // the extra_params attributes sent to the server
        // differs of the one is stored in local so every time
        // the model is saved backbone raises a change event.
        //
        // In order to no update the layer more than 1 time per update
        // dont update it when *only* extra_params is changed
        if(!(_.size(layer.changed) == 1 && layer.changed.extra_params)) {
          // remove groupLayer if there are no cartodb layers
          if(this.map.layers.getLayersByType('CartoDB').length === 0) {
            this.groupLayer.remove();
            this.groupLayer = null;
          } else {
            var def = this.map.layers.getLayerDef();
            this.groupLayer.setLayerDefinition(def);
            this._setInteraction();
          }
        }
      }
    },

    /**
     * when merged layers raises an error this function send the error to the
     * layer that actually caused it
     */
    _routeErrors: function(errors) {
      var styleRegExp = /style(\d+)/;
      var postgresExp = /layer(\d+):/i;
      var generalPostgresExp = /PSQL error/i;
      var syntaxErrorExp = /syntax error/i;
      var webMercatorErrorExp = /"the_geom_webmercator" does not exist/i;
      var tilerError = /Error:/i;
      var layers = this.map.layers.where({ visible: true, type: 'CartoDB' });
      for(var i in errors) {
        var err = errors[i];
        // filter empty errors
        if(err && err.length) {
          var match = styleRegExp.exec(err);
          if(match) {
            var layerIndex = parseInt(match[1], 10);
            layers[layerIndex].trigger('parseError', [err]);
          } else {
            var match = postgresExp.exec(err);
            if(match) {
              var layerIndex = parseInt(match[1], 10);
              if (webMercatorErrorExp.exec(err)) {
                err = _t("you should select the_geom_webmercator column");
                layers[layerIndex].trigger('sqlNoMercator', [err]);
              } else {
                layers[layerIndex].trigger('sqlParseError', [err]);
              }
            } else if(generalPostgresExp.exec(err) || syntaxErrorExp.exec(err) || tilerError.exec(err)) {
              var error = 'sqlError';
              if (webMercatorErrorExp.exec(err)) {
                error = 'sqlNoMercator';
                err = _t("you should select the_geom_webmercator column");
              }
              _.each(layers, function(lyr) { lyr.trigger(error, err); });
            } else {
              _.each(layers, function(lyr) { lyr.trigger('error', err); });
            }
          }
        }
      }
    },

    _routeSignal: function(signal) {
      var self = this;
      return function() {
        var layers = self.map.layers.where({ visible: true, type: 'CartoDB' });
        var args = [signal].concat(arguments);
        _.each(layers, function(lyr) { lyr.trigger.apply(lyr, args); });
      }
    },

    _addLayer: function(layer, layers, opts) {

      // create group layer to acumulate cartodb layers
      if (layer.get('type') === 'CartoDB') {
        var self = this;
        if(!this.groupLayer) {
          // create model
          var m = new cdb.geo.CartoDBGroupLayer(
            _.extend(layer.toLayerGroup(), {
              user_name: this.options.user.get("username"),
              sql_api_domain: cdb.config.get('sql_api_domain'),
              sql_api_endpoint: cdb.config.get('sql_api_endpoint'),
              sql_api_protocol: cdb.config.get('sql_api_protocol'),
              sql_api_port: cdb.config.get('sql_api_port'),
              tiler_domain: cdb.config.get('tiler_domain'),
              tiler_port: cdb.config.get('tiler_port'),
              tiler_protocol: cdb.config.get('tiler_protocol'),
              no_cdn: true,
              force_cors: true // use CORS to control error management in a better way
            })
          );

          var layer_view = mapViewClass.prototype._addLayer.call(this, m, layers, _.extend({}, opts, { silent: true }));
          delete this.layers[m.cid];
          this.layers[layer.cid] = layer_view;
          this.groupLayer = layer_view;
          m.bind('error', this._routeErrors, this);
          m.bind('tileOk', this._routeSignal('tileOk'), this);
          this.trigger('newLayerView', layer_view, layer, this);
        } else {
          this.layers[layer.cid] = this.groupLayer;
          this._updateLayerDefinition(layer);
          this.trigger('newLayerView', this.groupLayer, layer, this);
        }

        layer.bind('change', this._updateLayerDefinition, this);
      } else {
        mapViewClass.prototype._addLayer.call(this, layer, layers, opts);
      }
    }
  }
};

cdb.admin.LeafletMapView = cdb.geo.LeafletMapView.extend(GrouperLayerMapView(cdb.geo.LeafletMapView));

if (typeof(google) !== 'undefined') {
  cdb.admin.GoogleMapsMapView = cdb.geo.GoogleMapsMapView.extend(GrouperLayerMapView(cdb.geo.GoogleMapsMapView));
}

cdb.admin.MapTab = cdb.core.View.extend({

  events: {
    'click .add_overlay.button':    'killEvent',
    'click .canvas_setup.button':  'killEvent',
    'click .sqlview .clearview':    '_clearView',
    'click .sqlview .export_query': '_tableFromQuery'
  },

  _TEXTS: {
    no_interaction_warn: _t("Map interaction is disabled, select cartodb_id to enable it")
  },

  className: 'map',
  animation_time: 300,

  initialize: function() {

    _.bindAll(this, "_renderOverlay", "_addOverlays", "_bindMapOptions", "_bindOverlays");

    this.template = this.getTemplate('table/views/maptab');

    this.map  = this.model;
    this.user = this.options.user;
    this.vis  = this.options.vis;

    this.canvas_mode     = "desktop";

    this.map_enabled     = false;
    this.georeferenced   = false;
    this.featureHovered  = null;
    this.activeLayerView = null;
    this.layerDataView   = null;
    this.layerModel      = null;
    this.legends         = [];
    this.overlays        = [];

    this.add_related_model(this.map);
    this.add_related_model(this.map.layers);

    this._addBindings();

  },

  _addBindings: function() {

    // Actions triggered in the right panel
    cdb.god.bind("panel_action", function(action) {
      this._moveInfo(action);
    }, this);

    this.add_related_model(cdb.god);

    this.map.bind('change:provider',       this.switchMapType, this);
    this.map.layers.bind('change:visible', this._addLegends, this);
    this.map.layers.bind('change:visible', this._addTimeline, this);
    this.map.layers.bind('remove reset',   this._addLegends, this);
    this.map.layers.bind('remove reset',   this._addTimeline, this);

    _.bindAll(this, 'showNoGeoRefWarning');

  },

  isMapEnabled: function() {
    return this.map_enabled;
  },

  deactivated: function() {
    if(this.map_enabled) {
      this.clearMap();
    }
  },

  clearMap: function() {

    clearTimeout(this.autoSaveBoundsTimer);

    this.mapView.clean();

    if (this.overlaysDropdown)        this.overlaysDropdown.clean();
    if (this.mapOptionsDropdown)      this.mapOptionsDropdown.clean();
    if (this.basemapDropdown)         this.basemapDropdown.clean();
    if (this.configureCanvasDropdown) this.configureCanvasDropdown.clean();

    if (this.zoom) {
      this.zoom.clean();
    }

    if (this.infowindow) {
      this.infowindow.clean();
    }

    this._cleanLegends();
    this._cleanOverlays();

    if (this.stackedLegend) {
      this.stackedLegend.clean();
    }

    if (this.timeline) {
      this.timeline.clean();
      this.timeline = null;
    }

    if (this.geometryEditor) this.geometryEditor.clean();

    if (this.table) {
      this.table.unbind(null, null, this);
    }

    delete this.mapView;
    delete this.overlaysDropdown;
    delete this.basemapDropdown;
    delete this.mapOptionsDropdown;
    delete this.configureCanvasDropdown;

    delete this.zoom;
    delete this.infowindow;
    delete this.layer_selector;
    delete this.search;
    delete this.header;
    delete this.fullscreen;
    delete this.share;
    delete this.legends;
    delete this.overlays;
    delete this.legend;
    delete this.stackedLegend;
    delete this.geometryEditor;

    this.map_enabled = false;

    // place the map DOM object again
    this.render();
  },


  /**
   *  Hide the infowindow when a query is applied or cleared
   */
  _hideInfowindow: function() {
    if(this.infowindow) {
      this.infowindow.model.set('visibility', false);
    }
  },


  /**
   * this function is used when the map library is changed. Each map library
   * works in different way and need to recreate all the components again
   */
  switchMapType: function() {

    if (this.map_enabled) {
      this.clearMap();
      this.enableMap();
    }

  },


  /**
   * map can't be loaded from the beggining, it needs the DOM to be loaded
   * so we wait until is actually shown to create the mapview and show it
   */
  enableMap: function() {

    this.render();

    var self = this;

    this.$('.tipsy').remove();

    if (!this.map_enabled) {

      this._addMapView();

      this.clickTimeout = null;

      this._bindMissingClickEvents();

      this.map_enabled = true;

      $(".map")
      .append('<div class="map-options" />')
      .append("<div class='mobile_bkg' />");

      this._addBasemapDropdown();
      this._addInfowindow();
      this._addTooltip();
      this._addLegends();
      this._addOverlays();

      var torqueLayer;

      var type = this.vis.get("type");

      if (type !== "table") {

        this._addOverlaysDropdown();
        this._addConfigureCanvasDropdown();
        this._addMapOptionsDropdown();

        this.vis.set({ canvas_mode: "desktop" }, { silent: true });
        this.vis.on("change:canvas_mode", this._onChangeCanvasMode, this);

      }

      this.vis.on("change:type", function() {
        self.switchMapType();
      }, this);

      this.vis.on("change:name change:description", this._onChangeHeaderContents, this);

      // HACK
      // wait a little bit to give time to the mapview
      // to estabilize
      this.autoSaveBoundsTimer = setTimeout(function() {
        self.mapView.setAutoSaveBounds();
      }, 1000);

    }
  },

  _addMapView: function() {

    var div = this.$('.cartodb-map');

    var mapViewClass = cdb.admin.LeafletMapView;

    var showLegends = this.map.get("legends");
    showLegends ? this.$el.removeClass("hide_legends") : this.$el.addClass("hide_legends");

    this.map.bind("change:legends", function() {
      var showLegends = this.map.get("legends");
      showLegends ? this.$el.removeClass("hide_legends") : this.$el.addClass("hide_legends");
    }, this);

    if(this.map.get('provider') === 'googlemaps') {

      if (!cdb.admin.GoogleMapsMapView) {
        cdb.log.error("google maps not available");
      }

      mapViewClass = cdb.admin.GoogleMapsMapView;
    }

    this.mapView = new mapViewClass({
      el: div,
      map: this.map,
      user: this.user
    });

    this.mapView.bind('removeLayerView', function(layerView) {
      if (this.layer_selector) this.layer_selector.render();
    }, this);

    this.mapView.bind('newLayerView', function(layerView, model) {
      if(this.activeLayerView && this.activeLayerView.model.id == model.id) {
        this._bindDataLayer(this.activeLayerView, model);

        if (this.layer_selector) {
          this.layer_selector.render();
        }
      }
    }, this);

    if (this.activeLayerView) {
      this._bindDataLayer(this.activeLayerView, this.activeLayerView.model);
    }

  },

  _removeOverlayPropertiesBar: function(show_toolbar, model) {

    // Abort the removal if we are clicking in the same overlay to edit
    if (model && this.overlayPropertiesBar && this.overlayPropertiesBar.compareModel(model)) return;

    if (show_toolbar) this._showToolbarOptions();

    // Attempt to destroy the bar
    if (this.overlayPropertiesBar) {

      var self = this;

      if (!model) { // if there's no current model, animate the bar
        this.overlayPropertiesBar.$el.animate({ top: 100 }, { duration: 150, complete: function() {
          self.overlayPropertiesBar.clean();
          delete self.overlayPropertiesBar;
        }});

        return false;

      } else { // otherwise, just remove the bar

        this.overlayPropertiesBar.clean();
        delete this.overlayPropertiesBar;
        return true;

      }

    }

  },

  _showToolbarOptions: function() {

    var self = this;

    this.$el.find(".map_toolbar ul.options").animate({ top: 0 }, { duration: 250, easing: "easeInOutQuad", complete: function() {
      self.$el.find(".map_toolbar").removeClass("animated");
    }});

  },

  _hideToobarOptions: function(model) {

    if (this.overlayPropertiesBar) {

      if (this.overlayPropertiesBar.compareModel(model)) { // if the model is the same as the current one, hide the options bar
        this.$el.find(".map_toolbar ul.options").animate({ top: -100 }, { duration: 200, easing: "easeInOutQuad" } );
      } else { // otherwise, deselect the overlay
        this.overlayPropertiesBar.deselectOverlay();
      }

    } else  {
      this.$el.find(".map_toolbar ul.options").animate({ top: -100 }, { duration: 200, easing: "easeInOutQuad" });
    }

  },

  _addOverlayPropertiesBar: function(model, form_data) {

    if (this.overlaysDropdown) this.overlaysDropdown.hide();

    this.$el.find(".map_toolbar").addClass("animated");

    this._hideToobarOptions(model);

    var animatedRemoval = this._removeOverlayPropertiesBar(false, model);

    if (!this.overlayPropertiesBar) {

      this.overlayPropertiesBar = new cdb.admin.OverlayPropertiesBar({
        model: model,
        overlays: this.overlays,
        vis: this.vis,
        form_data: form_data
      });

      this.addView(this.overlayPropertiesBar);
      this.overlayPropertiesBar.bind("remove", this._removeOverlayPropertiesBar, this);

      this.$el.find(".map_toolbar").append(this.overlayPropertiesBar.render().el);

      if (!animatedRemoval) {
        this.overlayPropertiesBar.$el.animate({ top: 0 }, { duration: 200, easing: "easeInOutQuad" });
      } else {
        this.overlayPropertiesBar.$el.css({ top: 0 });
      }

    }

  },

  _addConfigureCanvasDropdown: function() {

    if (!this.configureCanvasDropdown) {

      this.configureCanvasDropdown = new cdb.admin.ConfigureCanvasDropdown({
        target: $('.canvas_setup'),
        position: "position",
        vis: this.vis,
        template_base: "table/views/canvas_setup_dropdown",
        tick: "left",
        horizontal_position: "left",
        horizontal_offset: "40px"
      });

      this.addView(this.configureCanvasDropdown);

      cdb.god.bind("closeDialogs", this.configureCanvasDropdown.hide, this.configureCanvasDropdown);

      $(".canvas_setup").append(this.configureCanvasDropdown.render().el);

    }
  },

  _addOverlaysDropdown: function() {

    if (!this.overlaysDropdown) {

      this.overlaysDropdown = new cdb.admin.OverlaysDropdown({
        vis: this.vis,
        mapView: this.mapView,
        target: $('.add_overlay'),
        position: "position",
        collection: this.overlays,
        template_base: "table/views/widget_dropdown",
        overlays: this.overlays,
        tick: "left",
        horizontal_position: "left",
        horizontal_offset: "40px"
      });

      this.addView(this.overlaysDropdown);

      cdb.god.bind("closeDialogs", this.overlaysDropdown.hide, this.overlaysDropdown);

      $(".add_overlay").append(this.overlaysDropdown.render().el);
    }

  },

  _addBasemapDropdown: function() {

    if (!this.basemapDropdown) {

      if (this.vis.get("type") !== "table") {
        // TODO: use templates and _t for texts
        var $options = $('<a href="#" class="option-button dropdown basemap_dropdown"><div class="thumb"></div>Select basemap</a>');

        $(".map-options").append($options);

      }

      this.basemapDropdown = new cdb.admin.DropdownBasemap({
        target: $('.basemap_dropdown'),
        position: "position",
        template_base: "table/views/basemap/basemap_dropdown",
        model: this.map,
        mapview: this.mapView,
        baseLayers: this.options.baseLayers,
        tick: "left",
        vertical_offset: 40,
        horizontal_position: "left",
        vertical_position: this.vis.get("type") === 'table' ? "down" : "up",
        horizontal_offset: this.vis.get("type") === 'table' ? 42 : 0
      });

      this.addView(this.basemapDropdown);

      this.basemapDropdown.bind("onDropdownShown", function() {
        cdb.god.trigger("closeDialogs");
      });

      cdb.god.bind("closeDialogs", this.basemapDropdown.hide, this.basemapDropdown);

      $(".basemap_dropdown").append(this.basemapDropdown.render().el);

    }

    // Set active base layer if it already exists
    if (this.map.getBaseLayer()) {
      this.basemapDropdown.setActiveBaselayer();
    }

  },

  bindGeoRefCheck: function() {
    if(!this.table.data().fetched) {
      this.table.bind('dataLoaded', function() {
        this.checkGeoRef();
      }, this);
    } else {
      this.checkGeoRef();
    }
  },

  activated: function() {
    this.checkGeoRef();
    $(window).scrollTop(0);
  },

  checkGeoRef: function() {
    if(this.options && this.table && !this.vis.isVisualization()) {
      if(!this.table.isGeoreferenced()) {
        this.showNoGeoRefWarning();
        this.georeferenced = false;
      } else {
        this.georeferenced = true;
        if(this.noGeoRefDialog) {
          this.noGeoRefDialog.hide();
        }
      }
    }
  },

  /**
   * this function binds click and dblclick events
   * in order to not raise click when user does a dblclick
   *
   * it raises a missingClick when the user clicks on the map
   * but not over a feature or ui component
   */
  _bindMissingClickEvents: function() {
    var self = this;
    this.mapView.bind('click', function(e) {
      if(self.clickTimeout === null) {
        self.clickTimeout = setTimeout(function() {
          self.clickTimeout = null;
          if(!self.featureHovered) {
            self.trigger('missingClick');
          }
        }, 150);
      }
      //google maps does not send an event
      if(!self.featureHovered && e.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    this.mapView.bind('dblclick', function() {
      if(self.clickTimeout !== null) {
        clearTimeout(self.clickTimeout);
        self.clickTimeout = null;
      }
    });
  },

  setActiveLayer: function(layerView) {
    this.activeLayerView = layerView;
    // check if the map is rendered and the layer is in the map
    if(this.mapView && this.mapView.getLayerByCid(layerView.model.cid)) {
      var layerModel = layerView.model;
      this._bindDataLayer(layerView, layerModel);
    }
  },

  /**
   * when the layer view is created this method is called
   * to attach all the click events
   */
  _bindDataLayer: function(layerView, layer) {
    var self = this;
    var layerType = layer.get('type');

    if (layerType === 'CartoDB' || layerType === 'torque') { // unbind previos stuff

      // Set data layer bindings
      if (self.layerDataView) {
        self.layerDataView.unbind(null, null, this);
      }

      if (self.layerModel) {
        self.layerModel.unbind(null, null, this);
      }

      if (self.options.geocoder) {
        self.options.geocoder.unbind(null, null, this);
      }

      self.infowindowModel  = layer.infowindow;
      self.tooltipModel     = layer.tooltip;
      self.legendModel      = layer.legend;

      self._bindTable(layer.table);
      self._bindSQLView(layer.sqlView);
      self.layerDataView = self.mapView.getLayerByCid(layer.cid);

      self.mapView.setActiveLayer(layer);
      self._addLegends();
      self._addTimeline();

      if (self.layerDataView) {
        self.layerDataView.bind('featureClick', self.featureClick, self);
        self.layerDataView.bind('featureOut',   self.featureOut,   self);
        self.layerDataView.bind('featureOver',  self.featureOver,  self);
        self.layerDataView.bind('loading',      self.loadingTiles, self);
        self.layerDataView.bind('load',         self.loadTiles,    self);
        self.layerDataView.bind('error',        self.loadTiles,    self);
        self.tooltip
          .setLayer(self.layerDataView)
          .enable();

      }

      // Set layer model binding
      if (layerView && layer) {
        layer.unbind('startEdition',this._addGeometry, this);
        layer.bind('startEdition', this._addGeometry, this);
      }

      if(layer) {
        self.layerModel = layer;
        layer.bind('change:interactivity', this._updateSQLHeader, this);
        this._updateSQLHeader();
      }

      if (self.options.geocoder) {
        self.options.geocoder.bind('geocodingComplete geocodingError geocodingCanceled', this.updateDataLayerView, this);
        self.add_related_model(self.options.geocoder);
      }

    }
  },

  _cleanLegends: function() {

    if (this.legends) {
      _.each(this.legends, function(legend) {
        legend.clean();
      });

    }

    this.legends = [];

  },

  _cleanOverlays: function() {

    if (this.overlays) {
      _.each(this.overlays, function(model) {

        if (!model) return;

        var overlay = this._getOverlayTpe(overlay.get("type"));
        overlay.clean();

      });
    }

    this.overlays = [];

  },

  _getCartoDBLayers: function() {

    return this.map.layers.models.filter(function(layerModel) {
      return layerModel.get("type") === 'CartoDB'
    });

  },

  _getOverlay: function(type) {

    if (!this.overlays) return;

    return this.overlays.filter(function(m) { return m.get("type") == type })[0];

  },

  _getHeaderOverlay: function() {

    return this._getOverlay("header");

  },

  _getMarkdown: function(text) {

    return text ? $(markdown.toHTML(text)).html() : "";

  },

  _hideOverlays: function(mode) {

    var hideOverlays = ["search"];

    _.each(this.overlays.models, function(overlay) {

      var device  = overlay.get("device");

      if (device == mode) overlay.set("display", false);

    }, this);

  },

  _showOverlays: function(mode) {

    _.each(this.overlays.models, function(overlay) {

      var device  = overlay.get("device");

      if (device == mode) overlay.set("display", true);

    }, this);

  },

  _onChangeCanvasMode: function() {

    var self = this;

    cdb.god.trigger("closeDialogs");

    this.canvas_mode = this.vis.get("canvas_mode");

    if (this.canvas_mode === "desktop") {

      this._showDesktopCanvas(this.canvas_mode);

      setTimeout(function() {
        self._positionOverlaysVertically(true);
      }, 300);

    } else if (this.canvas_mode === "mobile") { 

      this._showMobileCanvas(this.canvas_mode);

      setTimeout(function() {
        self._positionOverlaysVertically(true);
      }, 300);

    }

  },

  _showMobileCanvas: function(mode) {

    var self = this;

    var width  = 288;
    var height = 476;

    this._hideOverlays("desktop");

    var $map = $("div.map div.cartodb-map");

    this.$el.addClass(mode);

    // Animations step - 1
    var onBackgroundShown = function() {

      $map.animate(
        { width: width, marginLeft: -Math.round(width/2) - 1, left: "50%" },
        { easing: "easeOutQuad", duration: 200, complete: onCanvasLandscapeStretched }
      );

    };

    // Animations step - 2
    var onCanvasPortraitStretched = function() {

      self.$el.find(".mobile_bkg").animate(
        { opacity: 1 },
        { duration: 250 }
      );

      self._showOverlays(mode);

      // Let's set center view for mobile mode
      var center = self.map.get('center');
      self.mapView.invalidateSize();
      $map.fadeOut(250);

      setTimeout(function() {
        self.mapView.map.setCenter(center);
        $map.fadeIn(250);
      },300);

    };

    // Animations step - 3
    var onCanvasLandscapeStretched = function() {

      $map.animate(
        { height: height, marginTop: -Math.round(height/2) + 23,  top:  "50%" },
        { easing: "easeOutQuad", duration: 200, complete: onCanvasPortraitStretched }
      );

    };

    onBackgroundShown();

    this._enableAnimatedMap();
    this._enableMobileLayout();

  },

  _enableMobileLayout: function() {

    if (!this.mobile) {

      var torqueLayer;

      this.mobile = new cdb.admin.overlays.Mobile({
        mapView: this.mapView,
        overlays: this.overlays,
        map: this.map
      });

      this.mapView.$el.append(this.mobile.render().$el);

    } else {
      this.mobile.show();
    }

  },

  _disableMobileLayout: function() {

    if (this.mobile) this.mobile.hide();

  },

  _showDesktopCanvas: function(mode) {

    var self = this;

    this._hideOverlays("mobile");

    this.$el.removeClass("mobile");

    this.$el.find(".mobile_bkg").animate({ opacity: 0}, 250);

    var
    $map       = $("div.map div.cartodb-map"),
    top        = $map.css("top"),
    left       = $map.css("left"),
    mTop       = $map.css("marginTop"),
    mLeft      = $map.css("marginLeft"),
    curWidth   = $map.width(),
    curHeight  = $map.height(),
    autoWidth  = $map.css({width:  'auto', marginLeft: 0, left: "15px"}).width();  //temporarily change to auto and get the width.
    autoHeight = $map.css({height: 'auto', marginTop: 0,  top: "82px" }).height(); //temporarily change to auto and get the width.

    $map.height(curHeight);
    $map.width(curWidth);

    $map.css({ top: top, left: left, marginLeft: mLeft, marginTop: mTop, height: curHeight, width: curWidth });

    var onSecondAnimationFinished = function() {

      $map.css('width', 'auto');
      self._showOverlays(mode);

      // Let's set center view for desktop mode
      var center = self.map.get('center');
      self.mapView.invalidateSize();  

      setTimeout(function() {
        self.mapView.map.setCenter(center);
      },300);

    };

    var onFirstAnimationFinished = function() {

      $map.css('height', 'auto');
      $map.animate(
        { width: autoWidth, left: "15px", marginLeft: "0"},
        { easing: "easeOutQuad", duration: 200, complete: onSecondAnimationFinished }
      );

    };

    var stretchMapLandscape = function() {
      $map.animate(
        { height: autoHeight, top: "82", marginTop: "0"},
        { easing: "easeOutQuad", duration: 200, complete: onFirstAnimationFinished }
      );
    };

    stretchMapLandscape();

    this._disableAnimatedMap();
    this._disableMobileLayout();

  },

  _enableAnimatedMap: function() {

    var self = this;

    setTimeout(function() {
      self.$el.addClass("animated");
    }, 800)

  },

  _disableAnimatedMap: function() {
    this.$el.removeClass("animated");
  },

  _onChangeHeaderContents: function() {

    var headerOverlay = this._getHeaderOverlay();

    var description = this.vis.get("description");
    var name        = this.vis.get("name");

    if (headerOverlay) {
      headerOverlay.set({ title: name, description: this._getMarkdown(description) });
    }

  },

  _setupOverlay: function(overlay) {

    overlay.urlRoot = this.overlays.url;

    var options = overlay.get("options");

    if (options) {

      options = JSON.parse(options);

      overlay.set({

        x:            options.x,
        y:            options.y,
        oder:         options.order,
        device:       options.device,
        extra:        options.extra,
        style:        options.style,
        display:      options.display

      }, { silent: true });

    }

    this._renderOverlay(false, overlay);

  },

  _createOverlay: function(options) {

    var model = new cdb.admin.models.Overlay(options);

    this.overlays.add(model);

    model.save();

  },

  _createZoomOverlay: function() {

    var options = {
      type: "zoom",
      order: 6,
      display: true,
      template: '<a href="#zoom_in" class="zoom_in">+</a> <a href="#zoom_out" class="zoom_out">-</a>',
      x: 20,
      y: 20
    };

    this._createOverlay(options);

  },

  _createLogoOverlay: function() {

    var options = {
      type: "logo",
      order: 10,
      display: true,
      x: 10,
      y: 40
    };

    this._createOverlay(options);

  },

  _createSearchOverlay: function() {

    var options = {
      type: "search",
      order: 3,
      display: true,
      x: 60,
      y: 20
    }

    this._createOverlay(options);

  },

  _createLayerSelectorOverlay: function() {

    var options = {
      type: "layer_selector",
      order: 4,
      display: true,
      x: 212,
      y: 20
    };

    this._createOverlay(options);

  },

  _createShareOverlay: function() {

    var options = {
      type: "share",
      order: 2,
      display: true,
      x: 20,
      y: 20
    };

    this._createOverlay(options);

  },

  _createHeaderOverlay: function(property) {

    var show_title       = false;
    var show_description = false;

    if (property === "title")       show_title       = true;
    if (property === "description") show_description = true;

    var description = this.vis.get("description");
    var title       = this.vis.get("name");

    if (!show_title && property == 'description' && !description) return;

    var options = {
      type: "header",
      order: 1,
      display: true,
      extra: {
        title: title,
        description: description,
        show_title: show_title,
        show_description: show_description
      }
    };

    this._createOverlay(options);

  },

  _createFullScreenOverlay: function() {

    var options = {
      type: "fullscreen",
      order: 7,
      display: true,
      x: 20,
      y: 172
    };

    this._createOverlay(options);

  },

  // SHARE

  _setupShareOverlay: function(type, data) {

    var overlay = this.share = new cdb.admin.overlays[type]({
      model: data,
      map: this.map
    });

    overlay.show();

    this._bindShareOverlay(overlay);

    return overlay;

  },

  _bindShareOverlay: function(overlay) {

    var self = this;

    this._positionShareOverlay(overlay.model);
    this._positionOverlaysHorizontally();

    var onDestroy = function() {

      self.share.clean();
      delete self.share;

      self._positionOverlaysHorizontally();

    };

    overlay.model.bind("destroy", onDestroy, this);

  },

  // LOADER

  _setupLoaderOverlay: function(type, data) {

    if (this.loader) return;

    var overlay = this.loader = new cdb.admin.overlays[type]({
      model: data,
      map: this.map
    });

    this._bindLoaderOverlay(overlay);

    return overlay;

  },

  _bindLoaderOverlay: function(overlay) {

    this._positionLoaderOverlay(overlay.model);

  },

  // FULLSCREEN

  _setupFullScreenOverlay: function(type, data) {

    if (this.fullscreen) return;

    var overlay = this.fullscreen = new cdb.admin.overlays[type]({
      model: data,
      mapView: this.mapView
    });

    this._bindFullScreenOverlay(overlay);

    return overlay;

  },

  _bindFullScreenOverlay: function(overlay) {

    var self = this;

    this._positionOverlay(overlay.model);

    var onDestroy = function() {
      self.fullscreen.clean();
      delete self.fullscreen;
    };

    overlay.show();

    overlay.model.bind("destroy", onDestroy, this);

  },

  _setupLayerSelectorOverlay: function(type, data) {

    if (this.layer_selector) return;

    var overlay = this.layer_selector = new cdb.admin.overlays[type]({
      model: data,
      mapView: this.mapView,
      template: this.getTemplate("table/views/layer_selector"),
      dropdown_template: this.getTemplate("table/views/layer_dropdown")
    });

    overlay.show();

    this._bindLayerSelectorOverlay(overlay);

    return overlay;

  },

  _bindLayerSelectorOverlay: function(overlay) {

    var self = this;

    this._positionOverlay(overlay.model);

    var onDestroy = function() {

      self.layer_selector.clean();
      delete self.layer_selector;

    };

    overlay.model.bind("destroy", onDestroy, this);

  },

  // ZOOM

  _setupZoomOverlay: function(type, data) {

    if (this.zoom) return;

    var overlay = this.zoom = new cdb.admin.overlays[type]({
      model: data,
      map: this.map
    });

    overlay.show();

    this._bindZoomOverlay(overlay);

    return overlay;

  },

  _bindZoomOverlay: function(overlay) {

    var self = this;

    var n = this.vertical_overlays.indexOf(overlay.model.get("type"));

    for (var i = n ; i< this.vertical_overlays.length; i++) {

      var type = this.vertical_overlays[i];

      var overlay_model = this._getOverlay(type);

      if (overlay_model) this._positionOverlay(overlay_model)

    }


    var onDestroy = function() {

      self.zoom.clean();
      delete self.zoom;

      var n = this.vertical_overlays.indexOf(overlay.model.get("type"));

      for (var i = n + 1; i< this.vertical_overlays.length; i++) {

        var type = this.vertical_overlays[i];

        var overlay_model = this._getOverlay(type);
        if (overlay_model) this._positionOverlay(overlay_model)

      }

    };

    overlay.model.bind("destroy", onDestroy, this);

  },

  _setupCartoDBLogo: function(type, data) {

    var overlay = this.cartodb_logo = new cdb.admin.overlays[type]({
      model: data,
      map: this.map
    });

    return overlay;

  },

  _setupSearchOverlay: function(type, data) {

    if (this.search) return;

    var overlay = this.search = new cdb.admin.overlays[type]({
      model: data,
      relative_position: this.vis.get("type") === "table",
      map: this.map
    });

    this._bindSearchOverlay(overlay);

    return overlay;

  },

  _bindSearchOverlay: function(overlay) {

    var self = this;

    this._positionShareOverlay(overlay.model);
    this._positionOverlaysHorizontally();

    var onDestroy = function() {

      self.search.clean();
      delete self.search;

      self._positionOverlaysHorizontally();

    };

    overlay.model.bind("destroy", onDestroy, this);

  },

  _setupHeaderOverlay: function(type, data) {

    var overlay = this.header = new cdb.admin.overlays[type]({
      model: data,
      map: this.map
    });

    this._bindHeaderOverlay(overlay);

    return overlay;

  },

  _bindHeaderOverlay: function(overlay) {

    var self = this;

    var onDestroy = function() {

      self.header.clean();
      delete self.header;

      self._positionOverlaysVertically();

    };

    overlay.bind("change_y", this._positionOverlaysVertically, this);
    overlay.model.bind("destroy", onDestroy, this);

  },

  _getHeaderHeight: function() {

    return $(".header.overlay-static").outerHeight(true);

  },

  _positionOverlay: function(overlay_model) {

    if (!overlay_model) return;

    var type = overlay_model.get("type");

    if      (type === 'header')         this._positionHeaderOverlay(overlay_model);
    else if (type === 'zoom')           this._positionZoomOverlay(overlay_model);
    else if (type === 'fullscreen')     this._positionFullScreenOverlay(overlay_model);
    else if (type === 'share')          this._positionShareOverlay(overlay_model);
    else if (type === 'loader')         this._positionLoaderOverlay(overlay_model);
    else if (type === 'search')         this._positionSearchOverlay(overlay_model);
    else if (type === 'layer_selector') this._positionLayerSelectorOverlay(overlay_model);

  },

  _positionHeaderOverlay: function(overlay_model) {

    if (this.headerMessageIsVisible && this.canvas_mode === 'desktop') overlay_model.set("y", 20);
    else overlay_model.set("y", 0);

  },

  _positionSearchOverlay: function(overlay_model) {

    var y = this.header ? this._getHeaderHeight() + 20 : 20;
    var x = this.share  ? 60 : 20;

    if (this.headerMessageIsVisible && this.canvas_mode === 'desktop') overlay_model.set("y", this._getHeaderHeight() + 40);
    else overlay_model.set("y", y);

    overlay_model.set("x", x);

  },

  _positionLayerSelectorOverlay: function(overlay_model) {

    var y = 20;
    var x = 20;

    if (this.header) y = this._getHeaderHeight() + 20;

    if      (this.search && this.share) x = 220;
    else if (this.search)               x = 180;
    else if (this.share)                x = 60;

    overlay_model.set("x", x);

    if (this.headerMessageIsVisible && this.canvas_mode === 'desktop') overlay_model.set("y", this._getHeaderHeight() + 40);
    else overlay_model.set("y", y);

  },

  _positionShareOverlay: function(overlay_model) {

    var y = this.header ? this._getHeaderHeight() + 20 : 20;

    if (this.headerMessageIsVisible && this.canvas_mode === 'desktop') overlay_model.set("y", this._getHeaderHeight() + 40);
    else overlay_model.set("y", y);

  },

  _positionLoaderOverlay: function(overlay_model) {

    var hasSQLHeader = this.headerMessageIsVisible && this.canvas_mode === 'desktop';

    var y = 20;

    if (this.canvas_mode === 'mobile' && this.header) {
      y = this._getHeaderHeight() + 20;
    }
    else if (this.fullscreen) y = this.fullscreen.model.get("y") + 40;
    else if (this.zoom)       y = this.zoom.model.get("y") + 120;
    else if (this.header)     y = this._getHeaderHeight() + 20;
    else if (hasSQLHeader)    y = this._getHeaderHeight() + 40;

    overlay_model.set("y", y);

  },

  _positionZoomOverlay: function(overlay_model) {

    var y = this.header ? this._getHeaderHeight() + 20 : 20;

    if ( this.headerMessageIsVisible) overlay_model.set("y", this._getHeaderHeight() + 40);
    else overlay_model.set("y", y);

  },

  _positionFullScreenOverlay: function(overlay_model) {

    if      (this.zoom)                   overlay_model.set("y", this.zoom.model.get("y") + 120);
    else if (this.header)                 overlay_model.set("y", this._getHeaderHeight() + 20);
    else if (this.headerMessageIsVisible && this.canvas_mode === 'desktop') overlay_model.set("y", this._getHeaderHeight() + 40);
    else                                  overlay_model.set("y", 20);

  },

  _getOverlayTpe: function(data) {

    var type = data.get("type");

    if (!type) type = "text";

    return _.map(type.split("_"), function(word) {
      return word.slice(0, 1).toUpperCase() + word.slice(1);
    }).join("");

  },

  _renderOverlay:  function(delayed_animation, model) {

    var type         = this._getOverlayTpe(model);
    var device       = model.get("device");

    var vis_overlays = ["Header", "Fullscreen", "Share", "LayerSelector"];

    if (_.contains(vis_overlays, type) && this.vis.get("type") === "table") {
      return;
    }

    var display = (device && device != this.canvas_mode) ? false : true;

    model.set("display", display);

    var overlay = this._configureOverlay(model);

    if (!overlay) return;

    this._bindOverlay(overlay);

    if (type === "Text" || type === "Annotation" || type === "Image") { 
      this._toggleOverlay(overlay);
    }

  },

  _configureOverlay: function(model) {

    var type = this._getOverlayTpe(model);
    var overlay;

    switch(type) {

      case 'Loader':         overlay = this._setupLoaderOverlay(type, model);          break;
      case 'Zoom':           overlay = this._setupZoomOverlay(type, model);            break;
      case 'Share':          overlay = this._setupShareOverlay(type, model);           break;
      case 'Header':         overlay = this._setupHeaderOverlay(type, model);          break;
      case 'Search':         overlay = this._setupSearchOverlay(type, model);          break;
      case 'Logo':           overlay = this._setupCartoDBLogo(type, model);            break;
      case 'LayerSelector':  overlay = this._setupLayerSelectorOverlay(type, model);   break;
      case 'Fullscreen':     overlay = this._setupFullScreenOverlay(type, model);      break;

      // Default
      case 'Text':           overlay = new cdb.admin.overlays[type]({ model: model }); break;
      case 'Image':          overlay = new cdb.admin.overlays[type]({ model: model }); break;
      case 'Annotation':     overlay = new cdb.admin.overlays[type]({
        model: model,
        mapView: this.mapView 
      }); break;

    }

    return overlay;

  },

  _positionOverlaysHorizontally: function() {

    _.each(this.horizontal_overlays, function(type) {

      var overlay_model = this._getOverlay(type);
      if (overlay_model) this._positionOverlay(overlay_model)

    }, this);

  },

  _positionOverlaysVertically: function(move_header) {

    if (!this.overlays) return;

    if (move_header) {

      var header = this._getHeaderOverlay();
      this._positionOverlay(header);
    }

    _.each(this.horizontal_overlays, function(type) {

      var overlay_model = this._getOverlay(type);
      if (overlay_model) this._positionOverlay(overlay_model)

    }, this);

    _.each(this.vertical_overlays, function(type) {

      var overlay_model = this._getOverlay(type);
      if (overlay_model) this._positionOverlay(overlay_model)

    }, this);

  },

  _bindOverlay: function(overlay) {

    this.mapView.$el.append(overlay.render().$el);

    if (overlay.model.get("type") == "header") {
      this._positionOverlaysVertically();
    }

    if (overlay.model.get("type") == 'search') this._positionSearchOverlay(overlay.model)

    overlay.bind("remove", function(overlay) {
      this.overlays.remove(overlay.model);
      this._removeOverlayPropertiesBar(true);
    }, this);

    overlay.bind("clickEdit", function(model, form_data) {
      this._addOverlayPropertiesBar(model, form_data);
    }, this);

  },

  /* Show or hide an overlay */
  _toggleOverlay: function(overlay, delayed_animation) {

    this._reloadDraggable();

    if (delayed_animation) { // Random animation

      var randomTime = 100 + Math.random() * 900;

      setTimeout(function() {

        if (overlay.model.get("display")) overlay.show();

      }, randomTime);

    } else { // Show the overlay right away

      if (overlay.model.get("display")) overlay.show();

    }

  },

  _reloadDraggable: function() {

    $(".overlay").draggable({
      container: $(".cartodb-map"),
      stickiness: 10
    });

  },

  _addMapOptionsDropdown: function() {

    if (!this.mapOptionsDropdown) {

      var $options = $("<a href='#show-options' class='option-button show-table-options'>Options</a>");

      this.$options = $options;

      $(".map-options").append($options);

      this.mapOptionsDropdown = new cdb.admin.MapOptionsDropdown({
        target:              $('.show-table-options'),
        template_base:       "table/views/map_options_dropdown",
        table:               table,
        model:               this.map,
        mapview:             this.mapView,
        collection:          this.overlays,
        user:                this.user,
        vis:                 this.vis,
        position:            "position",
        tick:                "left",
        vertical_position:   "up",
        horizontal_position: "left",
        horizontal_offset:   "-3px"
      });

      this._bindMapOptions();

      this.addView(this.mapOptionsDropdown);

      $(".show-table-options").append(this.mapOptionsDropdown.render().el);

    }

  },

  _bindMapOptions: function() {

    var self = this;

    this.mapOptionsDropdown.bind("onDropdownShown", function() {
      cdb.god.trigger("closeDialogs");
      self.$options.addClass("open");
    });

    this.mapOptionsDropdown.bind("onDropdownHidden", function() {
      self.$options.removeClass("open");
    });

    this.mapOptionsDropdown.bind("createOverlay", function(overlay_type, property) {

      if      (overlay_type === 'fullscreen')     self._createFullScreenOverlay();
      else if (overlay_type === 'header')         self._createHeaderOverlay(property);
      else if (overlay_type === 'layer_selector') self._createLayerSelectorOverlay();
      else if (overlay_type === 'share')          self._createShareOverlay();
      else if (overlay_type === 'search')         self._createSearchOverlay();
      else if (overlay_type === 'zoom')           self._createZoomOverlay();
      else if (overlay_type === 'logo')           self._createLogoOverlay();

    });

    cdb.god.bind("closeDialogs", this.mapOptionsDropdown.hide, this.mapOptionsDropdown);

  },

  _addOverlays: function() {

    var self = this;

    this.horizontal_overlays = ["share", "layer_selector", "search"];
    this.vertical_overlays   = ["zoom", "fullscreen", "loader"];

    this.overlays            = new cdb.admin.Overlays([]);

    this.overlays.url = "/api/v1/viz/" + this.vis.get("id") + "/overlays";
    this.overlays.fetch({ reset: true });

    this._bindOverlays();

  },

  _bindOverlays: function() {

    var self = this;

    this.add_related_model(this.overlays);

    this.overlays.bind("reset", this._onResetOverlays, this);

    this.overlays.bind("remove", function(overlay) {
      overlay.destroy();
    });

    this.overlays.bind("add", function(overlay) {
      self._renderOverlay(false, overlay);
      self._reloadDraggable();
    });

  },

  _onResetOverlays: function(overlays) {

    if (overlays.models.length > 0) {
      overlays.each(this._setupOverlay, this)
    }

  },

  _addLegends: function() {

    var self = this;

    this._cleanLegends();

    var models = this.map.layers.models;

    for (var i = models.length - 1; i >= 0; --i) {
      var layer = models[i];
      self._addLegend(layer);
    }

  },

  _addLegend: function(layer) {

    var type = layer.get('type');

    if (type === 'CartoDB' || type === 'torque') {

      if (this.table && this.mapView) {

        if (this.legend) this.legend.clean();

        if (layer.get("visible")) {

          var legend = new cdb.geo.ui.Legend({
            model:   layer.legend,
            mapView: this.mapView,
            table:   this.table
          });

          if (this.legends) {
            this.legends.push(legend);
            this._renderStackedLengeds();
          }

        }
      }
    }

  },

  _addTimeline: function() {
    if (!this.mapView) return;
    // check if there is some torque layer
    if(!this.map.layers.any(function(lyr) { return lyr.get('type') === 'torque' && lyr.get('visible'); })) {
      this.timeline && this.timeline.clean();
      this.timeline = null;
    } else {
      var layer = this.map.layers.getLayersByType('torque')[0];

      if (this.timeline) {
        // check if the model is different
        if (this.timeline.torqueLayer.model.cid !== layer.cid) {
          this.timeline.clean();
          this.timeline = null;
        }
      }

      layerView = this.mapView.getLayerByCid(layer.cid);

      if (layerView) {
        if (!this.timeline) {
          this.timeline = new cdb.geo.ui.TimeSlider({
            layer: layerView,
            width: "auto"
          });

          this.mapView.$el.append(this.timeline.render().$el);
          this.addView(this.timeline);
        } else {
          this.timeline.setLayer(layerView);
        }
      }
    }
  },

  _renderStackedLengeds: function() {

    if (this.stackedLegend) this.stackedLegend.clean();
    if (this.legend)        this.legend.clean();

    this.stackedLegend = new cdb.geo.ui.StackedLegend({
      legends: this.legends
    });

    this.mapView.$el.append(this.stackedLegend.render().$el);
    this.addView(this.stackedLegend);

  },

  _renderLegend: function() {

    if (this.legend) this.legend.clean();

    this.legend = this.legends[0];

    this.mapView.$el.append(this.legend.render().$el);

    if (!this.legend.model.get("type")) this.legend.hide();
    else this.legend.show();

    this.addView(this.legend);

  },

  _addTooltip: function() {
    if(this.tooltip) this.tooltip.clean();
    if(this.table && this.mapView) {
      this.tooltip = new cdb.admin.Tooltip({
        model: this.tooltipModel,
        table: this.table,
        omit_columns: ['cartodb_id'] // don't show cartodb_id while hover
      });
      this.mapView.$el.append(this.tooltip.render().el);
      this.tooltip.bind('editData', this._editData, this);
      this.tooltip.bind('removeGeom', this._removeGeom, this);
      this.tooltip.bind('editGeom', this._editGeom, this);
      if (this.layerDataView) {
        this.tooltip
          .setLayer(this.layerDataView)
          .enable();
      }
    }
  },

  _addInfowindow: function() {
    if(this.infowindow) this.infowindow.clean();
    if(this.table && this.mapView) {
      this.infowindow = new cdb.admin.MapInfowindow({
        model: this.infowindowModel,
        mapView: this.mapView,
        table: this.table
      });
      this.mapView.$el.append(this.infowindow.el);

      // Editing geometry
      if(this.geometryEditor) {
        this.geometryEditor.discard();
        this.geometryEditor.clean();
      }

      this.geometryEditor = new cdb.admin.GeometryEditor({
        model: this.table
      });

      this.geometryEditor.mapView = this.mapView;
      this.mapView.$el.append(this.geometryEditor.render().el);
      this.geometryEditor.hide();

      this.geometryEditor.bind('editStart', this.hideDataLayer, this);
      this.geometryEditor.bind('editDiscard', this.showDataLayer, this);
      this.geometryEditor.bind('editFinish', this.showDataLayer, this);
      this.geometryEditor.bind('editFinish', this.updateDataLayerView, this);
      this.geometryEditor.bind('geomCreated', function(row) {
        this.table.data().add(row);
      }, this);

      var self = this;

      this.infowindow.bind('editData', this._editData, this);
      this.infowindow.bind('removeGeom', this._removeGeom, this);
      this.infowindow.bind('editGeom', this._editGeom, this);

      this.infowindow.bind('openInfowindowPanel', function() {
        this.activeLayerView.showModule('infowindow', 'fields');
      }, this);

      this.infowindow.bind('close', function() {
        if (this.tooltip) {
          this.tooltip.setFilter(null);
        }
      }, this);

      this.table.bind('remove:row', this.updateDataLayerView, this);

      this.table.bind('change:dataSource', function() {
        this.geometryEditor.discard();
      }, this);

      this.map.bind('change:provider', function() {
        this.geometryEditor.discard();
      }, this);
    }
  },

  _editGeom: function(row) {
    // when provider is leaflet move the world to [-180, 180]
    // because vector features are only rendered on that slice
    if (this.map.get('provider') === 'leaflet') {
      this.map.clamp();
    }
    this.geometryEditor.editGeom(row);
  },

  /**
   * Shows edit data modal window
   */
  _editData: function(row) {
    var self = this;

    if (!this.table.isReadOnly()) {
      row.fetch({ cache: false, no_geom: true, success: function() {
        var feature_edition_dialog = new cdb.admin.EditFeatureFields({
          model: row,
            table: self.table,
            res: function(data) {
              self.table.notice('Saving ... ', 'load');
              // Set row model
              $.when(
                row.save(data)
                ).done(function(a){
                  // hack: since the model is not included in the table data
                  // raise manually data:saved on the table
                  self.table.trigger('data:saved');
                  self.table.notice('Saved', 'info', 5000);
                }).fail(function(){
                  self.table.notice('Something has failed', 'error', 5000);
                })
            }
        });

        feature_edition_dialog
          .appendToBody()
          .open({ center: true });
      }});

      return false;
    }
  },

  /**
   * triggers an removeGeom event when the geometry
   * is removed from the server
   */
  _removeGeom: function(row) {
    if (!this.table.isReadOnly()) {
      var self = this;

      var remove_confirmation = new cdb.admin.BaseDialog({
        title: "Delete feature",
          description: "Are you sure you want to delete this feature and all its associated data?",
          template_name: 'common/views/confirm_dialog',
          clean_on_hide: true,
          enter_to_confirm: true,
          ok_button_classes: "right button grey",
          ok_title: "Yes, do it",
          cancel_button_classes: "underline margin15",
          cancel_title: "Cancel",
          modal_type: "confirmation",
          width: 500
      });

      // If user confirms, app removes the row
      remove_confirmation.ok = function() {
        self.table.trigger('removing:row');
        self.model.set("visibility", false);
        row.destroy({
          success: function() {
            self.table.trigger('remove:row', row);
          }
        }, { wait: true });
      }

      remove_confirmation
        .appendToBody()
        .open();

      return false;
    }
  },

  _addGeometry: function(type) {
    this.geometryEditor.createGeom(this.table.data().newRow(), type);
  },

  _bindTable: function(table) {

    if (this.table) {
      this.table.unbind(null, null, this);
    }

    this.table = table;

    this.table.bind('change:dataSource', this._hideInfowindow, this);
    this.table.bind('change:dataSource', this._updateSQLHeader, this);
    this.table.bind('change:schema',     this._updateSQLHeader, this);

    this.table.bind('data:saved', function() {
      this.updateDataLayerView();
    }, this);

    this._addInfowindow();

    this._addLegends();
    this._addTooltip();

    this.bindGeoRefCheck();
  },

  _bindSQLView: function(sqlView) {
    if(this.sqlView) {
      this.sqlView.unbind(null, null, this);
    }
    this.sqlView = sqlView;
    this.sqlView.bind('reset error', this._updateSQLHeader, this);
    this.sqlView.bind('loading', this._renderLoading, this);
    this._updateSQLHeader();
  },

  _renderLoading: function(opts) {
    this._removeSQLViewHeader();

    //TODO: remove this hack
    if ($('.table_panel').length > 0) {
      panel_opened = $('.table_panel').css("right").replace("px","") == 0
    }

    var html = this.getTemplate('table/views/sql_view_notice_loading')({
      panel_opened: panel_opened
    });

    this.$('.cartodb-map').after(html);
  },

  _updateSQLHeader: function() {
    if(this.table.isInSQLView()) {
      this._addSQLViewHeader();
    } else {
      this._removeSQLViewHeader();
    }
  },


  loadingTiles: function() {
    if (this.loader) this.loader.show();
  },

  loadTiles: function() {
    if (this.loader) this.loader.hide();
  },

  featureOver: function(e, latlon, pxPos, data) {
    if(this.infowindowModel.get('disabled')) return;
    this.mapView.setCursor('pointer');
    this.featureHovered = data;
  },

  featureOut: function() {
    if(this.infowindowModel.get('disabled')) return;
    this.mapView.setCursor('auto');
    this.featureHovered = null;
  },

  featureClick: function(e, latlon, pxPos, data) {
    if(this.infowindowModel.get('disabled')) return;
    if(!this.geometryEditor.isEditing()) {
      if(data.cartodb_id) {
        this.infowindow
          .setLatLng(latlon)
          .setFeatureInfo(data.cartodb_id)
          .showInfowindow();

        this.tooltip.setFilter(function(feature) {
          return feature.cartodb_id !== data.cartodb_id;
        }).hide();
      } else {
        cdb.log.error("can't show infowindow, no cartodb_id on data");
      }
    }
  },

  /**
   *  Move all necessary blocks when panel is openned (normal, narrowed,...) or closed
   */
  _moveInfo: function(type) {
    if (type === "show") {
      this.$el
        .removeClass('narrow')
        .addClass('displaced');
    } else if (type === "hide") {
      this.$el.removeClass('narrow displaced');
    } else if (type === "narrow") {
      this.$el.addClass('narrow displaced');
    }
  },

  render: function() {

    this.$el.html('');

    this.$el
    .removeClass("mobile")
    .removeClass("derived")
    .removeClass("table");

    this.$el.addClass(this.vis.get("type"));

    this.$el.append(this.template(this.vis.attributes));

    return this;

  },

  showDataLayer: function() {
    this.mapView.enableInteraction();
    this.layerDataView.setOpacity && this.layerDataView.setOpacity(1.0);
  },

  hideDataLayer: function() {
    this.mapView.disableInteraction();
    this.layerDataView.setOpacity && this.layerDataView.setOpacity(0.5);
  },

  /**
   * reload tiles
   */
  updateDataLayerView: function() {
    if(this.layerDataView) {
      this.layerDataView.invalidate();
    }
  },
  /**
   * Paints a dialog with a warning when the user hasn't any georeferenced row
   * @method showNoGeorefWarning
   */
  showNoGeoRefWarning: function() {
    var warningStorageName = '';
    if(this.table.data().length > 0) {
      warningStorageName = 'georefContentWarningShowed' + this.table.id;
    } else {
      warningStorageName = 'georefNoContentWarningShowed' + this.table.id;
    }

    // if the dialog already has been shown, we don't show it again
    if(!this.noGeoRefDialog && !this.table.isInSQLView() && (!localStorage[warningStorageName])) {
      localStorage[warningStorageName] = true;

      this.noGeoRefDialog = new cdb.admin.NoGeoRefDataDialog({
        model: this.table,
        user: this.user,
        geocoder: this.options.geocoder
      });

      this.noGeoRefDialog.appendToBody();
      this.noGeoRefDialog.open({ center:true });
    }

  },

  //adds the green indicator when a query is applied
  _addSQLViewHeader: function() {
    this.$('.sqlview').remove();
    var total = this.table.data().size();
    var warnMsg = null;
    // if the layer does not suppor interactivity do not show the message
    if (this.layerModel && !this.layerModel.get('interactivity') && this.layerModel.wizard_properties.supportsInteractivity()) {
      warnMsg = this._TEXTS.no_interaction_warn;
    }
    if (this.layerModel && !this.layerModel.table.containsColumn('the_geom_webmercator')) {
      warnMsg = _t('the_geom_webmercator column should be selected');
    }
    var html = this.getTemplate('table/views/sql_view_notice')({
      empty: !total,
        isVisualization: this.vis.isVisualization(),
        warnMsg: warnMsg
    });

    this.$('.cartodb-map').after(html);

    var self = this;

    this.headerMessageIsVisible = true;

    setTimeout(function() {
      self._positionOverlaysVertically(true);
    }, 200)

  },

  _removeSQLViewHeader: function() {

    this.headerMessageIsVisible = false;

    this._positionOverlaysVertically(true);

    this.$('.sqlview').remove();

  },

  _clearView: function(e) {
    this.killEvent(e);
    this.activeLayerView.model.clearSQLView();
    return false;
  },

  _tableFromQuery: function(e) {
    this.killEvent(e);

    var duplicate_dialog = new cdb.admin.DuplicateTableDialog({
      model: this.table
    });
    duplicate_dialog.appendToBody().open();
  }

});
