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
      if (this.groupLayer) {
        this.groupLayer._clearInteraction();
      }
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
        if(this.map.layers.getLayersByType('CartoDB').length === 0) {
          this.groupLayer.remove();
          this.groupLayer = null;
        } else {
          var def = this.map.layers.getLayerDef();
          this.groupLayer.setLayerDefinition(def);
          this._setInteraction();
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
              maps_api_template: cdb.config.get('maps_api_template'),
              no_cdn: false,
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

        layer.bind('change:tile_style change:query change:query_wrapper change:interactivity change:visible', this._updateLayerDefinition, this);
        this._addLayerToMap(this.groupLayer);
        delete this.layers[this.groupLayer.model.cid];
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
    'click .toggle_slides.button': '_toggleSlides',
    'click .add_overlay.button':   'killEvent',
    'click .canvas_setup.button':  'killEvent',
    'click .export_image.button':  '_exportImage',
    'click .sqlview .clearview':   '_clearView',
    'click .sqlview .export_query':'_tableFromQuery',
    'click .sqlview .dismiss':'_dismissSQLView',
    'keydown':'_onKeyDown'
  },

  _TEXTS: {
    no_interaction_warn: _t("Map interaction is disabled, select cartodb_id to enable it")
  },

  className: 'map',
  animation_time: 300,

  initialize: function() {

    this.template = this.getTemplate('table/views/maptab');

    this.map  = this.model;
    this.user = this.options.user;
    this.vis  = this.options.vis;
    this.master_vis  = this.options.master_vis;

    this.canvas  = new cdb.core.Model({ mode: "desktop" });

    this.map_enabled     = false;
    this.georeferenced   = false;
    this.featureHovered  = null;
    this.activeLayerView = null;
    this.layerDataView   = null;
    this.layerModel      = null;
    this.legends         = [];
    this.overlays        = null;

    this.add_related_model(this.map);
    this.add_related_model(this.canvas);
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
    this.map.layers.bind('change:tile_style', this._addTimeline, this);
    this.map.layers.bind('remove reset',   this._changeLegends, this);
    this.map.layers.bind('remove reset',   this._addTimeline, this);

    this._addLegendBindings();

    _.bindAll(this, 'showNoGeoRefWarning', "_exportImage");

  },

  _addLegendBindings: function () {
    var self = this;
    this.map.layers.each($.proxy(this._bindLegendChange, this));
    this.map.layers.bind('add', $.proxy(this._bindLegendChange, this));
    this.map.layers.bind('remove', $.proxy(this._unbindLegendChange, this));
    this.map.layers.bind('reset', function (c) {
        c.each($.proxy(self._unbindLegendChange, self));
    });
  },

  _bindLegendChange: function(l) {
    if (l.legend) {
      l.legend.bind('change:style', $.proxy(this._addLegends, this));

      // unset CSS style on change of any legend attribute other than the style itself
      // (needs to be recalculated)
      l.legend.bind('change:items change:show_title change:title change:template change:type change:visible',
                    $.proxy(this._changeLegends, this));
    }
  },

  _unbindLegendChange: function(l) {
    if (l.legend) {
      l.legend.off('change', $.proxy(this._changeLegends, this));
    }
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

    if (this.exportImageView) {
      this.exportImageView.clean();
      this.exportImageView = null;
    }

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

    if (this.overlays) {
      this.overlays._cleanOverlays();
    }

    this._cleanLegends();
    this.vis.set('legend_style', '');
    this.vis.save();

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
    delete this.header;
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

  _showGMapsDeprecationDialog: function() {
    var dialog = cdb.editor.ViewFactory.createDialogByTemplate('common/dialogs/confirm_gmaps_basemap_to_leaflet_conversion');

    var self = this;
    dialog.ok = function() {
      self.map.set('provider', 'leaflet', { silent: true });
      self.setupMap();
      this.close && this.close();
    };

    dialog.cancel = function() {
      if (self.user.isInsideOrg()) {
        window.location = "/u/" + self.user.get("username") + "/dashboard";
      } else {
        window.location = "/dashboard";
      }
    };

    dialog.appendToBody();
  },

  /**
   * map can't be loaded from the beggining, it needs the DOM to be loaded
   * so we wait until is actually shown to create the mapview and show it
   */
  enableMap: function() {

    this.render();

    var baseLayer = this.map.getBaseLayer();

    // check if this user has google maps enabled. In case not and the provider is google maps
    // show a message
    if ( typeof cdb.admin.GoogleMapsMapView === 'undefined') {
      if (baseLayer && this.map.isProviderGmaps()) {
        this._showGMapsDeprecationDialog();
        return;
      }
    }

    this.setupMap();

  },

  setupMap: function() {

    this.$('.tipsy').remove();

    var self = this;

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

      this._showPecan();

      this._showScratchDialog();

      if (this.user.featureEnabled('slides')) {
        this._addSlides();
      };

      var torqueLayer;

      var type = this.vis.get("type");

      if (type !== "table") {

        this._addOverlaysDropdown();
        this._addConfigureCanvasDropdown();
        this._addMapOptionsDropdown();

        this.canvas.on("change:mode", this._onChangeCanvasMode, this);

      }

      this.master_vis.on("change:type", function() {
        if (this.master_vis.previous('type') === 'table') {
          // reaload the map to show overlays and other visualization related stuff
          this.switchMapType();
        }
      }, this);

      // HACK
      // wait a little bit to give time to the mapview
      // to estabilize
      this.autoSaveBoundsTimer = setTimeout(function() {
        //self.mapView.setAutoSaveBounds();
        self.mapView.on('dragend zoomend', function() {
          self.mapView._saveLocation();
        });
      }, 1000);

    }

  },

  _addMapView: function() {

    var div = this.$('.cartodb-map');

    var mapViewClass = cdb.admin.LeafletMapView;
    if (this.map.get('provider') === 'googlemaps') {
      var mapViewClass = cdb.admin.GoogleMapsMapView;
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
      if(this.activeLayerView && this.activeLayerView.model.id === model.id) {
        this._bindDataLayer(this.activeLayerView, model);

        if (this.layer_selector) {
          this.layer_selector.render();
        }
      }
      this._addTimeline();
    }, this);

    if (this.activeLayerView) {
      this._bindDataLayer(this.activeLayerView, this.activeLayerView.model);
    }

  },

  _addConfigureCanvasDropdown: function() {
    if (!this.configureCanvasDropdown) {
      this.configureCanvasDropdown = new cdb.admin.ConfigureCanvasDropdown({
        target: $('.canvas_setup'),
        position: "position",
        canvas: this.canvas,
        template_base: "table/views/canvas_setup_dropdown",
        tick: "left",
        horizontal_position: "left",
        horizontal_offset: "40px"
      });

      this.addView(this.configureCanvasDropdown);

      this.configureCanvasDropdown.bind("onDropdownShown", function(){
        this.exportImageView && this.exportImageView.hide();
      }, this);

      cdb.god.bind("closeDialogs", this.configureCanvasDropdown.hide, this.configureCanvasDropdown);
      $(".canvas_setup").append(this.configureCanvasDropdown.render().el);
    }
  },

  _addOverlaysDropdown: function() {

    if (!this.overlaysDropdown) {

      this.overlaysDropdown = new cdb.admin.OverlaysDropdown({
        vis: this.master_vis,
        canvas: this.canvas,
        mapView: this.mapView,
        target: $('.add_overlay'),
        position: "position",
        collection: this.vis.overlays,
        template_base: "table/views/widget_dropdown",
        tick: "left",
        horizontal_position: "left",
        horizontal_offset: "40px"
      });

      this.addView(this.overlaysDropdown);

      this.overlaysDropdown.bind("onOverlayDropdownOpen", function(){
        this.slidesPanel && this.slidesPanel.hide();
        this.exportImageView && this.exportImageView.hide();
      }, this);


      cdb.god.bind("closeDialogs", this.overlaysDropdown.hide, this.overlaysDropdown);
      cdb.god.bind("closeOverlayDropdown", this.overlaysDropdown.hide, this.overlaysDropdown);

      $(".add_overlay").append(this.overlaysDropdown.render().el);
    }

  },

  _addBasemapDropdown: function() {

    if (!this.basemapDropdown) {

      if (this.vis.get("type") !== "table") {
        // TODO: use templates and _t for texts
        var $options = $('<a href="#" class="option-button dropdown basemap_dropdown"><div class="thumb"></div>Change basemap</a>');

        $(".map-options").append($options);

      }

      this.basemapDropdown = new cdb.admin.DropdownBasemap({
        target: $('.basemap_dropdown'),
        position: "position",
        template_base: "table/views/basemap/basemap_dropdown",
        model: this.map,
        mapview: this.mapView,
        user: this.user,
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
        if (!this.scratchDialog) {
          this._showScratchDialog();
        }
        if (!this.pecanView) {
          this._showPecan();
        }
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
    if (this.options && this.table) {
      this.georeferenced = this.table.isGeoreferenced();
      if (this.noGeoRefDialog) {
        this.noGeoRefDialog.hide();
      }
      if (!this.georeferenced) {
        if (this.table.data().length > 0) {
          this[ this.table.isSync() ? '_showNoGeoWarning' : 'showNoGeoRefWarning' ]();
        }
      }
    }
  },

  // Shows a warning dialog when your current dialog doesn't have any
  // geometry on it and it is synchronized
  _showNoGeoWarning: function() {
    var noGeoWarningDialog = 'noGeoWarningDialog_' + this.table.id + '_' + this.table.get('map_id');
    if (this.noGeoWarningDialog || localStorage[noGeoWarningDialog]) {
      return;
    }

    this.noGeoWarningDialog = cdb.editor.ViewFactory.createDialogByTemplate(
      'table/views/no_geo_warning_template', {
        clean_on_hide: true
      }
    );

    this.noGeoWarningDialog.bind("hide", function() {
      localStorage[noGeoWarningDialog] = true;
    });

    this.noGeoWarningDialog.appendToBody();
  },

  _showPecan: function() {

    var hasPecan     = this.user.featureEnabled('pecan_cookies');

    var hasData = this.options.table && this.options.table.data() && this.options.table.data().length > 0 ? true : false;

    if (hasPecan && hasData) {

      var skipPencanDialog = 'pecan_' + this.options.user.get("username") + "_" + this.options.table.id;

      if (!localStorage[skipPencanDialog]) {

        this.pecanView = new cdb.editor.PecanView({
          table: this.options.table,
          backgroundPollingModel: this.options.backgroundPollingModel
        });
      }
    }
  },

  _showScratchDialog: function() {
    if (this.options.table && this.options.table.data().fetched && this.options.table.data().length === 0) {

      var skipScratchDialog = 'scratchDialog_' + this.options.table.id + '_' + this.options.table.get('map_id');

      if (!localStorage[skipScratchDialog]) {

        this.scratchDialog = new cdb.editor.ScratchView({
          table: this.options.table
        });

        this.scratchDialog.appendToBody();

        this.scratchDialog.bind("newGeometry", function(type) {
          this._addGeometry(type);
        }, this);

        this.scratchDialog.bind("skip", function() {
          localStorage[skipScratchDialog] = true;
        });
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
        //TODO: unbind this at some point
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

      // destroy the drag handler if it exists
      if ($('.cartodb-legend-stack').data('ui-draggable')) {
        $('.cartodb-legend-stack').draggable('destroy');
      }
    }

    this.legends = [];
    if (this.overlays) this.overlays.setLegend(null);

  },


  _getCartoDBLayers: function() {

    return this.map.layers.models.filter(function(layerModel) {
      return layerModel.get("type") === 'CartoDB'
    });

  },

  _onKeyDown: function(e) {
    if (this.overlays && e.which == 86 && (e.ctrlKey || e.metaKey)) {
      this.overlays.paste();
    }
  },

  _onChangeCanvasMode: function() {

    var self = this;

    cdb.god.trigger("closeDialogs");

    var mode = this.canvas.get("mode");

    if (mode === "desktop") {

      this._showDesktopCanvas(mode);

      if (this.overlays.loader && this.overlays.fullscreen) {
        setTimeout(function() {
          self.overlays && self.overlays._positionOverlaysVertically(true);
        }, 500);
      }

    } else if (mode === "mobile") {

      this._showMobileCanvas(mode);

      setTimeout(function() {
        self.overlays && self.overlays._positionOverlaysVertically(true);
      }, 300);

    }

  },

  _showMobileCanvas: function(mode) {

    var self = this;

    var width  = 288;
    var height = 476;

    this.overlays._hideOverlays("desktop");

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

      self.overlays._showOverlays(mode);

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

    this.overlays._hideOverlays("mobile");

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
      self.overlays._showOverlays(mode);

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
        collection:          this.vis.overlays,
        user:                this.user,
        vis:                 this.vis,
        canvas:              this.canvas,
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

    this.mapOptionsDropdown.bind("onDropdownShown", function() {
      cdb.god.trigger("closeDialogs");
      this.$options.addClass("open");
    }, this);

    this.mapOptionsDropdown.bind("onDropdownHidden", function() {
      this.$options.removeClass("open");
    }, this);

    this.mapOptionsDropdown.bind("createOverlay", function(overlay_type, property) {
      this.vis.overlays.createOverlayByType(overlay_type, property);
    }, this);

    cdb.god.bind("closeDialogs", this.mapOptionsDropdown.hide, this.mapOptionsDropdown);

  },

  _addOverlays: function() {
    this.overlays = new cdb.admin.MapOverlays({
      headerMessageIsVisible: this._shouldAddSQLViewHeader(),
      vis: this.vis,
      canvas: this.canvas,
      mapView: this.mapView,
      master_vis: this.master_vis,
      mapToolbar: this.$el.find(".map_toolbar")
    });
    if (this.stackedLegend) {
        this.overlays.setLegend(this.stackedLegend);
    }

  },

  _exportImage: function(e) {

    this.killEvent(e);

    if (this.exportImageView) {
      return;
    }

    this.exportImageView = new cdb.admin.ExportImageView({
      vizjson:  this.vis.vizjsonURL(),
      vis:      this.vis,
      user:     this.options.user,
      overlays: this.overlays,
      mapView:  this.mapView,
      width:    this.mapView.$el.width(),
      height:   this.mapView.$el.height(),
      map:      this.map
    });

    this.exportImageView.bind("was_removed", function() {
      this.exportImageView = null;
    }, this);

    this.mapView.$el.append(this.exportImageView.render().$el);

    cdb.god.bind("panel_action", function(action) {
      if (action !== "hide" && this.exportImageView) {
        this.exportImageView.hide();
      }
    }, this);
  },

  _addSlides: function() {

    if (!this.vis.isVisualization()) return;

    this.slidesPanel = new cdb.admin.SlidesPanel({
      user: this.user,
      slides:  this.vis.slides,
      toggle: this.$el.find(".toggle_slides")
    });

    this.slidesPanel.bind("onChangeVisible", function() {
      this.exportImageView && this.exportImageView.hide();
    }, this);

    this.$el.append(this.slidesPanel.render().el);

    this.addView(this.slidesPanel);

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
            this._renderStackedLegends();
          }

        }
      }
    }

  },

  _changeLegends: function() {
    // clear custom legend placement before re-adding them (CSS will need to be recalculated)
    if (this.legends) {
      _.each(this.legends, function(legend) {
        legend.model.set('style', null);
      });
    }

    this._addLegends();

  },

  _addTimeline: function() {
    if (!this.mapView) return;
    // check if there is some torque layer
    if(!this.map.layers.any(function(lyr) { return lyr.get('type') === 'torque' && lyr.get('visible'); })) {
      this.timeline && this.timeline.clean();
      this.timeline = null;
    } else {
      var layer = this.map.layers.getLayersByType('torque')[0];
      var steps = layer.wizard_properties.get('torque-frame-count');

      if (this.timeline) {
        // check if the model is different
        if (this.timeline.torqueLayer.model.cid !== layer.cid) {
          this.timeline.clean();
          this.timeline = null;
        }
      }

      layerView = this.mapView.getLayerByCid(layer.cid);

      if (layerView && typeof layerView.getStep !== "undefined" && steps > 1) {
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
      else if (this.timeline) {
        this.timeline.clean();
        this.timeline = null;
      }
    }
  },

  _renderStackedLegends: function() {

    if (this.stackedLegend) this.stackedLegend.clean();
    if (this.legend)        this.legend.clean();

    this.stackedLegend = new cdb.geo.ui.StackedLegend({
      legends: this.legends,
      vis: this.vis
    });

    this.mapView.$el.append(this.stackedLegend.render().$el);
    this.addView(this.stackedLegend);
    if (this.overlays) this.overlays.setLegend(this.stackedLegend);
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
        mapView: this.mapView,
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
        user: this.user,
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
        if (this.geometryEditor) this.geometryEditor.discard();
      }, this);

      this.map.bind('change:provider', function() {
        if (this.geometryEditor) this.geometryEditor.discard();
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
    if (!this.table.isReadOnly()) {
      var self = this;
      row.fetch({ cache: false, no_geom: true, success: function() {
        var dlg = new cdb.editor.FeatureDataView({
          row: row,
          provider: self.map.get('provider'),
          baseLayer: self.map.getBaseLayer().clone(),
          dataLayer: self.layerModel.clone(),
          currentZoom: self.map.getZoom(),
          enter_to_confirm: false,
          table: self.table,
          user: self.user,
          clean_on_hide: true,
          onDone: self.updateDataLayerView.bind(self) // Refreshing layer when changes have been done
        });

        dlg.appendToBody();
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
      var view = new cdb.editor.DeleteRowView({
        name: 'feature',
        table: this.table,
        row: row,
        clean_on_hide: true,
        enter_to_confirm: true,
        wait: true // to not remove from parent collection until server-side confirmed deletion
      });
      view.appendToBody();

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

    this.table.bind('data:saved', this.updateDataLayerView, this);

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

    if (this.overlays) {
      this.overlays.setHeaderMessageIsVisible(true);
    }

    this.$('.cartodb-map').after(html);
  },

  _updateSQLHeader: function() {
    if (this._shouldAddSQLViewHeader()) {
      this._addSQLViewHeader();
    } else {
      this._removeSQLViewHeader();
    }
  },

  _shouldAddSQLViewHeader: function() {
    return this.table && this.table.isInSQLView() && this.table.showSqlBanner;
  },

  loadingTiles: function() {
    if (this.overlays.loader) this.overlays.loader.show();
  },

  loadTiles: function() {
    if (this.overlays.loader) this.overlays.loader.hide();
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

    this.$el.addClass(this.vis.isVisualization() ? 'derived': 'table');
    var provider = this.map.get("provider");

    this.$el.append(this.template({
      slides_enabled: this.user.featureEnabled('slides'),
      type: this.vis.get('type'),
      exportEnabled: !this.map.isProviderGmaps()
    }));

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
    var warningStorageName = 'georefNoContentWarningShowed_' + this.table.id + '_' + this.table.get('map_id');

    // if the dialog already has been shown, we don't show it again
    if(!this.noGeoRefDialog && !this.table.isInSQLView() && (!localStorage[warningStorageName])) {
      localStorage[warningStorageName] = true;

      this.noGeoRefDialog = new cdb.editor.GeoreferenceView({
        table: this.table,
        user: this.user
      });
      this.noGeoRefDialog.appendToBody();
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

    if (this.overlays) {
      this.overlays.setHeaderMessageIsVisible(true);
    }
  },

  _removeSQLViewHeader: function() {
    this.$('.sqlview').remove();

    if (this.overlays) {
      this.overlays.setHeaderMessageIsVisible(false);
    }
  },

  _toggleSlides: function(e) {
    this.killEvent(e);
    this.slidesPanel && this.slidesPanel.toggle();
  },

  _clearView: function(e) {
    this.killEvent(e);
    this.activeLayerView.model.clearSQLView();
    return false;
  },

  _dismissSQLView: function (e) {
    this.killEvent(e);
    if (this.table) {
      this.table.showSqlBanner = false;
    }
    this._removeSQLViewHeader();
  },

  _tableFromQuery: function(e) {
    this.killEvent(e);

    var duplicate_dialog = new cdb.editor.DuplicateDatasetView({
      model: this.table,
      user: this.user,
      clean_on_hide: true
    });
    duplicate_dialog.appendToBody();
  }

});
