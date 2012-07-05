
cdb.admin.MapTab = cdb.core.View.extend({

  className: 'map',

  initialize: function() {
    this.map = this.model;
    this.map_enabled = false;
  },

  enableMap: function() {
    if(!this.map_enabled) {
        var div = $('<div>');
        div.css({'height': '100%'});
        this.$el.append(div);
        this.mapView = new cdb.geo.LeafletMapView({
          el: div,
          map: this.map
        });
        this.map_enabled = true;
    }
  },

  render: function() {
    this.$el.css({'height': '900px'});
    return this;
  }

});

