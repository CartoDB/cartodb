/* global google */
var PathViewBase = require('../base/path-view-base');
var PointView = require('./point-view');
var GMapsPathAdapter = require('./gmaps-path-adapter');
var GMapsCoordinates = require('./gmaps-coordinates');

var PolygonView = PathViewBase.extend({
  PointViewClass: PointView,

  _createGeometry: function () {
    var paths = GMapsCoordinates.convertToGMapsCoordinates(this.model.getCoordinates());
    var polygon = new google.maps.Polygon({
      paths: paths,
      strokeColor: this.model.get('lineColor'),
      strokeWeight: this.model.get('lineWeight'),
      strokeOpacity: this.model.get('lineOpacity')
    });

    return new GMapsPathAdapter(polygon);
  }
});

module.exports = PolygonView;
