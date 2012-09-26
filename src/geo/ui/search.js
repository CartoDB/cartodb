
cdb.geo.ui.Search = cdb.core.View.extend({

  className: 'search_box',

  events: {
    "submit form": '_stopPropagation'
  },

  initialize: function() {},

  render: function() {
    this.$el.html(this.options.template(this.options));
    return this;
  },

  _stopPropagation: function(ev) {
    var self = this;

    var address = this.$('input.text').val();
    cdb.geo.geocoder.YAHOO.geocode(address, function(coords) {
      if(coords) {
        self.model.setCenter([coords[0].lat, coords[0].lon]);
        self.model.setZoom(10);
      }
    });
    ev.preventDefault();
    ev.stopPropagation();
  }
});
