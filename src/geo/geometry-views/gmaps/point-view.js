/* global google */
var PointViewBase = require('../base/point-view-base.js');
var GMapsMarkerAdapter = require('./gmaps-marker-adapter');

var PointView = PointViewBase.extend({
  _createMarker: function () {
    var position = new google.maps.LatLng(this.model.getCoordinates()[0], this.model.getCoordinates()[1]);
    var icon = {
      url: this.model.get('iconUrl'),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(this.model.get('iconAnchor')[0], this.model.get('iconAnchor')[1])
    };

    var marker = new google.maps.Marker({
      position: position,
      icon: icon,
      draggable: this.model.isEditable(),
      crossOnDrag: false
    });

    // iconAnchor: this.model.get('iconAnchor')

    return new GMapsMarkerAdapter(marker);
  }
});

module.exports = PointView;
