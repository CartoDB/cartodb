cdb.admin.widgets.Image = cdb.core.View.extend({

  className: "image widget",

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

    _.bindAll(this, "_click", "_close", "_dblClick", "_onChangeMode", "_onKeyDown", "_putOnTop");

    // Bind ESC key
    $(document).bind('keydown', this._onKeyDown);

    this.template = this.getTemplate('table/views/widgets/text');

    this._setupModels();

  },

  _killEvent: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

  },

  // Setup the internal and custom model
  _setupModels: function() {

    this.model = this.options.model;

    var extra = this.model.get("extra");

    this.model.set({ url: extra.url }, { silent: true });

    // Bindings
    this.model.bind('change:url',   this._setURL,        this);
    this.model.bind('change:style', this._applyStyle,    this);
    this.model.bind('change:extra', this._onChangeExtra, this);

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

    var value = this.$text.html();

    if (cdb.Utils.stripHTML(value) == "") {

      this.keyUpTimeout = setTimeout(function() {

        self.model.set({ text: "" }, { silent: true });
        self._close();

      }, 600);

    } else {

      this.model.set({ text: value }, { silent: true });

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

    if (!$(e.target).parents(".widget_text").length && !$(e.target).hasClass("widget_text")) {
      return;
    }

    cdb.god.trigger("closeDialogs");

    var x = this.model.get("x");
    var y = this.model.get("y");

    var oldX = this.$el.position().left;
    var oldY = this.$el.position().top;

    if (oldX === x && y === oldY) {

      this.dropdown.hide();
      this.editModel.set("mode", "editable");

    } else {

      this.model.set("x", this.$el.position().left);
      this.model.set("y", this.$el.position().top);

    }

  },

  _onMouseDown:      function() { },
  _onMouseEnterText: function() { },
  _onMouseLeaveText: function() { },

  _onMouseEnter: function() {

    if (this.editModel.get("mode") == "editable") {
      if (this.timeout) clearTimeout(this.timeout);
    }

  },

  _onMouseLeave: function() {

    var self = this;

    if (this.editModel.get("mode") == "editable") {

      this.timeout = setTimeout(function() {

        self.editModel.set("mode", "");

      }, 250);
    }

  },

  show: function(animated) {

    this.$el.show();

    if (animated) this.$el.addClass('animated bounceIn');

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

  _onChangeExtra: function() {

    var extra = this.model.get("extra");

    extra.url = this.model.get("url");

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

    this.$text.css(style);
    this.$text.css("font-size", style["font-size"] + "px");

    var rgbaCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
    + ',' + parseInt(boxColor.slice(-4,-2),16)
    + ',' + parseInt(boxColor.slice(-2),16)
    +', ' + boxOpacity + ' )';

    this.$el.css("background-color", rgbaCol);
    this.$el.find("img").css("width", boxWidth);

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

    var self = this;

    var text = this.model.get("url");

    this.$el.addClass("editable").addClass("disabled");
    this.$text.attr("contenteditable", true).focus();

    setTimeout(function() {
      self.$text.html(text);
    }, 100)

  },

  _disableEditingMode: function() {

    var text = this.model.get("url");

    text = this._transformToMarkdown(text);

    if (text) this.$text.html(text);

    this.$el.removeClass("editable").removeClass("disabled");
    this.$text.attr("contenteditable", false);

    this.model.save();

  },

  _setURL: function() {

    var text = this.model.get("url");

    text = this._transformToMarkdown(text);

    var extra = {
      rendered_text: text
    };

    this.model.set({ extra: extra }, { silent: true });

    if (text) this.$text.html(text);

  },

  _transformToMarkdown: function(text) {

    var style      = this.model.get("style");
    var boxWidth   = style["box-width"];

    return "<img src='" + text + "' style='width: " + boxWidth + "px'/>";

  },

  _addDropdown: function() {

    this.dropdown = new cdb.admin.WidgetPropertiesDropdown({
      tick: "left",
      target: this.$el.find(".edit"),
      model: this.model,
      horizontal_position: "left",
      horizontal_offset: 26,
      vertical_offset: 24,
      template_base: 'table/views/widgets/properties_dropdown',
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

    $(".widget").css("z-index", 999);
    this.$el.css("z-index", 2001);

  },

  render: function() {

    var self = this;

    this.$el.offset({
      left: this.model.get("x"),
      top:  this.model.get("y")
    });

    this.$el.append(this.template());

    this.$text = this.$el.find(".content div.text");

    this._setURL();
    this._applyStyle();
    this._onChangeExtra();
    this._addDropdown();

    return this;

  }

});

