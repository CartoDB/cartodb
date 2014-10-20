cdb.admin.overlays.Annotation = cdb.core.View.extend({

  className: "annotation overlay",

  template_name: 'table/views/overlays/annotation',

  events: {

    "mouseenter .text":   "_onMouseEnter",
    "mouseleave .text":   "_onMouseLeave",
    "mouseup":            "_savePosition",

    "click .close":      "_close",
    "click .content":    "_onClickEdit",
    "click .text":       "_onClickEdit",
    "dblclick .content": "_onDblClick",
    "dblclick .text":    "_onDblClick",

    "keyup .text":       "_onKeyUp",
    "paste .text":       "_onPaste"

  },

  initialize: function() {

    _.bindAll(this, "_click", "_close", "_onChangeMode", "_onKeyDown");

    this.vis = this.options.vis;

    this.mapView = this.options.mapView;

    this.mapView.map.bind('change',      this._place, this);
    this.mapView.map.bind('change:zoom', this._applyZoomLevelStyle, this);

    this.mapView.bind('zoomstart', this._hide, this);
    this.mapView.bind('zoomend',   this._show, this);

    // Bind ESC key
    $(document).bind('keydown', this._onKeyDown);

    this.template = this.getTemplate(this.template_name);

    this._setupModels();

    // zoom level config
    var minZoomLevel     = this.mapView.map.get("minZoom");
    var maxZoomLevel     = this.mapView.map.get("maxZoom");

    this.form_data = [{
        name: 'Text',
        form: {
          'font-size':  { type: 'simple_number', value: 12, min: 5, max: 50, inc: 2 },
          'color':      { type: 'color', value: '#FFF', extra: { tick: "left", picker_horizontal_position: "left", picker_vertical_position: "down" }},
          'font-family-name': {
            type: 'select',
            value: "Helvetica",
            extra: ["Helvetica", "Droid Sans", "Vollkorn", "Roboto", "Open Sans"]
          },
          'text-align':      { type: 'text_align', value: 'left', alignments: { left: true, right: true, center: false } },
        }
      }, {
        name: 'Box',
        form: {
          'box-color':  { type: 'color', value: '#000', extra: { tick: "left", picker_horizontal_position: "left", picker_vertical_position: "down" }},
          'box-opacity':  { type: 'simple_opacity', value: .7, min:0, max:1, inc: .1 },
          'box-padding':  { type: 'simple_number_with_label', value: 5, min: 5, max: 50, inc: 1, label: "P" }
        }
      }, {
        name: 'Line',
        form: {
          'line-color':  { type: 'color', value: '#000', extra: { tick: "left", picker_horizontal_position: "left", picker_vertical_position: "down" }},
          'line-width':  { type: 'simple_number_with_label', value: 50, min: 5, max: 100, inc: 1, label: 'W' },
        }
      } , {
        name: 'Zoom (min-max)',
        form: {
          'min-zoom':  { type: 'simple_number', value: minZoomLevel, min: minZoomLevel, max: maxZoomLevel, inc: 1, classes: "margin-min" },
          'max-zoom':  { type: 'simple_number_with_label', value: maxZoomLevel, min: minZoomLevel, max: maxZoomLevel, inc: 1, label: '	↔'},
        }
      }];
  },

  _killEvent: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

  },

  // Setup the internal and custom model
  _setupModels: function() {

    var self  = this;
    var extra = this.extra = this.model.get("extra");

    this.model.set({ text: extra.text }, { silent: true });

    var applyStyle = function() {
      self._applyStyle(true);
    };

    // Binding
    this.model.bind('remove',   this.hide, this);

    this.model.bind('change:style',    applyStyle,            this);
    this.model.bind('change:text',     this._setText,         this);
    this.model.bind('change:display',  this._onChangeDisplay, this);
    this.model.bind('change:extra',    this._onChangeExtra,   this);
    this.model.bind('change:selected', this._onChangeSelected, this);

    // Internal model to store the editing state
    this.editModel = new cdb.core.Model({ mode: "" });
    this.editModel.bind('change:mode', this._onChangeMode, this);

    this.add_related_model(this.editModel);

  },

  // Element events 
  _onKeyUp: function(e) {

    var self = this;

    var temp      = "";
    var domString = "";

    if (this.timeout)       clearTimeout(this.timeout);
    if (this.keyUpTimeout)  clearTimeout(this.keyUpTimeout);
    if (this.savingTimeout) clearTimeout(this.savingTimeout);

    var value = this.$text.html();

    if (cdb.Utils.stripHTML(value) == "") {

      this.keyUpTimeout = setTimeout(function() {

        self.model.set({ text: "" }, { silent: true });
        self._close();

      }, 600);

    } else {

      this.model.set({ text: value }, { silent: true });

      if (!this.$el.hasClass("hover") && this.$text.text()) {
        this.savingTimeout = setTimeout(function() {

          self._disableEditingMode();

        }, 500);
      }
    }

  },

  _onClickEdit: function(e) {

    this._killEvent(e);

    this.trigger("clickEdit", this.model, this.form_data);
    this.model.set("selected", true);

  },

  _click: function(e) {

    this._killEvent(e);

  },

  _onKeyDown: function(e) {

    if (e.keyCode === 27) {
      this.editModel.set("mode", "");
    }

  },

  _onPaste: function(e) {

    var self = this;

    setTimeout(function() {

      var text = cdb.Utils.stripHTML(self.model.get("text"));
      self.model.set("text", text)

    }, 200);

  },

  _onDblClick: function(e) {

    this._killEvent(e);
    this.editModel.set("mode", "editable");
  },

  _savePosition: function(editable) {

    var extra = this.model.get("extra");

    var x     = this.model.get("x");
    var y     = this.model.get("y");

    var oldX   = this.$el.position().left;
    var oldY   = this.$el.position().top;
    var height = this.$el.height();

    if (x == oldX && y == oldY) return;

    var x = this.$el.position().left;
    var y = this.$el.position().top;

    var style      = this.model.get("style");

    var lineWidth  = style["line-width"];
    var textAlign  = style["text-align"];

    y = y + this.$el.height()/2;

    if (textAlign === "right") {
      x = x + this.$el.width() + lineWidth;
    } else {
      x = x - lineWidth;
    }

    var latlng = this.mapView.pixelToLatLon([x , y]);
    extra.latlng = [latlng.lat, latlng.lng];

    this.model.set({ extra: extra }, { silent: true});

    this.model.save();

  },

  _onMouseDown: function() {},

  _onMouseEnter: function() {

    this.$el.addClass("hover");

    if (this.editModel.get("mode") == "editable") {
      if (this.timeout) clearTimeout(this.timeout);
    }

  },

  _onMouseLeave: function() {
    this.$el.removeClass("hover");

    var self = this;

    if (this.editModel.get("mode") == "editable") {

      this.timeout = setTimeout(function() {

        self.editModel.set("mode", "");

      }, 250);
    }

  },

  _hide: function() {
    this.$el.fadeOut(150);
  },

  _show: function() {

    if (!this._belongsToCanvas()) return;

    var self = this;

    this.$el.stop().delay(500).fadeIn(150, function() {
      self.$el.css({ display: "inline-table" }); // trick so we don't need to set the width
    });

  },

  show: function(animated) {

    if (!this._belongsToCanvas()) return;

    this.$el.show();
    this.$el.css({ display: "inline-table "});

    if (true) this.$el.addClass('animated bounceIn');

    var self = this;

    this.$el.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
      self.$el.removeClass("animated bounceIn");
    });

  },

  hide: function(callback) {

    var self = this;

    this.model.set("selected", false);

    this.$el
    .removeClass('animated bounceIn')
    .addClass('animated bounceOut')

    callback && _.isFunction(callback) && callback();

    // unbind from the map
    this.mapView.map.unbind('change',      this._place, this);
    this.mapView.map.unbind('change:zoom', this._applyZoomLevelStyle, this);

    // Give it some time to complete the animation
    setTimeout(function() {
      self.clean();
    }, 550);

  },

  _close: function(e) {

    this._killEvent(e);

    var self = this;

    this.model.set("selected", false);

    this.hide(function() {
      self.trigger("remove", self);
    });

  },

  _place: function() {

    var style      = this.model.get("style");
    var lineWidth  = style["line-width"];
    var textAlign  = style["text-align"];

    var pos        = this.mapView.latLonToPixel(this.extra.latlng);
    var size       = this.mapView.getSize();
    var top        = pos.y - this.$el.height()/2;
    var left       = pos.x + lineWidth;

    if (textAlign === "right") {
      left = pos.x - this.$el.width() - lineWidth;
    } 

    this.$el.css({ top: top, left: left });

  },

  _belongsToCanvas: function() {

    return this.model.get("device") === this.vis.get("canvas_mode");

  },

  _onChangeDisplay: function() {

    var display = this.model.get("display");

    if (display && this._belongsToCanvas()) {
      this.show();
    } else {
      this._hide();
    }

  },

  _onChangeExtra: function() {

    var extra  = this.model.get("extra");
    extra.text = this.model.get("text");

    this.model.set({ extra: extra }, { silent: true });

  },

  _getStyleProperty: function(property) {

    var style      = this.model.get("style");

    return style[property];
  },

  /*
   * Applies style to the content of the widget
   */

  _applyStyle: function(save) {

    var style      = this.model.get("style");

    var textAlign  = style["text-align"];
    var boxColor   = style["box-color"];
    var boxOpacity = style["box-opacity"];
    var boxPadding = style["box-padding"];

    var lineWidth  = style["line-width"];
    var lineColor  = style["line-color"];
    var fontFamily = style["font-family-name"];

    if (boxOpacity === 0) {
      this.$el.addClass("border-dark");
    } else {
      this.$el.removeClass("border-dark");
    }

    this.$text.css(style);

    this.$el.find(".content").css("padding", boxPadding);
    this.$text.css("font-size", style["font-size"] + "px");
    this.$el.css("z-index", style["z-index"]);

    this.$el.find(".stick").css({ width: lineWidth, left: -lineWidth });

    var fontFamilyClass = "";

    if      (fontFamily  == "Droid Sans") fontFamilyClass = "droid";
    else if (fontFamily  == "Vollkorn")   fontFamilyClass = "vollkorn";
    else if (fontFamily  == "Open Sans")  fontFamilyClass = "open_sans";
    else if (fontFamily  == "Roboto")     fontFamilyClass = "roboto";

    this.$el
    .removeClass("droid")
    .removeClass("vollkorn")
    .removeClass("roboto")
    .removeClass("open_sans");

    this.$el.addClass(fontFamilyClass);

    if (textAlign === "right") {
      this.$el.addClass("align-right");
      this.$el.find(".stick").css({ left: "auto", right: -lineWidth });
    } else {
      this.$el.removeClass("align-right");
    }

    this._place();

    this._applyZoomLevelStyle();

    if (save) this.model.save();

    var self = this;

  },

  _applyZoomLevelStyle: function() {

    var style      = this.model.get("style");
    var extra      = this.model.get("extra");

    var boxColor   = style["box-color"];
    var boxOpacity = style["box-opacity"];
    var lineColor  = style["line-color"];

    var minZoom    = style["min-zoom"];
    var maxZoom    = style["max-zoom"];

    var currentZoom = this.mapView.map.get("zoom");

    var textOpacity = 1;

    if (currentZoom >= minZoom && currentZoom <= maxZoom) {

      textOpacity = 1;

      var rgbaLineCol = 'rgba(' + parseInt(lineColor.slice(-6,-4),16)
      + ',' + parseInt(lineColor.slice(-4,-2),16)
      + ',' + parseInt(lineColor.slice(-2),16)
      + ',' + 1 + ' )';

      var rgbaBoxCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
      + ',' + parseInt(boxColor.slice(-4,-2),16)
      + ',' + parseInt(boxColor.slice(-2),16)
      + ',' + boxOpacity + ' )';

    } else {

      textOpacity = .5;

      var rgbaLineCol = 'rgba(' + parseInt(lineColor.slice(-6,-4),16)
      + ',' + parseInt(lineColor.slice(-4,-2),16)
      + ',' + parseInt(lineColor.slice(-2),16)
      + ',' + .2 + ' )';

      var rgbaBoxCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
      + ',' + parseInt(boxColor.slice(-4,-2),16)
      + ',' + parseInt(boxColor.slice(-2),16)
      + ',' + .2 + ' )';

    }

    this.$el.find(".text").animate({ opacity: textOpacity }, 150);

    this.$el.css("background-color", rgbaBoxCol);

    this.$el.find(".stick").css("background-color", rgbaLineCol);
    this.$el.find(".ball").css("background-color", rgbaLineCol);

  },

  _onChangeSelected: function() {

    var selected = this.model.get("selected");

    if (selected) {

      this.$el.addClass("selected");

      if (this._getStyleProperty("box-opacity") === 0) {
        this.$el.addClass("border-dark");
      }

    } else {

      this.$el.removeClass("selected");

      if (this._getStyleProperty("box-opacity") === 0) {
        this.$el.removeClass("border-dark");
      }

    }

  },

  _onChangeMode: function() {

    var mode = this.editModel.get("mode");

    if (mode == "editable") {

      this._enableEditingMode();

    } else {

      this._disableEditingMode();

    }

  },

  _enableEditingMode: function() {

    this.$el
    .addClass("editable")
    .addClass("disabled");

    this.$text.attr("contenteditable", true).focus();

    var style = this.model.get("style");
    var width = style["box-width"];

    var text = this.model.get("text");

    this.$el.css("width", "auto");
    this.$el.css("max-width", width);
    this.$text.html(text);
    this.$el.find(".hint").fadeIn(150);
  },

  _disableEditingMode: function() {

    var text = this._transformToMarkdown(this.model.get("text"));

    this.editModel.set("mode", "");

    if (text) {

      var self = this;

      self.$el.find(".hint").fadeOut(150, function() {

        self.$el
        .removeClass("editable")
        .removeClass("disabled");

        self.$text.attr("contenteditable", false);

        setTimeout(function() {

          self.$text.html(text);
          self.model.save();
          self._place();

        }, 100);


      });

      }
  },

  _setText: function() {

    var text          = this.model.get("text");
    var rendered_text = this._transformToMarkdown(text);

    var extra = this.model.get("extra");

    extra.text          = text;
    extra.rendered_text = rendered_text

    this.model.set({ extra: extra }, { silent: true });

    if (rendered_text) this.$text.html(rendered_text);

  },

  _transformToMarkdown: function(text) {

    text = markdown.toHTML(text)

    text = text.replace(/&lt;/g, "<");
    text = text.replace(/&gt;/g, ">");
    text = text.replace(/<p>/g, "");
    text = text.replace(/&amp;nbsp;/g, " ");
    text = text.replace(/<\/p>/g, "");

    return text;

  },

  _onCloseDialogs: function() {
    this.model.set("selected", false);
  },

  _setupText: function() {

    this.$text = this.$el.find(".content div.text");
    this.$text.html(this._transformToMarkdown(this.model.get("text")));

  },

  render: function() {

    this.$el.append(this.template(this.model.attributes));
    this.$el.addClass(this.model.get("device"));

    this._setupText();
    this._applyStyle(false);

    var self = this;

    setTimeout(function() {
      self._place(true);
      self.show();
    }, 300)

    cdb.god.unbind("closeDialogs", this._onCloseDialogs, this);
    cdb.god.bind("closeDialogs", this._onCloseDialogs, this);

    return this;

  }

});
