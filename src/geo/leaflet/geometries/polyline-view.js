var L = require('leaflet');
var PathViewBase = require('./path-view-base');

var PolylineView = PathViewBase.extend({
  _createGeometry: function () {
    return L.polyline(this.model.getCoordinates(), {
      color: this.model.get('lineColor'),
      weight: this.model.get('lineWeight'),
      opacity: this.model.get('lineOpacity')
    });
  }
});

module.exports = PolylineView;
