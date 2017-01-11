var GeoJSONHelper = require('./geojson-helper');
var GeometryBase = require('./geometry-base');

var DEFAULT_ICON_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWBAMAAAA2mnEIAAAAKlBMVEUAAAD////////////////////////////////e6fPO3+5zo85Cg705fbrPhX3RAAAADXRSTlMAADVBRn6fqLO9weP7Sr4MvgAAAHRJREFUGNNjEEQABhQ2AwNLeEepAwOYzZTR0dHRpgBmW3SAQDOIzdTRuefu6RkdikA2W8eau3fvnupIBLI9Os8C2XdmtADZEd13QWBHK5Bd0QNmn2gHsjt6wewbHWhsZDXIepHNRLYL2Q3IbkNxM5JfsPsXACkGXYWXfeLsAAAAAElFTkSuQmCC';
var MIDDLE_POINT_ICON_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAMAAADzapwJAAAAP1BMVEUAAAArgNVVqv9OleNMkd1KjuJMj+BMlOBZmudYmORTluJTluZ0qupPlOFtp+hdm+aZwu9HjuDp8vv7/f39//2ENvQ5AAAAFXRSTlMABgYkJTQ5OT9DUFBsbm5wcHNzc3NuwP+LAAAAZ0lEQVR42r2PRw7AIAwETcCQYkL9/1sTgUKLxJE5jlZrL6xgE4hiG63UZC1p2dvD+fjizdlaZUJMBNfkmU7ZlNe1n1MskCgabdUW5/pfMj8Jyn0Pmm7Qdec5bocOlccrGGAckTNYwAMlgQk+DTSqnAAAAABJRU5ErkJggg==';

var Point = GeometryBase.extend({
  defaults: {
    editable: false,
    expandable: false,
    iconUrl: DEFAULT_ICON_URL,
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
}, {
  DEFAULT_ICON_URL: DEFAULT_ICON_URL,
  MIDDLE_POINT_ICON_URL: MIDDLE_POINT_ICON_URL
});

module.exports = Point;
