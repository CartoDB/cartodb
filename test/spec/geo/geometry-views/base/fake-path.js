var _ = require('underscore');
var Backbone = require('backbone');

var FakePath = Backbone.Model.extend({
  getCoordinates: function () {
    return _.map(this.get('latlngs'), function (latlng) {
      return { lat: latlng[0], lng: latlng[1] };
    });
  },

  setCoordinates: function (coordinates) {
    this.set('latlngs', coordinates);
  },

  isDraggable: function () {
    return this.get('isDraggable');
  }
});

module.exports = FakePath;
