var L = require('leaflet');
var PathViewBase = require('./path-view-base');

var PolylineView = PathViewBase.extend({
  _createGeometry: function () {
    return L.polyline([], { color: this.model.get('color') });
  }
});

module.exports = PolylineView;
