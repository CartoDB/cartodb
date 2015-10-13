cdb.Widget.ListItemView = cdb.core.View.extend({

  options: {
    template: ''
  },

  render: function() {
    this.$el.html(
      _.template(this.options.template)(this.model.toJSON())
    );
    return this;
  }

});
