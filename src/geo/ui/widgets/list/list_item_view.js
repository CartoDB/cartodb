cdb.geo.ui.Widget.ListItemView = cdb.core.View.extend({

  options: {
    template: ''
  },

  tagName: 'li',
  className: 'Widget-listItem Widget-listItem--withBorders',

  render: function() {
    this.$el.html(
      _.template(this.options.template)(this.model.toJSON())
    );
    return this;
  }

});
