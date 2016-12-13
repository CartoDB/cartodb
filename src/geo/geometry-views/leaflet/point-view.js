var L = require('leaflet');
var PointViewBase = require('../base/point-view-base.js');
var LeafletMarkerAdapter = require('./leaflet-marker-adapter');

var PointView = PointViewBase.extend({
  _createMarker: function () {
    var isEditable = this.model.isEditable();
    var icon = L.icon({
      iconUrl: this.model.get('iconUrl'),
      iconAnchor: this.model.get('iconAnchor')
    });

    var marker = L.marker(this.model.get('latlng'), {
      icon: icon,
      draggable: !!isEditable
    });
    return new LeafletMarkerAdapter(marker);
  }
});

module.exports = PointView;
