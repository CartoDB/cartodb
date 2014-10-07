cdb.admin.OverlayPropertiesBar =  cdb.core.View.extend({

  className: "overlay-properties",

  events: {

    "click" : "killEvent",

  },

  initialize: function() {

    this._addStyleModel();
    this.model = this.options.model;

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

  _remove: function(a, test) {

    cdb.god.unbind("closeDialogs", this._remove, this);
    this.trigger("remove", this);

  },

  render: function() {

    this._addForm();

    cdb.god.bind("closeDialogs", this._remove, this);

    return this;

  }

});
