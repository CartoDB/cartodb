
cdb.geo.ui.Search = cdb.core.View.extend({

  className: 'search_box',

  events: {
    "submit input.text": '_stopPropagation'
  },

  initialize: function() {},

  render: function() {
    this.$el.html(this.options.template(this.options));
    return this;
  },

  _stopPropagation: function(ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }
});
