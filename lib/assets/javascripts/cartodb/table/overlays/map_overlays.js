//
// manages overlays on the map
//

cdb.admin.MapOverlays = cdb.core.View.extend({

  events: {
    "click": "stopPropagation"
  },

  legend_form_data: [{
    name: 'Text',
    form: {
      'font-size':  { type: 'simple_number', value: 10, min: 5, max: 26, inc: 1, disable_triggering: true },
      'color':      { type: 'color', value: '#666', disable_triggering: true, extra: { tick: "left", picker_horizontal_position: "left", picker_vertical_position: "down" }},
      'font-family': {
        type: 'select',
        value: "Helvetica",
        disable_triggering: true,
        extra: ["Helvetica", "Droid Sans", "Vollkorn", "Roboto", "Open Sans", "Lato", "Graduate", "Gravitas One", "Old Standard TT"]

      }
    }
  }, {
    name: 'Border',
    form: {
      'border-color': { type: 'color', value: '#666', disable_triggering: true, extra: { tick: "left", picker_horizontal_position: "left", picker_vertical_position: "down" }},
      'border-width': { type: 'simple_number_with_label', value: 1, min: 0, max: 10, inc: 1, label: "Width", disable_triggering: true },
      'border-radius': { type: 'simple_number_with_label', value: 5, min: 0, max: 10, inc: 1, label: "Radius", disable_triggering: true }
    }
  }, {
    name: 'Background',
    form: {
      'width': { type: 'simple_number_with_label', value: 10, min: 10, max: 1000, inc: 5, label: "Width", disable_triggering: true },
      'height': { type: 'simple_number_with_label', value: 10, min: 10, max: 1000, inc: 5, label: "Height", disable_triggering: true },
      'background-color': { type: 'color', value: '#FFF', disable_triggering: true, extra: { tick: "left", picker_horizontal_position: "left", picker_vertical_position: "down" }},
      'opacity': { type: 'simple_opacity', value: 1, min: 0, max: 1, inc: 0.1, disable_triggering: true }
    }
  }],

  legend_style_properties: function (filterName) {
    return _.chain(this.legend_form_data)
        .filter(function (group) { return filterName === undefined || filterName === group.name; })
        .map(function (group) { return _.keys(group.form); })
        .flatten().value();
  },

  stopPropagation: function(e) {
    e.stopPropagation();
  },

  initialize: function() {
    this.overlayViews = [];
    this.horizontal_overlays = ["share", "layer_selector", "search", "inset_map"];
    this.vertical_overlays   = ["zoom", "fullscreen", "loader", "logo", "inset_map"];

    this.vis        = this.options.vis;
    this.master_vis = this.options.master_vis;

    this.canvas     = this.options.canvas;
    this.mapView    = this.options.mapView;
    this.map        = this.mapView.map;
    this.mapToolbar = this.options.mapToolbar;

    this.headerMessageIsVisible = this.options.headerMessageIsVisible;

    this._bindOverlays();
  },

  setHeaderMessageIsVisible: function(visible) {
    this.headerMessageIsVisible = visible;
    this._positionOverlaysVertically();
  },

  setLegend: function (legend) {

    var self = this;
    this.legend = legend;
    var mapView = this.mapView;
    var _lastMouseDown = null;

    if (this.inset_map &&
        this.inset_map.model.get("xPosition") === "right" &&
        this.inset_map.model.get("yPosition") === "bottom") {
        this._positionInsetMapOverlay(this.inset_map.model);
    }

    if (!legend) {
      return;
    }

    // prevent dragging on legend child element from opening file upload overlay (apparent bug)
    legend.$el.children().on('dragstart', function(event) {
        event.preventDefault();
    });

    // disable map drag and map click popups while dragging legend
    legend.$el.on('mousedown touchstart MSPointerDown', function(event) {
      _lastMouseDown = event;
      if (mapView.map_leaflet) {
          mapView.map_leaflet.dragging.disable();
        }
        mapView.disableInteraction();
      // Close the OverlayPropertiesBar when the user starts a drag
      if (this.overlayPropertiesBar) {
        cdb.god.trigger('closeDialogs');
      }
    });

    legend.$el.on('mouseup touchend MSPointerUp', function(event) {
      if (mapView.map_leaflet) {
          mapView.map_leaflet.dragging.enable();
        }
        mapView.enableInteraction();
    });

    legend.$el.on('dblclick mousewheel DOMMouseScroll', function(event) {
      event.stopPropagation();
    });

    legend.$el.on('click', function (event) {
      var clickDistance = 5;
      // Ensure this is actually a click, and not just the end of a drag of the legend
      if (Math.abs(_lastMouseDown.screenX - event.screenX) < clickDistance &&
          Math.abs(_lastMouseDown.screenY - event.screenY) < clickDistance) {
        self._addLegendOverlayPropertiesBar(self.legend);
      }
      event.stopPropagation();
    });

    // make legend draggable
    legend.$el.draggable({
      containment: $('.cartodb-map'),
      start: function(event, ui) {
        legend.$el.addClass('notransition'); // disable animations while dragging
      },
      stop: function(event, ui) {
        // drag end event
        event.stopPropagation();

        var styles = cdb.geo.utils.cssStringToObject(legend.$el.attr('style'));
        // change top/left offset from pixels to percentage
        var topPct = legend.$el.position().top / legend.$el.parent().height() * 100;
        var leftPct = legend.$el.position().left / legend.$el.parent().width() * 100;
        styles.top = topPct + '%';
        styles.left = leftPct + '%';

        legend.$el.removeClass('notransition');

        var legendStyles = self.legend.model.get('style') || {};
        var css = _.extend(legendStyles, styles);
        self.legend.model.set('style', css);
        self._addLegendOverlayPropertiesBar(self.legend);
        // Need to manually trigger change:style to trigger vis.save()
        self.legend.model.trigger('change:style');
      }
    });
  },

  _cleanOverlays: function() {
    if (this.overlays) {
      _.each(this.overlayViews, function(overlay) {
        overlay.clean();
      });
      this.overlayViews = [];
      this.zoom = null;
      this.loader = null;
      this.fullscreen = null;
      this.search = null;
      this.inset_map = null;
      this.layer_selector = null;
      this.logo = null;
    }
  },

  getOverlay: function(type) {
    if (!this.overlays) return;
    return this.overlays.filter(function(m) { return m.get("type") == type })[0];
  },

  getHeaderOverlays: function() {
    if (!this.overlays) return;
    return this.overlays.filter(function(m) { return m.get("type") === "header"; });
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

    this.overlays.unbind("reset", this._onResetOverlays);
    this.overlays.unbind("remove");
    this.overlays.unbind("add");

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
    this._cleanOverlays();
    if (overlays.models.length > 0) {
      overlays.each(this._setupOverlay, this);
    }
  },

  _setupOverlay: function(overlay) {
    this._renderOverlay(false, overlay);
  },

  _renderOverlay:  function(delayed_animation, model) {
    var type         = this._getOverlayType(model);
    var device       = model.get("device");

    var vis_overlays = ["Header", "Fullscreen", "Share", "LayerSelector"];

    if (_.contains(vis_overlays, type) && this.vis.get("type") === "table") {
      return;
    }

    var display = (device && device != this.canvas.get("mode")) ? false : true;

    model.set("display", display);

    var overlay = this._configureOverlay(model);

    if (!overlay) return;

    this.overlayViews.push(overlay);

    this.mapView.$el.append(overlay.render().$el);

    this._bindOverlay(overlay);

    if (type === "Text" || type === "Image") {
      this._toggleOverlay(overlay);
    } else if (type === "Annotation") {
      this._reloadDraggable();
    }

  },

  //TODO: move to overlay list
  _configureOverlay: function(model) {

    var type = this._getOverlayType(model);
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
      case 'InsetMap':       overlay = this._setupInsetMapOverlay(type, model);        break;

      // Default
      case 'Text':           overlay = new cdb.admin.overlays[type]({ model: model }); break;
      case 'Image':          overlay = new cdb.admin.overlays[type]({ model: model }); break;
      case 'Annotation':     overlay = new cdb.admin.overlays[type]({
        vis: this.vis,
        canvas: this.canvas,
        model: model,
        mapView: this.mapView
      }); break;

    }

    return overlay;

  },

  _getOverlayType: function(data) {

    var type = data.get("type");

    if (!type) type = "text";

    return _.map(type.split("_"), function(word) {
      return word.slice(0, 1).toUpperCase() + word.slice(1);
    }).join("");

  },

  _positionOverlaysHorizontally: function() {

    _.each(this.horizontal_overlays, function(type) {
      var overlay_model = this.getOverlay(type);
      if (overlay_model) this._positionOverlay(overlay_model)
    }, this);

  },

  _positionOverlaysVertically: function(move_header) {

    if (!this.overlays) return;

    var headers = this.getHeaderOverlays();
    _.each(headers, this._positionOverlay, this);

    _.each(this.horizontal_overlays, function(type) {

      var overlay_model = this.getOverlay(type);
      if (overlay_model) this._positionOverlay(overlay_model)

    }, this);

    _.each(this.vertical_overlays, function(type) {

      var overlay_model = this.getOverlay(type);
      if (overlay_model) this._positionOverlay(overlay_model);

    }, this);

  },

  _duplicate: function(model) {

    var m = model.cloneAttributes();
    var extra = m.extra;

    var canvas_mode = this.options.canvas.get("mode");
    var indexes = this.overlays.getOverlaysZIndex(canvas_mode);
    var zIndex   = _.max(indexes);

    var style = m.style;

    style['z-index'] = zIndex + 1;

    if (model.get('type') === 'annotation') {
      var latlng = this._getRandomCenter(model.get('extra').latlng);
      extra.latlng = [latlng.lat, latlng.lng];
    } else {
      var point = this._getRandomPoint(model.get('x'), model.get('y'));
      m.x = point.x;
      m.y = point.y;
    }

    var overlay = new cdb.admin.models.Overlay(_.extend(m, { id: null, style: style, extra: extra }));
    this.overlays.add(overlay);
    overlay.save();
  },


  paste: function() {

    if (!this._copiedOverlay || this._editing) {
      return;
    }

    var model = this._copiedOverlay;

    this._duplicate(model);
  },

  _getRandomPoint: function(x, y) {
    return { x: x + 50 + Math.round(Math.random() * 50), y: y + 50 + Math.round(Math.random() * 50) };
  },

  _getRandomCenter: function(latlng) {
    var center = this.mapView.latLonToPixel(latlng);
    var xR = center.x + 50 + Math.round(Math.random() * 50);
    var yR = center.y + 50 + Math.round(Math.random() * 50);

    return this.mapView.pixelToLatLon([xR, yR]);
  },

  _bindOverlay: function(overlay) {

    if (overlay.model && overlay.model.get("type") === "header") {
      this._positionOverlaysVertically();
    }

    if (overlay.model && overlay.model.get("type") === 'search') {
      this._positionSearchOverlay(overlay.model);
    }

    overlay.bind("editing", function(editing) {
      this._editing = editing;
    }, this);

    overlay.bind("duplicate", function(model) {
      this.editing = true;
      this._copiedOverlay = model;
    }, this);

    overlay.bind("remove", function(overlay) {
      this.overlays.remove(overlay.model);
      this._removeOverlayPropertiesBar(true);
    }, this);

    overlay.bind("clickEdit", function(model, form_data) {
      this._addOverlayPropertiesBar(model, form_data);
    }, this);
  },

  _hideToobarOptions: function(model) {
    if (this.overlayPropertiesBar) {
      if (this.overlayPropertiesBar.compareModel(model)) { // if the model is the same as the current one, hide the options bar
        this.mapToolbar.find("ul.options").animate({ top: -100 }, { duration: 200, easing: "easeInOutQuad" } );
      } else { // otherwise, deselect the overlay
        this.overlayPropertiesBar.deselectOverlay();
      }

    } else  {
      this.mapToolbar.find("ul.options").animate({ top: -100 }, { duration: 200, easing: "easeInOutQuad" });
    }
  },

  _removeOverlayPropertiesBar: function(show_toolbar, model, force) {

    // Abort the removal if we are clicking in the same overlay to edit
    if (model && this.overlayPropertiesBar && this.overlayPropertiesBar.compareModel(model) && !force) return;

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

    this.mapToolbar.find("ul.options").animate({ top: 0 }, { duration: 250, easing: "easeInOutQuad", complete: function() {
      self.mapToolbar.removeClass("animated");
    }});
  },

  _addLegendOverlayPropertiesBar: function (legend) {
    var css = window.getComputedStyle(legend.$el[0]);
    var textCss = window.getComputedStyle(legend.$el.find('li')[0]);
    var defaultStyles = _.extend({}, _.pick(css, this.legend_style_properties()),
                                     _.pick(textCss, this.legend_style_properties('Text')));
    _.each(defaultStyles, function (v, k) {
        var intValue = parseInt(v, 10);
        var value = isNaN(intValue) ? v : intValue;
        defaultStyles[k] = value;
    });
    var styles = legend.model.get('style') || {};
    var style = _.extend(styles, defaultStyles);
    // Manually bump the width, when the other styles change the width needs to be tweaked a bit
    style.width += 1;
    legend.model.set('style', style);
    this._addOverlayPropertiesBar(legend.model, this.legend_form_data, true, true);
  },

  _addOverlayPropertiesBar: function(model, form_data, hide_actions, forceReset) {

    if (this.overlaysDropdown) this.overlaysDropdown.hide();

    this.mapToolbar.addClass("animated");

    this._hideToobarOptions(model);

    var animatedRemoval = this._removeOverlayPropertiesBar(false, model, forceReset);

    if (!this.overlayPropertiesBar) {

      this.overlayPropertiesBar = new cdb.admin.OverlayPropertiesBar({
        model: model,
        mapView: this.mapView,
        overlays: this.overlays,
        canvas: this.canvas,
        vis: this.vis,
        form_data: form_data,
        hide_actions: hide_actions || false
      });

      this.addView(this.overlayPropertiesBar);
      this.overlayPropertiesBar.bind("remove", this._removeOverlayPropertiesBar, this);
      this.overlayPropertiesBar.bind("copy-overlay", this._duplicate, this);

      this.mapToolbar.append(this.overlayPropertiesBar.render().el);

      if (!animatedRemoval) {
        this.overlayPropertiesBar.$el.animate({ top: 0 }, { duration: 200, easing: "easeInOutQuad" });
      } else {
        this.overlayPropertiesBar.$el.css({ top: 0 });
      }

    }

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

    $(".overlay").draggableOverlay({
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

      if (self.share) {
        self.share.clean();
        delete self.share;
      }

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

    this._positionOverlaysHorizontally();

    var onDestroy = function() {
      if (self.fullscreen) {
        self.fullscreen.clean();
        delete self.fullscreen;
      }
      this._positionOverlaysHorizontally();
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

    this._positionOverlaysHorizontally();

    var onDestroy = function() {
      if (self.layer_selector) {
        self.layer_selector.clean();
        delete self.layer_selector;
      }
      this._positionOverlaysHorizontally();
    };

    overlay.model.bind("destroy", onDestroy, this);

  },

  // INSET MAP

  _setupInsetMapOverlay: function (type, data) {
    if (this.inset_map) {
      return;
    }

    var overlay = this.inset_map = new cdb.admin.overlays[type]({
      model: data,
      mapView: this.mapView,
      map: this.vis.map
    });

    this._bindInsetMapOverlay(overlay);

    return overlay;

  },

  _bindInsetMapOverlay: function (overlay) {

    var self = this;

    this._positionOverlaysVertically();

    // Need to reflow all overlays because this overlay could be going anywhere
    overlay.on('reposition', this._positionOverlaysVertically, this);

    var onDestroy = function() {
      if (self.inset_map) {
        self.inset_map.off('reposition', self._positionOverlaysVertically);
        self.inset_map.clean();
        delete self.inset_map;
      }
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

      var overlay_model = this.getOverlay(type);

      if (overlay_model) this._positionOverlay(overlay_model)

    }


    var onDestroy = function() {

      if (self.zoom) {
        self.zoom.clean();
        delete self.zoom;
      }

      var n = this.vertical_overlays.indexOf(overlay.model.get("type"));

      for (var i = n + 1; i< this.vertical_overlays.length; i++) {

        var type = this.vertical_overlays[i];

        var overlay_model = this.getOverlay(type);
        if (overlay_model) this._positionOverlay(overlay_model)

      }

    };

    overlay.model.bind("destroy", onDestroy, this);

  },

  _setupCartoDBLogo: function(type, data) {

    var overlay = this.logo = new cdb.admin.overlays[type]({
      model: data,
      map: this.map
    });

    this._positionCartoDBLogo(overlay.model);

    return overlay;

  },

  _setupSearchOverlay: function(type, data) {

    if (this.search) {
      return;
    }

    var overlay = this.search = new cdb.admin.overlays[type]({
      model: data,
      relative_position: this.vis.get("type") === "table",
      mapView: this.options.mapView,
      map: this.map,
      vis: this.vis,
      canvas: this.canvas,
    });

    this._bindSearchOverlay(overlay);

    return overlay;

  },

  _bindSearchOverlay: function(overlay) {

    var self = this;

    this._positionSearchOverlay(overlay.model);
    this._positionOverlaysHorizontally();

    var onDestroy = function() {

      if (self.search) {
        self.search.clean();
        delete self.search;
      }

      self._positionOverlaysHorizontally();

    };

    overlay.model.bind("destroy", onDestroy, this);

  },

  _setupHeaderOverlay: function(type, data) {
    var extra = data.get("extra");
    var headerType = extra.headerType;
    if (!headerType) { // Old-style header; ignore for now.
      return;
    }
    if (!this.header) this.header = {};
    var overlay = this.header[headerType] = new cdb.admin.overlays[type]({
      model: data,
      map: this.map
    });

    overlay.show();

    this._bindHeaderOverlay(overlay);

    return overlay;

  },

  _bindHeaderOverlay: function(overlay) {

    var self = this;
    var extra = overlay.model.get("extra");
    var destroyType = extra.headerType;

    var onDestroy = function() {
      self.header[destroyType].clean();
      delete self.header[destroyType];
      if (!self.header.title && !self.header.description) {
        delete self.header;
      }
      self._positionOverlaysVertically();
    };

    overlay.bind("change_y", this._positionOverlaysVertically, this);
    overlay.bind("change_height", this._positionOverlaysVertically, this);
    overlay.model.bind("destroy", onDestroy, this);

  },

  // Get height of all header overlays, since there can now be more than one.
  _getHeaderHeight: function() {
    var totalHeaderHeight = 0;
    $(".header.overlay-static").each(function(index, value) {
      totalHeaderHeight += $(value).outerHeight(true);
    });
    return totalHeaderHeight;
  },

  _getTitleHeight: function() {
    return $(".header.overlay-static.title").outerHeight(true);
  },

  _positionOverlay: function(overlay_model) {

    if (!overlay_model) return;

    var type = overlay_model.get("type");

    if (type === 'header') {
      var extra = overlay_model.get('extra');
      var header_type = extra.headerType;
      if (header_type === 'title') {
        this._positionTitleOverlay(overlay_model);
      } else if (header_type === 'description') {
        this._positionDescriptionOverlay(overlay_model);
      }
    }
    else if (type === 'zoom')           this._positionZoomOverlay(overlay_model);
    else if (type === 'fullscreen')     this._positionFullScreenOverlay(overlay_model);
    else if (type === 'share')          this._positionShareOverlay(overlay_model);
    else if (type === 'loader')         this._positionLoaderOverlay(overlay_model);
    else if (type === 'logo')           this._positionCartoDBLogo(overlay_model);
    else if (type === 'search')         this._positionSearchOverlay(overlay_model);
    else if (type === 'layer_selector') this._positionLayerSelectorOverlay(overlay_model);
    else if (type === 'inset_map')      this._positionInsetMapOverlay(overlay_model);

  },

  _positionTitleOverlay: function(overlay_model) {

    if (this.headerMessageIsVisible && this.canvas.get("mode") === 'desktop') overlay_model.set("y", 20);
    else overlay_model.set("y", 0);

  },

  _positionDescriptionOverlay: function(overlay_model) {
    var titleHeight = this._getTitleHeight();
    if (this.headerMessageIsVisible && this.canvas.get("mode") === 'desktop') overlay_model.set("y", titleHeight + 20);
    else if (titleHeight > 0) overlay_model.set("y", titleHeight);
    else                      overlay_model.set("y", 0);
  },

  _positionSearchOverlay: function(overlay_model) {

    var y = this.header ? this._getHeaderHeight() + 20 : 20;
    var x = this.share  ? 60 : 20;

    if (this.headerMessageIsVisible && this.canvas.get("mode") === 'desktop') overlay_model.set("y", this._getHeaderHeight() + 40);
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

    if (this.headerMessageIsVisible && this.canvas.get("mode") === 'desktop') overlay_model.set("y", this._getHeaderHeight() + 40);
    else overlay_model.set("y", y);

  },

  _positionShareOverlay: function(overlay_model) {

    var y = this.header ? this._getHeaderHeight() + 20 : 20;

    if (this.headerMessageIsVisible && this.canvas.get("mode") === 'desktop') overlay_model.set("y", this._getHeaderHeight() + 40);
    else overlay_model.set("y", y);

  },

  _positionLoaderOverlay: function(overlay_model) {

    var hasSQLHeader = this.headerMessageIsVisible && this.canvas.get("mode") === 'desktop';

    var y = 20;

    if (this.canvas.get("mode") === 'mobile' && this.header) {
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
    else if (this.headerMessageIsVisible && this.canvas.get("mode") === 'desktop') overlay_model.set("y", this._getHeaderHeight() + 40);
    else                                  overlay_model.set("y", 20);

  },

  _positionCartoDBLogo: function (overlay_model) {
    var y = (this.inset_map &&
             this.inset_map.model.get('xPosition') === 'left' &&
             this.inset_map.model.get('yPosition') === 'bottom') ? this.inset_map.model.get("y") + 170 : 40;
    overlay_model.set("y", y);
  },

  _positionInsetMapOverlay: function(overlay_model) {
    // The leaflet containers each have 10px of padding
    // But vertical padding seems unaffected

    // Here we go....attempt to position in all corners based on position of all other elements.
    // WHOOP.
    var xPos = overlay_model.get("xPosition");
    var yPos = overlay_model.get("yPosition");
    // This is an attempt to position the overlay before the model exists, so just exit
    if (xPos === undefined || yPos === undefined) {
        return;
    }
    var horizontalPadding = 10;
    var headerHeight = this.header ? this._getHeaderHeight() : 0;
    var x = 20;
    var y = 10;

    if (xPos === "left" && yPos === "top") {
      x = this.zoom || this.fullscreen ? 70 : x;
      y += headerHeight;
    } else if (xPos === "right" && yPos === "top") {
      y += headerHeight;
      y += (this.search || this.share || this.layer_selector) ? 50 : 0;
    } else if (xPos === "left" && yPos === "bottom") {
      y += 25;
      x -= 10;
    } else if (xPos === "right" && yPos === "bottom") {
      if (this.legend) {
        var legendHeight = this.legend.$el.height();
        var legendWidth = this.legend.$el.width();
        if (legendHeight === 0 || legendWidth === 0) {
            x -= 5;
            y -= 10;
        } else if (legendWidth > legendHeight) {
            y += legendHeight + 10;
        } else {
            x += legendWidth + 20;
            y -= 14;
        }
      } else {
        x -= 10;
      }
    } else {
      throw "Invalid x and y positions for inset_map overlay";
    }

    x = x - horizontalPadding;
    overlay_model.set("x", x);
    overlay_model.set("y", y);
  },

});
