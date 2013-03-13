
cdb.geo.ui.Header = cdb.core.View.extend({

  className: 'cartodb-header',

  initialize: function() {},

  render: function() {
    this.$el.html(this.options.template(this.options));
    return this;
  }
});
