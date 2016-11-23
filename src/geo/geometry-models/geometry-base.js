var _ = require('underscore');
var Model = require('../../core/model');

var GeometryBase = Model.extend({
  update: function () {
    throw new Error('subclasses of GeometryBase must implement update');
  },

  remove: function () {
    this.trigger('remove');
  },

  isComplete: function () {
    throw new Error('subclasses of GeometryBase must implement isComplete');
  },

  isEditable: function () {
    return !!this.get('editable');
  },

  isExpandable: function () {
    return !!this.get('expandable');
  },

  toGeoJSON: function () {
    throw new Error('subclasses of GeometryBase must implement toGeoJSON');
  },

  setCoordinatesFromGeoJSON: function (geoJSON) {
    var coordinates = this.getCoordinatesFromGeoJSONCoords(geoJSON);
    if (!_.isEqual(coordinates, this.getCoordinates())) {
      this.setCoordinates(coordinates);
    }
  },

  getCoordinatesFromGeoJSONCoords: function (geoJSON) {
    throw new Error('subclasses of GeometryBase must implement getCoordinatesFromGeoJSONCoords');
  },

  _triggerChangeEvent: function () {
    this.trigger('change', this);
  }
});

module.exports = GeometryBase;
