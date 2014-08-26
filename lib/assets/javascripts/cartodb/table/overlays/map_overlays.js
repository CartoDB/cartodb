// 
// manages overlays on the map
// 

cdb.admin.MapOverlays = cdb.core.View.extend({

  initialize: function() {
    this.canvas_mode = "desktop";
    this.horizontal_overlays = ["share", "layer_selector", "search"];
    this.vertical_overlays   = ["zoom", "fullscreen", "loader"];

    this.vis = this.options.vis;
    this.mapView = this.options.mapView;
    this._bindOverlays();
  },

  _cleanOverlays: function() {
    if (this.overlays) {
      this.overlays.each(function(model) {
        if (!model) return;
        //var overlay = this._getOverlaye(overlay.get("type"));
        overlay.clean();
      });
    }
  },

  _getOverlay: function(type) {
    if (!this.overlays) return;
    return this.overlays.filter(function(m) { return m.get("type") == type })[0];
  },

  _getHeaderOverlay: function() {
    return this._getOverlay("header");
  },


  _hideOverlays: function(mode) {
    if (!this.overlays) return;

    var hideOverlays = ["search"];

    this.overlays.each(function(overlay) {
      var device = overlay.get("device");
      if (device === mode) overlay.set("display", false);
    }, this);

  },

  _showOverlays: function(mode) {

    this.overlays.each(function(overlay) {
      var device = overlay.get("device");
      if (device === mode) overlay.set("display", true);
    }, this);

  },

  _bindOverlays: function() {
    var self = this;

    this.overlays = this.vis.overlays;
    this.add_related_model(this.vis.overlays);

    this.overlays.bind("reset", this._onResetOverlays, this);
    this.overlays.bind("remove", function(overlay) {
      overlay.destroy();
    });
    this.overlays.bind("add", function(overlay) {
      self._renderOverlay(false, overlay);
      self._reloadDraggable();
    });
    this._onResetOverlays(this.overlays);

  },

  _onResetOverlays: function(overlays) {
    if (overlays.models.length > 0) {
      overlays.each(this._setupOverlay, this);
    }
  },

  _setupOverlay: function(overlay) {
    this._renderOverlay(false, overlay);
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

    if (type === "Text" || type === "Code" || type === "Image") { 
      this._toggleOverlay(overlay);
    }

  },

  //TODO: move to overlay list
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
      case 'Code':           overlay = new cdb.admin.overlays[type]({ model: model }); break;
      case 'Image':          overlay = new cdb.admin.overlays[type]({ model: model }); break;

    }

    return overlay;

  },

  _getOverlayTpe: function(data) {

    var type = data.get("type");

    if (!type) type = "text";

    return _.map(type.split("_"), function(word) {
      return word.slice(0, 1).toUpperCase() + word.slice(1);
    }).join("");

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

    if (overlay.model.get("type") === "header") {
      this._positionOverlaysVertically();
    }

    if (overlay.model.get("type") === 'search') this._positionSearchOverlay(overlay.model);

    overlay.bind("remove", function(overlay) {
      this.overlays.remove(overlay.model);
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
      map: this.vis.map
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
      map: this.vis.map
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

  }

});
