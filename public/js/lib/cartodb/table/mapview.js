
cdb.admin.MapTab = cdb.core.View.extend({

  className: 'map',

  initialize: function() {
    this.map = this.model;
  },

  enableMap: function() {
    var div = $('<div>');
    div.css({'height': '100%'});
    this.$el.append(div);
    this.mapView = new cdb.geo.LeafletMapView({
      el: div,
      map: this.map
    });
  },

  render: function() {
    this.$el.css({'height': '700px'});
    return this;
  }

});

