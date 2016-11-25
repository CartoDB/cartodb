var GeoJSONHelper = require('./geojson-helper');
var GeometryBase = require('./geometry-base');

var DEFAULT_ICON_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWBAMAAAA2mnEIAAAAKlBMVEUAAAD////////////////////////////////e6fPO3+5zo85Cg705fbrPhX3RAAAADXRSTlMAADVBRn6fqLO9weP7Sr4MvgAAAHRJREFUGNNjEEQABhQ2AwNLeEepAwOYzZTR0dHRpgBmW3SAQDOIzdTRuefu6RkdikA2W8eau3fvnupIBLI9Os8C2XdmtADZEd13QWBHK5Bd0QNmn2gHsjt6wewbHWhsZDXIepHNRLYL2Q3IbkNxM5JfsPsXACkGXYWXfeLsAAAAAElFTkSuQmCC';
var MIDDLE_POINT_ICON_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEwAACxMBAJqcGAAABCRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDx0aWZmOkNvbXByZXNzaW9uPjU8L3RpZmY6Q29tcHJlc3Npb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjIyPC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj4yMjwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgICAgIDxkYzpzdWJqZWN0PgogICAgICAgICAgICA8cmRmOkJhZy8+CiAgICAgICAgIDwvZGM6c3ViamVjdD4KICAgICAgICAgPHhtcDpNb2RpZnlEYXRlPjIwMTY6MTE6MjIgMTI6MTE6NDU8L3htcDpNb2RpZnlEYXRlPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPlBpeGVsbWF0b3IgMy41LjE8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cq7wSAUAAAGbSURBVDgR1ZQ9S8RAEIYTPYlaJAiK2AiChY1gYyvX+CMsrr/aH2Jtb+GPsBFbmwMbC0GwEVGQBPw4/Ijvu+wMk42X3ME1N7CZ7O6bJ7PJzETRrFncFHBZlofY38PYwki8dgh/jzGI4/jCr9Xcv2AA96E8wshqT1QXckzP8YLr6nIU1cCAdiHqhcKW+Rngl1bTsRMfqUKLj6/k5uF14ykfpt8/5Ry1nfn4dz1Lit3Nlcd0aYGfhdbDs2828krE2DyByB3/pfhcvrp93hage9xc+IKDnbW71XTx3S/nAB+LxEXBCaD8UQ7KSJug1POF1FDLOSzzDDdRMGb8+854/FGRioaeGmrNmjIsmCnljN9U7tt8oFWGBcuRXCRtQNkPTqYMCxbtVLwFS+q4lBqXzuwwWmVYMMvUGfNU7tt8oFWGBQ8EwuQPIpGtiqeGWrOoDAUjudlQWPsRK4rJ3wTnHjWm+lgg2pTCymPz6RNOm6CkKT8dWdLcRfV04bRfcG0MqzWhSsQCAHz6bVPg9L72WaasKEl+plRro4dmxuwPhneqyxRY7WEAAAAASUVORK5CYII=';

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
