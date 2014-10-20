cdb.admin.overlays.Text = cdb.geo.ui.Text.extend({

  className: "text overlay snap",

  template_name: 'table/views/overlays/text',

  events: {

    "mouseenter .text":  "_onMouseEnter",
    "mouseleave .text":  "_onMouseLeave",

    "click .close":      "_close",
    "click .content":    "_onClickEdit",
    "click .text":       "_onClickEdit",
    "dblclick .content": "_onDblClick",
    "dblclick .text":    "_onDblClick",

    "keyup .text":       "_onKeyUp",
    "paste .text":       "_onPaste"

  },

  form_data: [{
    name: 'Text',
    form: {
      'font-size':  { type: 'simple_number', value: 12, min: 5, max: 50, inc: 2 },
      'color':      { type: 'color', value: '#FFF', extra: { tick: "left", picker_horizontal_position: "left", picker_vertical_position: "down" }},
      'font-family-name': {
        type: 'select',
        value: "Helvetica",
        extra: ["Helvetica", "Droid Sans", "Vollkorn", "Roboto", "Open Sans"]
      },
      'text-align':      { type: 'text_align', value: 'left' }
    }
  }, {
    name: 'Box',
    form: {
      'box-color':   { type: 'color', value: '#000', extra: { tick: "left", picker_horizontal_position: "left", picker_vertical_position: "down" }},
      'box-opacity': { type: 'simple_opacity', value: .7, min:0, max:1, inc: .1 },
      'box-padding': { type: 'simple_number_with_label', value: 10, min: 5, max: 200, inc: 1, label: "P" }
    }
  }, {
    name: 'Max Width',
    form: {
      'box-width':  { type: 'simple_number', value: 300, min: 50, max: 2000, inc: 10 },
    }
  }],

  initialize: function() {

    _.bindAll(this, "_click", "_close", "_onChangeMode", "_onKeyDown");

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

    var self  = this;
    var extra = this.model.get("extra");

    this.model.set({ text: extra.text }, { silent: true });

    var applyStyle = function() {
      self._applyStyle(true);
    };

    // Binding
    this.model.bind('remove',   this.hide, this);

    this.model.bind('change:style',   applyStyle,            this);
    this.model.bind('change:text',    this._setText,         this);
    this.model.bind('change:display', this._onChangeDisplay, this);
    this.model.bind('change:extra',   this._onChangeExtra,   this);
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

    //cdb.god.trigger("closeDialogs");

    this._savePosition(false);

    this.trigger("clickEdit", this.model, this.form_data);
    this.model.set("selected", true);

  },

  _click: function(e) {

    this._killEvent(e);

    //var isLink = e.target.hasAttribute("href");

    //if (!isLink) {
    //cdb.god.trigger("closeDialogs");
    //}

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
    this._savePosition(true);

  },

  _savePosition: function(editable) {

    var extra = this.model.get("extra");

    var x     = this.model.get("x");
    var y     = this.model.get("y");

    var oldX  = this.$el.position().left;
    var oldY  = this.$el.position().top;

    var portrait_direction  = extra.portrait_dominant_side;
    var landscape_direction = extra.landscape_dominant_side;

    if (y == 0 && portrait_dominant_side == "bottom") oldY = y;
    if (x == 0 && landscape_dominant_side == "right") oldX = x;

    // If we didn't move the overlay
    if (oldX === x && y === oldY || x == 0 && landscape_dominant_side == "right" && y === oldY || y == 0 && portrait_dominant_side == "bottom" && oldX === x) {

      this.$el.addClass("selected");

      if (editable) {
        this.editModel.set("mode", "editable");
        return;

      }

    }

    var x = this.$el.position().left;
    var y = this.$el.position().top;

    var width  = this.$el.width();
    var height = this.$el.height();

    var right  = $(".cartodb-map").width()  - x;
    var bottom = $(".cartodb-map").height() - y;

    var right_position          = right  - width;
    var bottom_position         = bottom - height;

    var map_width               = $(".cartodb-map").width();
    var map_height              = $(".cartodb-map").width();

    var left_percentage         = (x + (width/2))  / map_width  * 100;
    var top_percentage          = (y + (height/2)) / map_height * 100;

    var landscape_dominant_side = x <= right_position ? "left" : "right";
    var portrait_dominant_side  = y <= bottom_position ? "top" : "bottom";

    // Default positions
    extra.default_position        = false;
    extra.landscape_dominant_side = landscape_dominant_side;
    extra.portrait_dominant_side  = portrait_dominant_side;
    extra.top_percentage          = top_percentage;
    extra.left_percentage         = left_percentage;
    extra.right_position          = right_position;
    extra.bottom_position         = bottom_position;
    extra.right                   = right;
    extra.bottom                  = bottom;
    extra.width                   = width;
    extra.height                  = height;

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
    .addClass('animated bounceOut')
    .removeClass('selected');

    callback && _.isFunction(callback) && callback();

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

  _applyStyle: function(save) {

    var style      = this.model.get("style");

    var boxColor   = style["box-color"];
    var boxOpacity = style["box-opacity"];
    var boxWidth   = style["box-width"];
    var boxPadding = style["box-padding"];

    var fontFamily = style["font-family-name"];

    this.$text.css(style);

    this.$el.find(".content").css("padding", boxPadding);
    this.$text.css("font-size", style["font-size"] + "px");
    this.$el.css("z-index", style["z-index"]);

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

    if (save) this.model.save();

  },

  _onChangeSelected: function() {

    var selected = this.model.get("selected");

    if (selected) {

      this.$el.addClass("selected");

    } else {

      this.$el.removeClass("selected");

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
        self.$el.css("width", "auto");

        //var self = this;

        setTimeout(function() {

          var width = self.$el.width();
          var extra = self.model.get("extra");

          extra.width = width;

          self.model.set({ extra: extra }, { silent: true });
          self.model.save();

          self.$text.html(text);

          self.$el.css("width", "auto");

        }, 100);

        self.model.save();
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

  _place: function() {

    var extra = this.model.get("extra");

    if (!extra) return;

    var landscape_dominant_side = extra.landscape_dominant_side;
    var portrait_dominant_side  = extra.portrait_dominant_side;

    if (portrait_dominant_side === 'bottom') {

      this.$el.offset({
        bottom: extra.bottom_position
      });

      this.$el.css({
        top: "auto",
        bottom: extra.bottom_position
      });

    } else {

      this.$el.offset({
        top: this.model.get("y"),
        bottom: "auto"
      });

    }

    if (landscape_dominant_side === 'right') {

      this.$el.offset({
        right: extra.right_position
      });

      this.$el.css({
        left: "auto",
        right: extra.right_position
      });

    } else {

      this.$el.offset({
        left: this.model.get("x"),
        right: "auto"
      });

    }

  },

  _onCloseDialogs: function() {
    this.$el.removeClass('selected');
  },

  render: function() {

    this._place();

    this.$el.append(this.template(this.model.attributes));

    this.$text = this.$el.find(".content div.text");
    var text   = this._transformToMarkdown(this.model.get("text"));

    this.$text.html(text);

    this._applyStyle(false);
    this._onChangeExtra();


    this.$el.addClass(this.model.get("device"));

    cdb.god.unbind("closeDialogs", this._onCloseDialogs, this);
    cdb.god.bind("closeDialogs", this._onCloseDialogs, this);

    return this;

  }

});
