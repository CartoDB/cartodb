cdb.admin.overlays.Code = cdb.core.View.extend({

  className: "code overlay",

  template_name: 'table/views/overlays/code',

  events: {

    "mouseup":           "_onMouseUp",
    "mousedown":         "_onMouseDown",

    "mouseenter .text":  "_onMouseEnter",
    "mouseleave .text":  "_onMouseLeave",

    "click .close":      "_close",
    "click .content":    "_click",
    "dblclick .content": "_dblClick",

    "keyup .text":       "_onKeyUp",
    "click .text":       "_killEvent",
    "paste .text":       "_onPaste"

  },

  initialize: function() {

    _.bindAll(this, "_click", "_close", "_dblClick", "_onChangeMode", "_onKeyDown", "_putOnTop");

    // Bind ESC key
    $(document).bind('keydown', this._onKeyDown);

    this.template = this.getTemplate(this.template_name);

    this._setupModels();

  },

  _killEvent: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

  },

  // Setup the internal and custom model
  _setupModels: function() {

    var extra = this.model.get("extra");

    this.model.set({ text: extra.text }, { silent: true });

    // Binding
    this.model.bind('change:text',    this._setText,    this);
    this.model.bind('change:style',   this._applyStyle, this);
    this.model.bind('change:display', this._onChangeDisplay, this);
    this.model.bind('change:extra',   this._onChangeExtra, this);

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

  _dblClick: function(e) {

    this._killEvent(e);

  },

  _click: function(e) {

    this._killEvent(e);

    this._putOnTop();

    var isLink = e.target.hasAttribute("href");

    if (!isLink) {
      cdb.god.trigger("closeDialogs");
    }

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

  _onMouseUp: function(e) {

    // Prevents entering in the edit mode when clicking the edit button
    if (!$(e.target).parents(".overlay_text").length && !$(e.target).hasClass("overlay_text")) {
      return;
    }

    cdb.god.trigger("closeDialogs");

    var extra = this.model.get("extra");

    var x     = this.model.get("x");
    var y     = this.model.get("y");

    var oldX  = this.$el.position().left;
    var oldY  = this.$el.position().top;

    var portraitDirection  = extra.portraitDirection;
    var landscapeDirection = extra.landscapeDirection;

    if (y == 0 && portraitDirection == "bottom") oldY = y;
    if (x == 0 && landscapeDirection == "right") oldX = x;

    // If we didn't move the overlay
    if (oldX === x && y === oldY || x == 0 && landscapeDirection == "right" && y === oldY || y == 0 && portraitDirection == "bottom" && oldX === x) {

      this.dropdown.hide();
      this.editModel.set("mode", "editable");

      return;

    }

    var x = this.$el.position().left;
    var y = this.$el.position().top;

    // Default positions
    extra.portraitDirection  = "top";
    extra.landscapeDirection = "left";

    // Let's see where did we put our overlay…
    var rightSticked  = x + this.$el.width()  >= $(".cartodb-map").width();
    var bottomSticked = y + this.$el.height() >= $(".cartodb-map").height();

    if (bottomSticked) { // we sticked the overlay to the bottom of the screen

      y = 0;

      this.$el.css({ bottom: 0, top: "auto" });

      extra.portraitDirection = "bottom";

    }

    if (rightSticked) { // we sticked the overlay to the right side

      x = 0;

      this.$el.css({ right: 0, left: "auto" });

      extra.landscapeDirection = "right";

    }

    this.model.set({ extra: extra }, { silent: true});
    this.model.set({ x: x, y: y });

    this.model.save();

  },

  _onMouseDown: function() { },

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

  show: function(animated) {

    this.$el.show();

    if (true) this.$el.addClass('animated bounceIn');

  },

  hide: function(callback) {

    var self = this;

    this.$el
    .removeClass('animated bounceIn')
    .addClass('animated bounceOut');

    callback && callback();

    // Give it some time to complete the animation
    setTimeout(function() {
      self.clean();
    }, 550);

  },

  _close: function(e) {

    this._killEvent(e);

    var self = this;

    this.dropdown.hide();
    this.dropdown.clean();

    this.hide(function() {
      self.trigger("remove", self);
    });

  },

  _onChangeDisplay: function() {

    var display = this.model.get("display");

    if (display) {
      this.show();
    } else {
      this.$el.hide();
    }

  },

  _onChangeExtra: function() {

    var extra  = this.model.get("extra");
    extra.text = this.model.get("text");

    this.model.set({ extra: extra }, { silent: true });

  },

  /*
   * Applies style to the content of the widget
   */

  _applyStyle: function() {

    var style      = this.model.get("style");

    var boxColor   = style["box-color"];
    var boxOpacity = style["box-opacity"];
    var boxWidth   = style["box-width"];
    var fontFamily = style["font-family-name"];

    this.$text.css(style);
    this.$text.css("font-size", style["font-size"] + "px");

    var rgbaCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
    + ',' + parseInt(boxColor.slice(-4,-2),16)
    + ',' + parseInt(boxColor.slice(-2),16)
    +', ' + boxOpacity + ' )';

    this.$el.css("background-color", rgbaCol);
    this.$el.css("max-width", boxWidth);

    var fontFamilyClass = "";

    if      (fontFamily  == "Droid Sans") fontFamilyClass = "droid";
    else if (fontFamily  == "Vollkorn")   fontFamilyClass = "vollkorn";
    else if (fontFamily  == "Open Sans")  fontFamilyClass = "open_sans";
    else if (fontFamily  == "Roboto")     fontFamilyClass = "roboto";

    this.$el.css("width", "auto");

    this.$el
    .removeClass("droid")
    .removeClass("vollkorn")
    .removeClass("roboto")
    .removeClass("open_sans");

    this.$el.addClass(fontFamilyClass);

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

    var text = this.model.get("text");

    this.$el
    .addClass("editable")
    .addClass("disabled");

    this.$text.attr("contenteditable", true).focus();

    this.$el.css("width", "auto");

    var self = this;

    setTimeout(function() {
      self.$text.html(text);
    }, 100)

  },

  _disableEditingMode: function() {

    var text = this._transformToMarkdown(this.model.get("text"));

    this.editModel.set("mode", "");

    if (text) {

      this.$text.html(text);

      this.$el
      .removeClass("editable")
      .removeClass("disabled");

      this.$text.attr("contenteditable", false);
      this.$el.css("width", "auto");

      var self = this;

      setTimeout(function() {
        var width = self.$el.width();
        self.$el.css("width", width);
      }, 300);

      this.model.save();

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

    console.log(text)
    //return "code" + "<script>" + text + "</script>";
    return "code"; 

  },

  _addDropdown: function() {

    var device            = this.model.get("device");
    var horizontal_offset = 26;
    var vertical_offset   = 24;

    if (device === "mobile") {
      vertical_offset -= $("header").height() + 12;
    }

    this.dropdown = new cdb.admin.WidgetPropertiesDropdown({
      tick: "left",
      target: this.$el.find(".edit"),
      model: this.model,
      offset_mode: device === 'mobile' ? "offset" : "position",
      horizontal_position: "left",
      horizontal_offset: horizontal_offset,
      vertical_offset: vertical_offset,
      template_base: 'table/views/overlays/properties_dropdown',
      form_data: [{
        name: 'Text Align',
        form: {
          'text-align':      { type: 'text_align', value: 'left' },
        }
      }, {
        name: 'Text Style',
        form: {
          'font-size':  { type: 'simple_number', value: 12, min: 5, max: 50, inc: 2 },
          'color':      { type: 'color', value: '#FFF' },
        }

      }, {
        name: 'Font',
        form: {
          'font-family-name': {
            type: 'select',
            value: "Helvetica",
            extra: ["Helvetica", "Droid Sans", "Vollkorn", "Roboto", "Open Sans"]
          }
        }
      }, {

        name: 'Box Style',
        form: {
          'box-color':  { type: 'color', value: '#000' },
          'box-opacity':  { type: 'simple_opacity', value: .7, min:0, max:1, inc: .1 },
        }

      }, {
        name: 'Max Width',
        form: {
          'box-width':  { type: 'simple_number', value: 300, min: 50, max: 2000, inc: 10 },
        }

      }]
    });

    this._bindDropdown();

    var self = this;

    this.dropdown.on("saved", function() {
      self.dropdown.move(true);
    });

    if (this.model.get("device") == "mobile") {
      $(".map").append(this.dropdown.render().el);
    } else {
      this.$el.append(this.dropdown.render().el);
    }

  },

  _bindDropdown: function() {

    this.dropdown.bind("onDropdownShown", function() {
      this.$el.addClass("open");

      this._putOnTop();

    }, this);

    this.dropdown.bind("onDropdownHidden", function() {
      this.$el.removeClass("open");
    }, this);

    cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);

  },

  _putOnTop: function() {

    $(".overlay").css("z-index", 999);
    this.$el.css("z-index", 2001);

  },

  _place: function() {

    var landscapeDirection = this.model.get("extra").landscapeDirection;
    var portraitDirection  = this.model.get("extra").portraitDirection;

    if (portraitDirection == 'bottom') {

      this.$el.offset({
        top: this.model.get("y")
      });

      this.$el.css({
        top: "auto",
        bottom: this.model.get("y")
      });

    } else {
      this.$el.offset({
        top: this.model.get("y")
      });
    }

    if (landscapeDirection == 'right') {

      this.$el.offset({
        left: this.model.get("x")
      });

      this.$el.css({
        left: "auto",
        right: this.model.get("x")
      });

    } else {
      this.$el.offset({
        left: this.model.get("x")
      });
    }

  },

  render: function() {

    this._place();

    this.$el.append(this.template(this.model.attributes));

    this.$text = this.$el.find(".content div.text");

    var text = this._transformToMarkdown(this.model.get("text"));

    this.$text.html(text);

    this._applyStyle();
    this._onChangeExtra();
    this._addDropdown();

    return this;

  }

});
