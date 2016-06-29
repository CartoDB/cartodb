cdb.admin.OverlayPropertiesActions =  cdb.core.View.extend({

  events: {

    "click .btn-copy":      "_onClickCopy",
    "click .btn-delete":    "_onClickDelete",
    "click .btn-zIndexInc": "_onClickZIndexInc",
    "click .btn-zIndexDec": "_onClickZIndexDec"

  },

  initialize: function() {

    this.template_base = cdb.templates.getTemplate(this.options.template_base);

  },

  _onClickCopy: function(e) {

    this.killEvent(e);
    this.trigger("copy-overlay", this);

  },

  _onClickDelete: function(e) {

    e.preventDefault();
    this.trigger("delete-overlay", this);

  },

  _onClickZIndexInc: function(e) {

    this.killEvent(e);
    this.trigger("increase-zindex", this);

  },

  _onClickZIndexDec: function(e) {

    this.killEvent(e);
    this.trigger("decrease-zindex", this);

  },

  _enableTipsy: function() {

    var self = this;

    _.each(this.$("a[title]"), function(el){
      var tooltip = new cdb.common.TipsyTooltip({
        el: $(el)
      });

      self.addView(tooltip);

    });

  },
  render: function() {
    this.clearSubViews();
    this.setElement(this.template_base(this.options));
    this._enableTipsy();

    return this;
  }

});

cdb.admin.OverlayPropertiesBar =  cdb.core.View.extend({

  className: "overlay-properties",

  events: {

    "click" : "killEvent",

  },

  initialize: function() {

    this.overlays = this.options.overlays;

    this._setupModel();
    this._addStyleModel();

  },

  _setupModel: function() {

    this.model = this.options.model;
    this.model.bind("remove", this._remove, this);

  },

  _addStyleModel: function() {

    this.style = new cdb.core.Model(this.model.get("style"));

    this.style.unbind("change", this._setStyle, this);
    this.style.bind("change", this._setStyle, this); // every time the style changes, store it back in the main model

  },

  _setStyle: function() {
    this.model.set("style", this.style.toJSON());
  },

  _addForm: function() {

    var self = this;

    if (!this.form) {

      this.form = new cdb.forms.Form({
        form_data: this.options.form_data,
        model: this.style
      }).on("saved", function() {
        self.trigger("saved", self);
      });

      this.addView(this.form);
      this.$el.append(this.form.render().$el);

    }

  },

  _addActions: function() {

    var self = this;

    if (!this.actions && !this.options.hide_actions) {

      this.actions = new cdb.admin.OverlayPropertiesActions({
        template_base: "table/views/overlays/overlay_properties_actions",
        model: this.model
      }).on("copy-overlay", function() {
        self.trigger("copy-overlay", self.model, self);
      }).on("delete-overlay", function() {
        self.overlays.remove(self.model);
      }).on("decrease-zindex", function() {
        self._decreaseOverlayZIndex(self.model);
      }).on("increase-zindex", function() {
        self._increaseOverlayZIndex(self.model);
      }).on("saved", function() {
        self.trigger("saved", self);
      });

      this.addView(this.actions);
      this.$el.find("> ul").append(this.actions.render().$el);

    }

  },

  _decreaseOverlayZIndex: function(model) {

    var canvas_mode = this.options.canvas.get("mode");
    var indexes = this.overlays.getOverlaysZIndex(canvas_mode);
    var zIndex   = _.min(indexes);

    var style = _.clone(model.get("style"));
    if (zIndex > 1) {
      style["z-index"] = zIndex - 1;
    }
    this.style.set(style);
  },

  _increaseOverlayZIndex: function(model) {

    var canvas_mode = this.options.canvas.get("mode");
    var indexes = this.overlays.getOverlaysZIndex(canvas_mode);
    var zIndex   = _.max(indexes);

    var style = _.clone(model.get("style"));
    style["z-index"] = zIndex + 1;
    this.style.set(style);
  },

  _remove: function(a, test) {

    cdb.god.unbind("closeDialogs", this._remove, this);
    this.trigger("remove", this);

  },

  deselectOverlay: function() {

    this.model.set("selected", false);

  },

  compareModel: function(model) {
    return model && this.model === model;
  },

  render: function() {

    this._addForm();
    this._addActions();

    cdb.god.bind("closeDialogs", this._remove, this);

    return this;

  }

});
