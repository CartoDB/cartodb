jQuery.fn.animateAuto = function(prop, speed, callback){
    var elem, height, width;
    return this.each(function(i, el){
        el = jQuery(el), elem = el.clone().css({"height":"auto","width":"auto"}).appendTo("body");
        height = elem.css("height"),
        width = elem.css("width"),
        elem.remove();
        
        if(prop === "height")
            el.animate({"height":height}, speed, callback);
        else if(prop === "width")
            el.animate({"width":width}, speed, callback);  
        else if(prop === "both")
            el.animate({"width":width,"height":height}, speed, callback);
    });  
}
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
        } else {
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
          var m = new cdb.geo.CartoDBGroupLayer(layer.toLayerGroup());
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
    'click .add_widget.button':    'killEvent',
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

    if (this.widgetsDropdown)         this.widgetsDropdown.clean();
    if (this.mapOptionsDropdown)      this.mapOptionsDropdown.clean();
    if (this.basemapDropdown)         this.basemapDropdown.clean();
    if (this.configureCanvasDropdown) this.configureCanvasDropdown.clean();

    this.zoom.clean();

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
    delete this.widgetsDropdown;
    delete this.basemapDropdown;
    delete this.mapOptionsDropdown;
    delete this.configureCanvasDropdown;

    delete this.zoom;
    delete this.infowindow;
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
      this.render();
      this.enableMap();
    }
  },


  /**
   * map can't be loaded from the beggining, it needs the DOM to be loaded
   * so we wait until is actually shown to create the mapview and show it
   */
  enableMap: function() {

    var self = this;

    this.$('.tipsy').remove();

    if (!this.map_enabled) {

      this._addMapView();

      this.clickTimeout = null;

      this._bindMissingClickEvents();

      this.map_enabled = true;

      $(".map").append('<div class="map-options" />');
      //$(".map").append("<div class='mobile_bkg' />")

      this._addBasemapDropdown();
      this._addInfowindow();
      this._addTooltip();
      this._addLegends();
      this._addOverlays();
      this._addWidgetDropdown();
      this._addConfigureCanvasDropdown();
      this._addTableOptionsDropdown();

      // TODO: should we store the canvas_mode in the vis?
      this.vis.set({ canvas_mode: "desktop" }, { silent: true });
      this.vis.on("change:canvas_mode", this._onChangeCanvasMode, this);

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

    if(this.map.get('provider') === 'googlemaps') {
      if (!cdb.admin.GoogleMapsMapView) {
        cdb.log.error("google maps not available");
      }
      mapViewClass = cdb.admin.GoogleMapsMapView;
    }

    this.mapView = new mapViewClass({
      el: div,
      map: this.map
    });

    this.mapView.bind('newLayerView', function(layerView, model) {
      if(this.activeLayerView && this.activeLayerView.model.id == model.id) {
        this._bindDataLayer(this.activeLayerView, model);
      }
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

  _addWidgetDropdown: function() {

    if (!this.widgetsDropdown) {

      this.widgetsDropdown = new cdb.admin.WidgetsDropdown({
        vis: this.vis,
        target: $('.add_widget'),
        position: "position",
        collection: this.overlays,
        template_base: "table/views/widget_dropdown",
        overlays: this.overlays,
        tick: "left",
        horizontal_position: "left",
        horizontal_offset: "40px"
      });

      this.addView(this.widgetsDropdown);

      cdb.god.bind("closeDialogs", this.widgetsDropdown.hide, this.widgetDropdown);

      $(".add_widget").append(this.widgetsDropdown.render().el);
    }

  },

  _addBasemapDropdown: function() {

    if (!this.basemapDropdown) {

      var $options = $('<a href="#" class="option-button dropdown basemap_dropdown"><div class="thumb"></div><div class="info"><strong class="name">Select basemap</strong></div></a>');

      $(".map-options").append($options);

      this.basemapDropdown = new cdb.admin.DropdownBasemap({
        target: $('.basemap_dropdown'),
        position: "position",
        template_base: "table/views/basemap/basemap_dropdown",
        model: this.map,
        mapview: this.mapView,
        baseLayers: this.options.baseLayers,
        tick: "left",
        vertical_position: "up",
        horizontal_position: "left",
        vertical_offset: "40px",
        horizontal_offset: "0px"
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
      _.each(this.overlays, function(overlay) {
        //overlay.clean(); // TODO: add
      });
    }

    this.overlays = [];


  },

  _getCartoDBLayers: function() {

    return this.map.layers.models.filter(function(layerModel) {
      return layerModel.get("type") == 'CartoDB'
    });

  },

  /*
   * Returns the text and image overlays
   * */
  _getBasicOverlays: function() {

    return this.overlays.filter(function(m) { return m.get("type") == "text" || m.get("type") == "image" });

  },

  _getOverlay: function(type) {

    return this.overlays.filter(function(m) { return m.get("type") == type })[0];

  },

  _getSearchOverlay: function() {

    return this._getOverlay("search");

  },

  _getHeaderOverlay: function() {

    return this._getOverlay("title");

  },

  _getMarkdown: function(text) {

    return text ? $(markdown.toHTML(text)).html() : "";

  },

  _hideOverlays: function(type) {

    _.each(this.overlays.models, function(overlay) {

      var device  = overlay.get("device");

      if (device == type) overlay.set("display", false);

    }, this);

  },

  _showOverlays: function(type) {

    _.each(this.overlays.models, function(overlay) {

      var device  = overlay.get("device");

      if (device == type) overlay.set("display", true);

    }, this);

  },

  _onChangeCanvasMode: function() {

    var self = this;
    var mode = this.vis.get("canvas_mode");

    cdb.god.trigger("closeDialogs");

    if (mode == "desktop") {

      this._hideOverlays("mobile");

      var el = $("div.map div.cartodb-map"),
          top        = el.css("top"),
          left       = el.css("left"),
          mTop       = el.css("marginTop"),
          mLeft      = el.css("marginLeft"),
          curWidth   = el.width(),
          curHeight  = el.height(),
          autoWidth  = el.css({width: 'auto',  marginLeft: 0, left: "15px"}).width();  //temporarily change to auto and get the width.
          autoHeight = el.css({height: 'auto', marginTop: 0,  top: "70px" }).height(); //temporarily change to auto and get the width.

          el.height(curHeight);
          el.width(curWidth);

          el.css({ top: top, left: left, marginLeft: mLeft, marginTop: mTop, height: curHeight, width: curWidth });

          el.animate({ height: autoHeight, top: "70", marginTop: "0"}, { easing: "easeOutQuad", duration: 200, complete: function() {
            el.css('height', 'auto');

            el.animate({ width: autoWidth, left: "15px", marginLeft: "0"}, { easing: "easeOutQuad", duration: 200, complete: function() {

              el.css('width', 'auto');
              self._showOverlays(mode);

            }});

          }});

    } else if (mode == "mobile") {

      this._hideOverlays("desktop");

      $("div.map div.cartodb-map").animate({ width: 229,    marginLeft: -229/2, left: "50%" }, { easing: "easeOutQuad", duration: 200, complete: function() {
        $("div.map div.cartodb-map").animate({ height: 327, marginTop: -327/2,  top:  "50%" }, { easing: "easeOutQuad", duration: 200, complete: function() {
        
          self._showOverlays(mode);

        }});
      }});

    }

  },

  _onChangeHeaderContents: function() {

    var headerOverlay = this._getHeaderOverlay();

    var description = this.vis.get("description");
    var name        = this.vis.get("name");

    headerOverlay.set({ title: name, description: this._getMarkdown(description) });

  },

  _setupOverlay: function(overlay) {

    overlay.urlRoot = this.overlays.url;

    var options = overlay.get("options");

    if (options) {

      options = JSON.parse(options);

      overlay.set({

        x:            options.x,
        y:            options.y,
        device:       options.device,
        extra:        options.extra,
        style:        options.style,
        display:      options.display

      }, { silent: true });

    }

    this._renderOverlay(false, overlay);

  },

  _getOverlayTpe: function(data) {

    var type = data.get("type");

    if (!type) type = "text";

    return _.map(type.split("_"), function(word) {
      return word.slice(0, 1).toUpperCase() + word.slice(1);
    }).join("");

  },

  _renderOverlay:  function(delayed_animation, data) {

    var widget = {};
    var type = this._getOverlayTpe(data);

    if (data.get("device") && data.get("device") != this.vis.get("canvas_mode")) return;

    if (type == "Loader") {

      widget = this.loader = new cdb.admin.widgets[type]({
        model: data,
        map: this.map
      });

    } else if (type == "ZoomInfo") {

      widget = this.zoomInfo = new cdb.admin.widgets[type]({
        model: data,
        map: this.map
      });

      widget.bind("change_y", function() {

        if (this.fullscreen) {
          this.fullscreen.model.set("y", widget.model.get("y") + 60);
        }

      }, this);

    } else if (type == "Share") {

      widget = this.share = new cdb.admin.widgets[type]({
        model: data,
        map: this.map
      });

      widget.bind("change_x", function() {

        if (this.search) {
          //if (widget.model.get("display")) this.search.model.set("x", 60);

          if (widget.model.get("display"))
            this.search.model.set("x", 60);
          else 
            this.search.model.set("x", 20);
        }

      }, this);

    } else if (type == "Zoom") {

      widget = this.zoom = new cdb.admin.widgets[type]({
        model: data,
        map: this.map
      });

      widget.bind("change_y", function() {

        if (this.zoomInfo) {
          this.zoomInfo.model.set("y", widget.model.get("y") + 70);
        }

      }, this);


    } else if (type == "Fullscreen") {

      widget = this.fullscreen = new cdb.admin.widgets[type]({
        model: data,
        mapView: this.mapView
      });

      widget.bind("change_y", function() {

        if (this.loader) {
          if (widget.model.get("display")) this.loader.model.set("y", widget.model.get("y") + 40);
          else this.loader.model.set("y", widget.model.get("y") );
        }

      }, this);

    } else if (type == "Title") {

      widget = this.header = new cdb.admin.widgets[type]({
        model: data,
        map: this.map
      });

      this.header.bind("change_y", function() {

        var headerHeight = $(".header.static").outerHeight(true);

        if (this.zoom)   this.zoom.model.set("y",   headerHeight + 15);
        if (this.search) this.search.model.set("y", headerHeight + 15);
        if (this.share)  this.share.model.set("y",  headerHeight + 15);

      }, this);

    } else if (type == "Search") {

      widget = this.search = new cdb.admin.widgets[type]({
        model: data,
        map: this.map
      });

      window.search = this.search;

    }
    /*else {
      widget = new cdb.admin.widgets[type]({ model: data });
    }*/

    widget.bind("remove", function(overlay) {
      this.overlays.remove(overlay.model);
    }, this);


    this.mapView.$el.append(widget.render().$el);

    if (type == "Text" || type == "Image") { 

      this._reloadDraggable();

      if (delayed_animation) { // Random animation

        var randomTime = 100 + Math.random() * 900;

        setTimeout(function() {

          widget.show(true);

        }, randomTime);

      } else { // Show the widget right away

        widget.show(true);

      }
    }

  },

  _reloadDraggable: function() {

    $(".widget").draggable({
      container: $(".cartodb-map"),
      stickiness: 10
    });

  },

  _addTableOptionsDropdown: function() {

    if (!this.mapOptionsDropdown) {

      var $options = $("<a href='#show-options' class='option-button show-table-options'>Options</a>");

      this.$options = $options;

      $(".map-options").append($options);

      this.mapOptionsDropdown = new cdb.admin.MapOptionsDropdown({
        target:              $('.show-table-options'),
        position:            "position",
        template_base:       "table/views/map_options_dropdown",
        model:               this.map,
        mapview:             this.mapView,
        collection:          this.overlays,
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

    cdb.god.bind("closeDialogs", this.mapOptionsDropdown.hide, this.mapOptionsDropdown);

  },

  _addOverlays: function() {

    var self = this;

    this.overlays     = new cdb.admin.Overlays([]);
    this.overlays.url = "/api/v1/viz/" + this.vis.get("id") + "/overlays";
    this.overlays.fetch({ reset: true });

    this._bindOverlays();

  },

  _bindOverlays: function() {

    var self = this;

    this.overlays.bind("reset", this._onResetOverlays, this);

    this.overlays.bind("remove", function(overlay) {
      overlay.destroy();
    });

    this.overlays.bind("change", function(overlay) {
      overlay.save();
    });

    this.overlays.bind("add", function(overlay) {

      overlay.save();

      self._renderOverlay(false, overlay);
      self._reloadDraggable();

    });

  },

  /*
   *Checks if there is a title overlay
   */
  _hasTitleOverlay: function() {

    return this.overlays.find(function(model) {
      return model.get("type") == 'title'
    });

  },

  _onResetOverlays: function(overlays) {

    if (overlays.models.length > 0) {
      _.each(overlays.models, this._setupOverlay, this);
    }

  },

  _addLegends: function() {

    var self = this;

    this._cleanLegends();

    var models = this.map.layers.models;

    for(var i = models.length - 1; i >= 0; --i) {
      var layer = models[i];
      self._addLegend(layer);
    }

  },

  _addLegend: function(layer) {

    if (layer.get('type') === 'CartoDB' || layer.get('type') === 'torque') {

      if (this.table && this.mapView) {

        if (this.legend) this.legend.clean();

        if (layer.get("visible")) {

          var legend = new cdb.geo.ui.Legend({
            model: layer.legend,
              mapView: this.mapView,
              table: this.table
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
            layer: layerView
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
    if (this.loader) this.loader.show()
  },

  loadTiles: function() {
    if (this.loader) this.loader.hide()
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
    if (type == "show") {
      this.$el
        .removeClass('narrow')
        .addClass('displaced');
    } else if (type == "hide") {
      this.$el.removeClass('narrow displaced');
    } else if (type == "narrow") {
      this.$el.addClass('narrow displaced');
    }
  },

  render: function() {
    this.$el.html('');
    this.$el.append(this.template());
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

      this.$el.append(this.noGeoRefDialog.render().el);
      this.noGeoRefDialog.open();
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
  },

  _removeSQLViewHeader: function() {
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
