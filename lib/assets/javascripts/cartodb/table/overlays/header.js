cdb.admin.overlays.Header = cdb.admin.overlays.Text.extend({

  className: "header overlay-static",

  template_name: 'table/views/overlays/header',

  events: { },

  _close:             function() { },
  _applyStyle:        function() { },
  _onChangeMode:      function() { },
  _enableEditingMode: function() { },
  _onMouseLeave:      function() { },
  _onMouseEnter:      function() { },
  _onKeyUp:           function() { },
  _onKeyDown:         function() { },

  initialize: function() {

    _.bindAll(this, "_close", "_dblClick", "_onChangeMode", "_onKeyDown");

    // Bind ESC key
    $(document).bind('keydown', this._onKeyDown);

    this.template = this.getTemplate(this.template_name);

    this._setupModel();

  },

  _setupModel: function() {

    this.model = this.options.model;

    this.model.set({ mode: "" }, { silent: true })

    this.model.bind('change:show_title',        this._onChangeShowTitle,  this);
    this.model.bind('change:show_description',  this._onChangeShowDescription,  this);

    this.model.bind('change:style',             this._applyStyle, this);
    this.model.bind("change:display",           this._onChangeDisplay, this);
    this.model.bind('change:title',             this._onChangeTitle,  this);
    this.model.bind('change:description',       this._onChangeDescription,  this);
    this.model.bind('change:mode',              this._onChangeMode,  this);
    this.model.bind("change:y",                 this._onChangeY, this);

    this.model.on("destroy", function() {
      this.$el.remove();
    }, this);

  },

  isVisible: function() {

    return (this.model.get("title") && this.model.get("show_title")) || (this.model.get("description") && this.model.get("show_description"));

  },

  _dblClick: function(e) {

    this._killEvent(e);

  },

  _onChangeShowDescription: function() {

    var self = this;

    var display         = this.model.get("display");
    var showTitle       = this.model.get("title") && this.model.get("show_title");
    var showDescription = this.model.get("description") && this.model.get("show_description");
    var extra           = this.model.get("extra");

    extra["show_description"] = this.model.get("show_description");

    if (display && showDescription) {

      this.$el.show();
      this.$description.show();

      this.trigger("change_y");

    } else {

      this.$description.hide();
      if (!showTitle) this.$el.hide();

      this.trigger("change_y");

    }

    this.model.set({ extra: extra }, { silent: true });

  },

  _onChangeY: function() {

    var y = this.model.get("y");
    this.$el.animate({ top: y }, 150);

  },

  _onChangeDisplay: function() {

    var display = this.model.get("display");

    if (display) {
      this.show();
    } else {
      this.$el.hide();
    }

  },

  _onChangeShowTitle: function() {

    var self = this;

    var display         = this.model.get("display");
    var showTitle       = this.model.get("title") && this.model.get("show_title");
    var showDescription = this.model.get("description") && this.model.get("show_description");

    var extra           = this.model.get("extra");
    extra["show_title"] = this.model.get("show_title");

    if (display && showTitle) {

      this.$el.show();
      this.$title.show();

      this.trigger("change_y");

    } else {

      this.$title.hide();

      if (!showDescription) {
        this.$el.hide();
      }

      this.trigger("change_y");

    }

    this.model.set({ extra: extra }, { silent: true });

  },

  _onChangeTitle: function() {
    this.$el.find(".title").html(this.model.get("title"));

    var extra = this.model.get("extra");
    extra.title = this.model.get("title");
    this.model.set({ extra: extra }, { silent: true });

    this.show();
  },

  _onChangeDescription: function() {
    var description = this.model.get("description");
    var show_description = true;

    if (!description || !description.trim().length) {
      show_description = false;
    }

    this.$(".description").html(
      this._getMarkdown(description)
    );

    var extra = this.model.get("extra");

    extra.description = description;

    this.model.set({ extra: extra, show_description: show_description }, { silent: true });

    this.show();
  },

  show: function() {
    var display        = this.model.get("display");
    var hasTitle       = this.model.get("title") && this.model.get("show_title");
    var hasDescription = this.model.get("description") && this.model.get("show_description");

    if (display && (hasTitle || hasDescription)) {

      this.$el.show();

      if (hasTitle)       this.$title.show();
      if (hasDescription) this.$description.show();

      this.trigger("change_y");
    }
  },

  hide: function() {},

  _getMarkdown: function(content) {

    content = cdb.Utils.stripHTML(content);
    content = markdown.toHTML(content);
    content = cdb.Utils.stripHTML(content, '<a><i><em><strong><b><u><s>');
    content = content.replace(/&#39;/g, "'"); // replaces single quote

    return cdb.core.sanitize.html(content);

  },

  render: function() {

    this.$el.offset({
      top:  this.model.get("y"),
      left: this.model.get("x")
    });

    this.extra = this.model.get("extra");

    this.model.set({
      title:            this.extra.title,
      description:      this.extra.description,
      show_title:       this.extra.show_title,
      show_description: this.extra.show_description
    }, { silent: true });

    var attributes = _.chain(this.model.attributes)
      .clone()
      .extend({
        description: this._getMarkdown(this.model.get("description"))
      })
      .value();

    this.$el.append(this.template(attributes));

    this.$title       = this.$el.find(".content div.title");
    this.$description = this.$el.find(".content div.description");

    this._onChangeDisplay();

    return this;
  }

});
