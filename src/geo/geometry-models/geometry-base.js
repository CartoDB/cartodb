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

  toGeoJSON: function () {
    throw new Error('subclasses of GeometryBase must implement toGeoJSON');
  },

  setCoordinatesFromGeoJSON: function () {
    throw new Error('subclasses of GeometryBase must implement toGeoJSON');
  },

  _triggerChangeEvent: function () {
    this.trigger('change', this);
  }
});

module.exports = GeometryBase;
