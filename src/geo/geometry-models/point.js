var GeoJSONHelper = require('./geojson-helper');
var GeometryBase = require('./geometry-base');

var Point = GeometryBase.extend({
  defaults: {
    editable: false,
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWBAMAAAA2mnEIAAAAKlBMVEUAAAD////////////////////////////////e6fPO3+5zo85Cg705fbrPhX3RAAAADXRSTlMAADVBRn6fqLO9weP7Sr4MvgAAAHRJREFUGNNjEEQABhQ2AwNLeEepAwOYzZTR0dHRpgBmW3SAQDOIzdTRuefu6RkdikA2W8eau3fvnupIBLI9Os8C2XdmtADZEd13QWBHK5Bd0QNmn2gHsjt6wewbHWhsZDXIepHNRLYL2Q3IbkNxM5JfsPsXACkGXYWXfeLsAAAAAElFTkSuQmCC',
    iconAnchor: [ 11, 11 ]
  },

  getCoordinates: function () {
    return this.get('latlng');
  },

  setCoordinates: function (latlng) {
    this.set('latlng', latlng);
  },

  update: function (latlng) {
    if (!this.get('latlng')) {
      this.setCoordinates(latlng);
    }
  },

  isComplete: function () {
    return !!this.get('latlng');
  },

  toGeoJSON: function () {
    var coords = GeoJSONHelper.convertLatLngsToGeoJSONPointCoords(this.getCoordinates());
    return {
      'type': 'Point',
      'coordinates': coords
    };
  },

  getCoordinatesFromGeoJSONCoords: function (geoJSON) {
    return GeoJSONHelper.getPointLatLngFromGeoJSONCoords(geoJSON);
  }
});

module.exports = Point;
