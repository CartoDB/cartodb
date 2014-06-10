cdb.admin.widgets.Header= cdb.admin.widgets.Text.extend({

  className: "header static",

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

    this.template = this.getTemplate('table/views/widgets/title');

    this._setupModel();

  },

  _setupModel: function() {

    this.model = this.options.model;
    this.model.set({ mode: "" }, { silent: true })

    this.model.bind('change:show_title',        this._onChangeShowTitleOrDescription,  this);
    this.model.bind('change:show_description',  this._onChangeShowTitleOrDescription,  this);

    this.model.bind('change:text',        this._setText,  this);
    this.model.bind('change:extra',       this._onChangeExtra, this);
    this.model.bind('change:style',       this._applyStyle, this);
    this.model.bind('change:display',     this._onChangeDisplay, this);
    this.model.bind('change:title',       this._onChangeTitle,  this);
    this.model.bind('change:description', this._onChangeDescription,  this);
    this.model.bind('change:mode',        this._onChangeMode,  this);

  },

  _onChangeShowTitleOrDescription: function() {

    var extra                 = this.model.get("extra");
    extra["show_title"]       = this.model.get("show_title");
    extra["show_description"] = this.model.get("show_description");

    this.model.set({ extra: extra });
    this._onChangeExtra();

  },

  _onChangeTitle: function() {

    this.$el.find(".title .title").html(this.model.get("title"));

  },

  _onChangeDescription: function() {
    this.$el.find(".description").html(this.model.get("description"));
  },

  // Element events 

  _onKeyUp: function(e) {

    var self = this;

    var temp      = "";
    var domString = "";

    if (this.timeout)      clearTimeout(this.timeout);
    if (this.keyUpTimeout) clearTimeout(this.keyUpTimeout);

    var value = this.$title.html();

    if (cdb.Utils.stripHTML(value) == "") {

      this.keyUpTimeout = setTimeout(function() {

        self.model.set({ text: "" }, { silent: true });
        self._close();

      }, 600);

    } else {

      this.model.set({ text: value }, { silent: true });

    }

  },

  _onKeyDown: function(e) {

    if (e.keyCode === 27) {
      this.model.set("mode", "");
    }

  },
  show: function() {

    var display = this.model.get("display");

    if (display) this.$el.show();

  },

  hide: function(callback) {

    var self = this;

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

    var extra      = this.model.get("extra");
    console.log(extra)

    if (extra["show_title"]) this.$title.fadeIn(150);
    else this.$title.fadeOut(150);

    if (extra["show_description"]) this.$description.fadeIn(150);
    else this.$description.fadeOut(150);

  },

  /*
   * Applies style to the content of the widget
   */

  _applyStyle: function() {

    var style      = this.model.get("style");
    var display    = this.model.get("display");

    if (!display) this.$el.addClass("hidden");
    else this.$el.removeClass("hidden");

    var boxColor   = style["box-color"];
    var boxOpacity = style["box-opacity"];

    this.$title.css(style);
    this.$title.css("font-size", style["font-size"] + "px");

    this.$description.css(style);
    this.$description.css("font-size", style["font-size"] + "px");

    var rgbaCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
    + ',' + parseInt(boxColor.slice(-4,-2),16)
    + ',' + parseInt(boxColor.slice(-2),16)
    +', ' + boxOpacity + ' )';

    this.$el.css("background-color", rgbaCol);

  },

  _onChangeDisplay: function() {

    var display = this.model.get("display");

    if (display) this.$el.fadeIn(150);
    else this.$el.fadeOut(150);

  },

  _onChangeMode: function() {

    var mode = this.model.get("mode");

    if (mode == "editable") {

      this._enableEditingMode();

    } else {

      this.$el.removeClass("editable").removeClass("disabled");
      this.$title.attr("contenteditable", false);

    }

  },

  _enableEditingMode: function() {

    this.$el.addClass("editable").addClass("disabled");
    this.$title.attr("contenteditable", true).focus();

  },

  _setText: function() {

    var text = this.model.get("text");

    if (text) this.$title.html(text);

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
          'font-family': {
            type: 'select',
            value: "Helvetica",
            extra: ["Helvetica", "DejaVu Sans Book","unifont Medium", "Open Sans"]
          }
        }
      }, {

        name: 'Box Style',
        form: {
          'box-color':  { type: 'color', value: '#000' },
          'box-opacity':  { type: 'simple_opacity', value: .7, min:0, max:1, inc: .1 },
        }
      }]

    });

    this._bindDropdown();

    this.$el.append(this.dropdown.render().el);

    cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);

  },

  _putOnTop: function() { }, 

  render: function() {

    var self = this;

    this.$el.offset({
      left: this.model.get("x"),
      top:  this.model.get("y")
    });

    this.$el.append(this.template(this.model.attributes));

    this.$title = this.$el.find(".content div.title");
    this.$description = this.$el.find(".content div.description");

    this._applyStyle();
    this._onChangeExtra();
    this._addDropdown();

    return this;

  }

});
