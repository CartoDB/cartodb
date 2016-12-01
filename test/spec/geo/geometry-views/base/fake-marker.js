var Backbone = require('backbone');

var FakeMarker = Backbone.Model.extend({
  getCoordinates: function () {
    var latlng = this.get('latlng');
    return {
      lat: latlng[0],
      lng: latlng[1]
    };
  },

  setCoordinates: function (coordinates) {
    this.set('latlng', coordinates);
  },

  isDraggable: function () {
    return this.get('isDraggable');
  },

  getIconURL: function () {
    return this.get('iconURL');
  },

  setIconURL: function (url) {
    return this.set('iconURL', url);
  }
});

module.exports = FakeMarker;
