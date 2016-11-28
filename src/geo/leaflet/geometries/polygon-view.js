var L = require('leaflet');
var PathViewBase = require('./path-view-base');

var PolygonView = PathViewBase.extend({
  _createGeometry: function () {
    return L.polygon(this.model.getCoordinates(), {
      color: this.model.get('lineColor'),
      weight: this.model.get('lineWeight'),
      opacity: this.model.get('lineOpacity')
    });
  },

  _getCoordinatesForMiddlePoints: function () {
    var coordinates = this.model.getCoordinates();
    coordinates.push(coordinates[0]);
    return coordinates;
  }
});

module.exports = PolygonView;
