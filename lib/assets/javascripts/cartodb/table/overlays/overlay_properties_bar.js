cdb.admin.OverlayPropertiesBar =  cdb.core.View.extend({

  className: "overlay-properties",

  events: {
  },

  initialize: function() {

    this._addStyleModel();

  },

  /* Defines model for the popup form */

  _addStyleModel: function() {

    this.style = new cdb.core.Model();

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
      self.trigger("saved", self)
    });

    this.addView(this.form);
    this.$el.append(this.form.render().$el);

  },

  render: function() {

    this._addForm();

    return this;

  }

});
