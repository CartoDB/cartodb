cdb.admin.OverlayPropertiesActions =  cdb.core.View.extend({

  events: {
  
    "click .btn-copy": "_onClickCopy",
    "click .btn-delete": "_onClickDelete"

  },

  initialize: function() {

    this.template_base = cdb.templates.getTemplate(this.options.template_base);

  },

  _onClickCopy: function(e) {

    this.killEvent(e);
    this.trigger("copy-overlay", this);

  },

  _onClickDelete: function(e) {

    this.killEvent(e);
    this.trigger("delete-overlay", this);

  },

  render: function() {

    this.setElement(this.template_base(this.options));

    return this;

  }

});

cdb.admin.OverlayPropertiesBar =  cdb.core.View.extend({

  className: "overlay-properties",

  events: {

    "click" : "killEvent",

  },

  initialize: function() {

    this._addStyleModel();
    this.model = this.options.model;
    this.model.bind("remove", this._remove, this);

  },

  /* Defines model for the popup form */

  _addStyleModel: function() {

    this.style = new cdb.core.Model(this.model.get("style"));

    /* Everytime the style changes, store it back in the main model */
    this.style.bind("change", function() {
      this.model.set("style", this.style.toJSON());
    }, this);

  },

  _addForm: function() {

    var self = this;

    this.form = new cdb.forms.Form({
      form_data: this.options.form_data,
      model: this.style
    }).on("saved", function() {
      self.trigger("saved", self);
    });

    this.addView(this.form);
    this.$el.append(this.form.render().$el);

  },

  _addActions: function() {

    var self = this;

    this.actions = new cdb.admin.OverlayPropertiesActions({
      template_base: "table/views/overlays/overlay_properties_actions",
      model: this.model
    }).on("copy-overlay", function() {
      self.trigger("copy-overlay", self.model, self);
    }).on("delete-overlay", function() {
      self.trigger("delete-overlay", self.model, self);
    }).on("saved", function() {
      self.trigger("saved", self);
    });

    this.addView(this.actions);
    this.$el.find("ul").append(this.actions.render().$el);

  },

  _remove: function(a, test) {

    cdb.god.unbind("closeDialogs", this._remove, this);
    this.trigger("remove", this);

  },

  render: function() {

    this._addForm();
    this._addActions();

    cdb.god.bind("closeDialogs", this._remove, this);

    return this;

  }

});
