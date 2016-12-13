/* global google */
var PathViewBase = require('../base/path-view-base');
var PointView = require('./point-view');
var GMapsPathAdapter = require('./gmaps-path-adapter');
var GMapsCoordinates = require('./gmaps-coordinates');

var PolylineView = PathViewBase.extend({
  PointViewClass: PointView,

  _createGeometry: function () {
    var path = GMapsCoordinates.convertToGMapsCoordinates(this.model.getCoordinates());
    var polyline = new google.maps.Polyline({
      path: path,
      strokeColor: this.model.get('lineColor'),
      strokeWeight: this.model.get('lineWeight'),
      strokeOpacity: this.model.get('lineOpacity')
    });

    return new GMapsPathAdapter(polyline);
  }
});

module.exports = PolylineView;
