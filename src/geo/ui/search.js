
cdb.geo.ui.Search = cdb.core.View.extend({

  className: 'search_box',

  events: {
    "click input[type='text']":   '_focus',
    "submit form":                '_submit',
    "click":                      '_stopPropagation',
    "dblclick":                   '_stopPropagation',
    "mousedown":                  '_stopPropagation'
  },

  initialize: function() {},

  render: function() {
    this.$el.html(this.options.template(this.options));
    return this;
  },

  _stopPropagation: function(ev) {
    ev.stopPropagation();
  },

  _focus: function(ev) {
    ev.preventDefault();

    $(ev.target).focus();
  },

  _submit: function(ev) {
    ev.preventDefault();

    var self = this;

    var address = this.$('input.text').val();
    cdb.geo.geocoder.YAHOO.geocode(address, function(coords) {
      console.log(self);
      if (coords.length>0) {
        if (coords[0].boundingbox) {
          self.model.set({
            "view_bounds_sw": [coords[0].boundingbox.south,coords[0].boundingbox.west],
            "view_bounds_ne": [coords[0].boundingbox.north,coords[0].boundingbox.east]
          });
        } else if (coords[0].lat && coords[0].lon) {
          self.model.setCenter([coords[0].lat, coords[0].lon]);
          self.model.setZoom(10);  
        }
      }
    });
  }
});