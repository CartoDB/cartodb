var L = require('leaflet');
var PathViewBase = require('../base/path-view-base');
var PointView = require('./point-view');
var LeafletPathAdapter = require('./leaflet-path-adapter');

var PolylineView = PathViewBase.extend({
  PointViewClass: PointView,

  _createGeometry: function () {
    var polyline = L.polyline(this.model.getCoordinates(), {
      color: this.model.get('lineColor'),
      weight: this.model.get('lineWeight'),
      opacity: this.model.get('lineOpacity')
    });
    return new LeafletPathAdapter(polyline);
  }
});

module.exports = PolylineView;
