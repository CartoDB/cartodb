var L = require('leaflet');
var PathViewBase = require('../base/path-view-base');
var PointView = require('./point-view');
var LeafletPathAdapter = require('./leaflet-path-adapter');

var PolygonView = PathViewBase.extend({
  PointViewClass: PointView,

  _createGeometry: function () {
    var polygon = L.polygon(this.model.getCoordinates(), {
      color: this.model.get('lineColor'),
      weight: this.model.get('lineWeight'),
      opacity: this.model.get('lineOpacity')
    });
    return new LeafletPathAdapter(polygon);
  }
});

module.exports = PolygonView;
