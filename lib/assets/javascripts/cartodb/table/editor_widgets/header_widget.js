cdb.admin.widgets.Title = cdb.admin.widgets.Text.extend({

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

    if (extra["show_title"]) {
      this.trigger("show_title", this);
    } else {
      this.trigger("hide_title", this);
    }

    if (extra["show_description"]) {
      this.trigger("show_description", this);
    } else {
      this.trigger("hide_description", this);
    }

    if (!extra["show_title"] && !extra["show_description"]) {
      this.trigger("hidden", this);
    }

    this.model.set({ extra: extra });
    this._onChangeExtra();

  },

  _onChangeTitle: function() {

    this.$el.find(".title").html(this.model.get("title"));
    this.model.save();

  },

  _onChangeDescription: function() {

    this.$el.find(".description").html(this.model.get("description"));
    this.model.save();

  },

  // Element events

  _onKeyUp: function(e) {

    var self = this;

    var temp      = "";
    var domString = "";

    if (this.timeout)      clearTimeout(this.timeout);
    if (this.keyUpTimeout) clearTimeout(this.keyUpTimeout);

    var value      = this.$title.html();
    var cleanValue = cdb.Utils.stripHTML(value);

    if (cleanValue == "") {

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
      this.model.set({ mode: "" });
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

    this.hide(function() {
      self.trigger("remove", self);
    });

  },

  _onChangeExtra: function() {

    var extra = this.model.get("extra");

    if (extra["show_title"]) this.$title.fadeIn(150);
    else this.$title.fadeOut(150);

    if (extra["show_description"]) this.$description.fadeIn(150);
    else this.$description.fadeOut(150);

  },

  /*
   * Applies style to the content of the widget
   */

  _applyStyle: function() { },

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

  _onMouseLeave: function() { },
  _onMouseEnter: function() { },
  _putOnTop:     function() { },

  render: function() {

    var self = this;

    this.$el.offset({
      top:  this.model.get("y"),
      left: this.model.get("x")
    });

    var extra = this.model.get("extra");

    this.model.set({

      title:            this.model.get("title"),
      description:      this.model.get("description"),
      show_title:       extra.show_title,
      show_description: extra.show_description

    }, { silent: true });

    this.$el.append(this.template(this.model.attributes));

    this.$title       = this.$el.find(".content div.title");
    this.$description = this.$el.find(".content div.description");

    this._applyStyle();
    this._onChangeExtra();

    return this;

  }

});
