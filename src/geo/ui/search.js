
cdb.geo.ui.Search = cdb.core.View.extend({

  className: 'cartodb-searchbox',

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

  _showLoader: function() {
    this.$('span.loader').show();
  },

  _hideLoader: function() {
    this.$('span.loader').hide();
  },

  _submit: function(ev) {
    ev.preventDefault();

    var self = this
      , address = this.$('input.text').val();

    // Show geocoder loader
    this._showLoader();
     
    cdb.geo.geocoder.NOKIA.geocode(address, function(coords) {
      if (coords.length>0) {
        var validBBox = true;
        
        // check bounding box is valid
        if(!coords[0].boundingbox || coords[0].boundingbox.south == coords[0].boundingbox.north ||
          coords[0].boundingbox.east == coords[0].boundingbox.west) {
          validBBox = false;
        }

        if (validBBox && coords[0].boundingbox) {
          self.model.setBounds([
            [
              parseFloat(coords[0].boundingbox.south),
              parseFloat(coords[0].boundingbox.west)
            ],
            [
              parseFloat(coords[0].boundingbox.north),
              parseFloat(coords[0].boundingbox.east)
            ]
          ]);
        } else if (coords[0].lat && coords[0].lon) {
          self.model.setCenter([coords[0].lat, coords[0].lon]);
          self.model.setZoom(10);
        }
      }

      // Hide geocoder loader
      self._hideLoader();
    });
  }
});
