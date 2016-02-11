cdb.admin.overlays.Header = cdb.admin.overlays.Text.extend({

  className: "header overlay-static overlay",

  template_name: 'table/views/overlays/header',

  events: {

    "mouseenter .text":  "_onMouseEnter",

    "click":             "_onClickEdit",
    "dblclick":          "_onDblClick",

    "keyup .text":       "_onKeyUp",
    "paste .text":       "_onPaste"

  },

  form_data: [{
    name: 'Text',
    form: {
      'font-size':  { type: 'simple_number', value: 12, min: 5, max: 50, inc: 2, disable_triggering: true },
      'color':      { type: 'color', value: '#FFF', extra: { tick: "left", picker_horizontal_position: "left", picker_vertical_position: "down" }},
      'font-family-name': {
        type: 'select',
        value: "Helvetica",
        extra: ["Helvetica", "Droid Sans", "Vollkorn", "Roboto", "Open Sans", "Lato", "Graduate", "Gravitas One", "Old Standard TT"]

      },
      'text-align':      { type: 'text_align', value: 'left' }
    }
  }, {
    name: 'Box',
    form: {
      'box-color':   { type: 'color', value: '#000', extra: { tick: "left", picker_horizontal_position: "left", picker_vertical_position: "down" }},
      'box-opacity': { type: 'simple_opacity', value: 0.7, min:0, max:1, inc: 0.1, disable_triggering: true },
      'box-padding': { type: 'simple_number_with_label', value: 10, min: 5, max: 200, inc: 1, label: "P", disable_triggering: true }
    }
  }],

  initialize: function() {

    _.bindAll(this, "_close", "_onChangeMode", "_onKeyDown");

    this.template = this.getTemplate(this.template_name);

    this._setupModels();

    var extra = this.model.get("extra");
    this.$el.addClass(extra.headerType);
  },

  isVisible: function() { return this.model.get("display"); },

  _onChangeDisplay: function() {

    var display = this.model.get("display");

    if (display) {
      this.show();
    } else {
      this.$el.hide();
    }
  },

  show: function() {
    var display = this.model.get("display");
    if (display) {
      this.$el.show();
      this.trigger("change_y");
    }
  },

  _onChangeY: function() {

    var y = this.model.get("y");
    this.$el.animate({ top: y }, 150);

    this.trigger("change_y", this);

  },

  render: function() {
    this._place();

    this.$el.append(this.template(this.model.attributes));

    this.$text = this.$(".content div.text");
    var text   = this._transformToMarkdown(this.model.get("text"));

    this.$text.html(text);

    this._applyStyle(false);
    this._onChangeExtra();

    this.$el.addClass(this.model.get("device"));

    this._onChangeDisplay();

    cdb.god.unbind("closeDialogs", this._onCloseDialogs, this);
    cdb.god.bind("closeDialogs", this._onCloseDialogs, this);

    this.trigger("change_height", this);
    return this;
  },

  // Setup the internal and custom model
  _setupModels: function() {

    var self  = this;
    var extra = this.model.get("extra");

    this.model.set({ text: extra.text }, { silent: true });

    var applyStyle = function() {
      self._applyStyle(true);
      this.trigger("change_height", this);
    };

    // Binding
    this.model.bind('remove',   this.hide, this);

    this.model.bind('change:style',    applyStyle,            this);
    this.model.bind('change:text',     this._setText,         this);
    this.model.bind('change:display',  this._onChangeDisplay, this);
    this.model.bind('change:extra',    this._onChangeExtra,   this);
    this.model.bind('change:selected', this._onChangeSelected, this);
    this.model.bind("change:y",        this._onChangeY, this);

    // Internal model to store the editing state
    this.editModel = new cdb.core.Model({ mode: "" });
    this.editModel.bind('change:mode', this._onChangeMode, this);

    this.add_related_model(this.editModel);

  },

  _setText: function() {

    var text          = this.model.get("text");
    var rendered_text = this._transformToMarkdown(text);

    var extra = this.model.get("extra");

    extra.text          = text;
    extra.rendered_text = rendered_text;

    this.model.set({ extra: extra }, { silent: true });

    if (rendered_text) {
      this.$text.html(rendered_text);
    }

    this.trigger("change_height", this);

  },

  _onClickEdit: function(e) {

    this.killEvent(e);

    cdb.god.trigger("closeOverlayDropdown");

    $(document).bind('keydown', this._onKeyDown);

    this._savePosition(false);

    this.trigger("clickEdit", this.model, this.form_data);

    this.model.set("selected", true);

  },

  _enableEditingMode: function() {

    this.$el
    .addClass("editable")
    .addClass("disabled");

    this.$text.attr("contenteditable", true).focus();

    var style = this.model.get("style");
    var text = this.model.get("text");

    this.$text.html(text);
    var self = this;
    this.$(".hint").fadeIn(150, function() {
      self.trigger("change_height", self);
    });

  },

  _disableEditingMode: function() {

    $(document).unbind('keydown', this._onKeyDown);

    var text = this._transformToMarkdown(this.model.get("text"));

    this.editModel.set("mode", "");

    if (!this._isEmptyText(text)) {

      var self = this;

      self.$(".hint").fadeOut(150, function() {

        self.$el
        .removeClass("editable")
        .removeClass("disabled");

        self.$text.attr("contenteditable", false);

        setTimeout(function() {

          if (!self.model.isNew()) {
            self.model.save();
          }

          self.$text.html(text);
          self.trigger("change_height", self);

        }, 100);

        if (!self.model.isNew()) {
          self.model.save();
        }

      });

    } else {
      this._close();
    }
  },
  /*
   * Applies style to the content of the widget
   */
  _applyStyle: function(save) {

    var style      = this.model.get("style");

    var boxColor   = style["box-color"];
    var boxOpacity = style["box-opacity"];
    var boxPadding = style["box-padding"];

    var fontFamily = style["font-family-name"];

    this.$text.css(style);

    this.$(".content").css("padding", boxPadding);
    this.$text.css("font-size", style["font-size"] + "px");
    this.$el.css("z-index", style["z-index"]);

    var rgbaCol = ('rgba(' + parseInt(boxColor.slice(-6,-4),16)
      + ',' + parseInt(boxColor.slice(-4,-2),16)
      + ',' + parseInt(boxColor.slice(-2),16)
      +', ' + boxOpacity + ' )'
    );

    this.$el.css("background-color", rgbaCol);

    var fontFamilyClass = "";

    if      (fontFamily  == "Droid Sans")       fontFamilyClass = "droid";
    else if (fontFamily  == "Vollkorn")         fontFamilyClass = "vollkorn";
    else if (fontFamily  == "Open Sans")        fontFamilyClass = "open_sans";
    else if (fontFamily  == "Roboto")           fontFamilyClass = "roboto";
    else if (fontFamily  == "Lato")             fontFamilyClass = "lato";
    else if (fontFamily  == "Graduate")         fontFamilyClass = "graduate";
    else if (fontFamily  == "Gravitas One")     fontFamilyClass = "gravitas_one";
    else if (fontFamily  == "Old Standard TT")  fontFamilyClass = "old_standard_tt";

    this.$el
    .removeClass("droid")
    .removeClass("vollkorn")
    .removeClass("roboto")
    .removeClass("open_sans")
    .removeClass("lato")
    .removeClass("graduate")
    .removeClass("gravitas_one")
    .removeClass("old_standard_tt");

    this.$el.addClass(fontFamilyClass);

    if (save) this.model.save();
  },

});
