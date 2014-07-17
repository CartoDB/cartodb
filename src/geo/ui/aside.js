cdb.geo.ui.Aside = cdb.core.View.extend({

  className: "cartodb-aside",

  initialize: function() {

  },

  render: function() {

    this.$el.html(this.options.template(this.model.attributes));

    return this;

  }
});
