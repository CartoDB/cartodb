var Model = require('../../core/model');

var GeometryBase = Model.extend({
  update: function () {
    throw new Error('subclasses of GeometryBase must implement update');
  },

  isComplete: function () {
    throw new Error('subclasses of GeometryBase must implement isComplete');
  },

  remove: function () {
    this.trigger('remove');
  },

  toGeoJSON: function () {
    throw new Error('subclasses of GeometryBase must implement toGeoJSON');
  },

  _triggerChangeEvent: function () {
    this.trigger('change', this);
  }
});

module.exports = GeometryBase;
