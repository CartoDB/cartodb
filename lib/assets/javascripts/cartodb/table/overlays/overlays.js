cdb.admin.overlays = cdb.admin.overlays || {};

/*
 * Model for the Overlays
 * */
cdb.admin.models.Overlay = cdb.core.Model.extend({

  defaults: {
    order: 1
  },

  sync: Backbone.syncAbort,

  url: function(method) {
    var version = cdb.config.urlVersion('overlays', method);
    var base = '/api/' + version + '/viz/' + this.collection.vis.id + '/overlays';
    if (this.isNew()) {
      return base;
    }
    return base + '/' + this.id;
  },

  _clone: function(obj) {

    var copy;

    // Handle  a couple of types, plus null and undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Array
    if (obj instanceof Array) {
      copy = [];
      for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = this._clone(obj[i]);
      }
      return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
      copy = {};
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = this._clone(obj[attr]);
      }
      return copy;
    }

    throw new Error("Type not supported");
  },

  cloneAttributes: function() {
    return this._clone(this.attributes);
  },

  /*
   * Overwrite serialization method to use our Overlay structure
   * */
  toJSON: function() {

    var json = {
      template: this.get("template"),
      order:    this.get("order"),
      type:     this.get("type"),
      options:  {
        x:       this.get("x"),
        y:       this.get("y"),
        device:  this.get("device"),
        display: this.get("display"),
        style:   this.get("style"),
        extra:   this.get("extra")
      }
    };
    // add x/y position model attributes for inset map
    var xPosition = this.get("xPosition");
    var yPosition = this.get("yPosition");
    if (xPosition && yPosition) {
        json.options.xPosition = xPosition;
        json.options.yPosition = yPosition;
    }
    return json;
  },

  parse: function(resp) {
    resp.display = resp.options.display;
    var options = resp.options;
    if (options) {
      options = typeof options === 'string' ? JSON.parse(options): options;
      _.extend(resp, {
        x:            options.x,
        y:            options.y,
        device:       options.device,
        extra:        options.extra,
        style:        options.style,
        display:      options.display
      });
    }
    delete resp.options.display;
    return resp;
  },

  clone: function() {
    return new cdb.admin.models.Overlay(_.omit(_.clone(this.attributes), 'id', 'parent_id'));
  }

});

/*
 * Overlays collection
 * */
cdb.admin.Overlays = Backbone.Collection.extend({

  model: cdb.admin.models.Overlay,

  url: function(method) {
    var version = cdb.config.urlVersion('overlays', method);
    return '/api/' + version + '/viz/' + this.vis.get("id") + '/overlays';
  },


  comparator: function(item) {
    return item.get("order");
  },

  initialize: function() {

    this._bindOverlays();

  },

  _bindOverlays: function() {

    this.bind("reset", function(){

      var headers = this.filter(function(overlay) { return overlay.get("type") === "header"; });

      if (headers.length) {

        var self = this;

        this.vis.on("change:name change:description", function() {

          headers[0].set({
            title:  this.get("name"),
            description: self._getMarkdown(this.get('description'))
          });

        }, this.vis);

      }

    }, this);

  },

  /*
   * Returns an array with all the overlays z-indexes
   * */
  getOverlaysZIndex: function(mode) {

    var overlays = this.filter(function(o) {
      return o.get("device") === mode && (o.get("type") === "text" || o.get("type") === "annotation" || o.get("type") === "image");
    });

    return _.map(overlays, function(o) { return parseInt(o.get("style")["z-index"]) });

  },

  createOverlayByType: function(overlay_type, property) {
      var byType = {
        'fullscreen':     this._createFullScreenOverlay,
        'header':         this._createHeaderOverlay,
        'layer_selector': this._createLayerSelectorOverlay,
        'share':          this._createShareOverlay,
        'search':         this._createSearchOverlay,
        'zoom':           this._createZoomOverlay,
        'logo':           this._createLogoOverlay,
        'inset_map':      this._createInsetMapOverlay
      };
      var c = byType[overlay_type];
      if (c) {
        return c.call(this, property);
      }
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
    this.create(options);
  },

  _createLogoOverlay: function() {
    var options = {
      type: "logo",
      order: 10,
      display: true,
      x: 10,
      y: 40
    };
    this.create(options);
  },

  _createSearchOverlay: function() {
    var options = {
      type: "search",
      order: 3,
      display: true,
      x: 60,
      y: 20
    }
    this.create(options);
  },

  _createLayerSelectorOverlay: function() {
    var options = {
      type: "layer_selector",
      order: 4,
      display: true,
      x: 212,
      y: 20
    };
    this.create(options);
  },

  _createShareOverlay: function() {

    var options = {
      type: "share",
      order: 2,
      display: true,
      x: 20,
      y: 20
    };

    this.create(options);

  },

  _createInsetMapOverlay: function () {
    var options = {
      type: "inset_map",
      order: 11,
      display: true,
      xPosition: 'left',
      yPosition: 'top',
      x: 20,
      y: 20
    };

    this.create(options);
  },

  _getMarkdown: function(text) {
    return text ? $(markdown.toHTML(text)).html() : "";
  },

  _createHeaderOverlay: function(property) {

    var self = this;

    var defaultStyle = {
      "z-index":          4,
      "color":            "#ffffff",
      "text-align":       "left",
      "font-size":        property === "title" ? "20" : "12",
      "font-family-name": "Helvetica",
      "box-padding":      10,
      "box-color":        "#000000",
      "box-opacity":      0.7,
    };

    var text;
    var rendered_text; // Rendered version of the markdown text
    if (property === "title") {
      text = this.vis.get("name");
      rendered_text = text;
    } else if (property === "description") {
      text = this.vis.get("description");
      if (!text) {
        text = "Write a description of your map here.";
      }
      rendered_text = this._getMarkdown(text);
    }

    if (property == 'description' && !text) return;

    var options = {
      type: "header",
      order: 1,
      display: true,
      extra: {
        headerType: property,
        text: text,
        rendered_text: text
      },
      style: defaultStyle,
      x: "0",
      y: "0"
    };

    var model = this.create(options);
    var vis = this.vis;

    if (property === "title") {
      this.vis.on("change:name", function() {
        var newText = vis.get("name");
        model.set({
          text: newText,
          rendered_text: newText
        });
      }, model);
    } else if (property === "description") {
      this.vis.on("change:description", function() {
        model.set({
          text:  vis.get("description"),
          rendered_text: self._getMarkdown(vis.get("description"))
        });
      }, model);
    }

    model.bind('destroy', function() {
      vis.unbind(null, null, model);
    });

  },

  _createFullScreenOverlay: function() {
    var options = {
      type: "fullscreen",
      order: 7,
      display: true,
      x: 20,
      y: 172
    };
    this.create(options);
  }
});
