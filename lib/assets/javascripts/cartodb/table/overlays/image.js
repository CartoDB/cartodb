cdb.admin.overlays.Image = cdb.admin.overlays.Text.extend({

  className: "image overlay",

  events: {

    "mouseup":            "_onMouseUp",

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

    _.bindAll(this, "_click", "_close", "_dblClick", "_onChangeMode", "_onKeyDown", "_putOnTop", "_onLoadSuccess", "_onLoadError");

    // Bind ESC key
    $(document).bind('keydown', this._onKeyDown);

    this.template = this.getTemplate('table/views/overlays/image');

    this._setupModels();

  },

  _killEvent: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

  },

  // Setup the internal and custom model
  _setupModels: function() {

    var extra = this.model.get("extra");

    this.model.set({ url: extra.url }, { silent: true });

    // Bindings
    this.model.bind('change:url',     this._setURL,          this);
    this.model.bind('change:style',   this._applyStyle,      this);
    this.model.bind('change:extra',   this._onChangeExtra,   this);
    this.model.bind('change:display', this._onChangeDisplay, this);

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

    if (this.timeout)      clearTimeout(this.timeout);
    if (this.keyUpTimeout) clearTimeout(this.keyUpTimeout);
    if (this.savingTimeout) clearTimeout(this.savingTimeout);

    var value = this.$text.html();

    if (cdb.Utils.stripHTML(value) == "") {

      this.keyUpTimeout = setTimeout(function() {

        self.model.set({ url: "" }, { silent: true });
        self._close();

      }, 600);

    }  else {


      if (cdb.Utils.isURL(value)) {
        this.model.set({ url: value }, { silent: true });
      }

      if (!this.$el.hasClass("hover") && this.$text.text()) {
        this.savingTimeout = setTimeout(function() {

          self._disableEditingMode();

        }, 500);

      }

    }

  },

  _onPaste: function(e) {

    var self = this;

    setTimeout(function() {

      var text = cdb.Utils.stripHTML(self.model.get("url"));

      if (cdb.Utils.isURL(text)) {
        self.model.set("url", text);
      }

    }, 200);

  },

  _onMouseDown:      function() { },
  _onMouseEnterText: function() { },
  _onMouseLeaveText: function() { },

  _close: function(e) {

    this._killEvent(e);

    var self = this;

    this.dropdown.hide();
    this.dropdown.clean();

    this.hide(function() {
      self.trigger("remove", self);
    });

  },

  /*
   * Applies style to the content of the overlay
   */

  _applyStyle: function() {

    var style      = this.model.get("style");

    var boxColor   = style["box-color"];
    var boxOpacity = style["box-opacity"];
    var boxWidth   = style["box-width"];

    this.$text.css(style);
    this.$text.css("font-size", style["font-size"] + "px");

    var rgbaCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
    + ',' + parseInt(boxColor.slice(-4,-2),16)
    + ',' + parseInt(boxColor.slice(-2),16)
    +', ' + boxOpacity + ' )';

    this.$el.css("background-color", rgbaCol);
    this.$el.find("img").css("width", boxWidth);

  },

  _enableEditingMode: function() {

    var self = this;
    var text = this.model.get("url");

    this.$el
    .removeClass("error")
    .addClass("editable")
    .addClass("disabled");

    this.$text.attr("contenteditable", true).focus();

    setTimeout(function() {

      var h = self.$text.outerHeight(true);
      var w = self.$text.width();

      self.$text.html(text);
      self.$text.css({ height: h, minHeight: self.$text.height(), minWidth: w });

    }, 100);

  },

  _disableEditingMode: function() {

    var url       = this.model.get("url");
    var style     = this.model.get("style");
    var boxWidth  = style["box-width"];
    var extra     = this.model.get("extra");
    var img       = "<img src='" + url + "' style='width: " + boxWidth + "px'/>";

    this.$el
    .removeClass("editable")
    .removeClass("disabled")
    .addClass("loader");

    this.$text.html(img);
    this.$text.attr("contenteditable", false);
    this.$text.css({ height: "auto", minHeight: "auto", minWidth: "auto" });

    extra.url = url;

    this.model.set({ extra: extra }, { silent: true });

    this.model.save();

  },

  _setURL: function() {

    this._loadImage(this.model.get("url"));

  },

  _loadImage: function(url) {

    console.log(url);

    var self = this;

    var success = function() {
      self._onLoadSuccess(url);
      console.log('saving')
    };

    var error = function() {
      self._onLoadError(url);
    };

    $("<img/>")
    .load(success)
    .error(error)
    .attr("src", url);

  },

  _onLoadError: function(url) {

    console.log("error loading image", url); 

    this.$el.removeClass("loader");
    this.$el.addClass('error');

  },

  _onLoadSuccess: function(url) {

    this.$el.removeClass("error");
    this.$el.removeClass("loader");

    var style     = this.model.get("style");
    var boxWidth  = style["box-width"];
    var extra     = this.model.get("extra");
    var img       = "<img src='" + url + "' style='width: " + boxWidth + "px'/>";

    extra.rendered_text = img;
    this.model.set({ extra: extra }, { silent: true });

    this.$el
    .removeClass("editable")
    .removeClass("disabled");

    this.$text.html(img);
    this.$text.attr("contenteditable", false);
    this.$text.css("height", "auto");

    //this.model.save();

    this.editModel.set("mode", "");

  },

  _addDropdown: function() {

    this.dropdown = new cdb.admin.WidgetPropertiesDropdown({
      tick: "left",
      target: this.$el.find(".edit"),
      model: this.model,
      horizontal_position: "left",
      horizontal_offset: 26,
      vertical_offset: 24,
      template_base: 'table/views/overlays/properties_dropdown',
      form_data: [{
        name: 'Box Style',
        form: {
          'box-color':  { type: 'color', value: '#000' },
          'box-opacity':  { type: 'simple_opacity', value: .7, min:0, max:1, inc: .1 },
        }

      }, {
        name: 'Width',
        form: {
          'box-width':  { type: 'simple_number', value: 300, min: 50, max: 2000, inc: 10 },
        }

      }]

    });

    var self = this;

    this.dropdown.on("saved", function() {
      self.dropdown.move();
    });

    this._bindDropdown();

    this.$el.append(this.dropdown.render().el);

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

    this.$el.append(this.template());

    this.$text = this.$el.find(".content div.text");

    this._setURL();
    this._applyStyle();
    this._onChangeExtra();
    this._addDropdown();

    return this;

  }

});

