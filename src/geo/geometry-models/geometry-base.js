var Model = require('../../core/model');

var GeometryBase = Model.extend({
  initialize: function () {
    this.on('change:geojson', function () {
      this.trigger('ready', this);
    }, this);
  },

  update: function () {
    throw new Error('subclasses of GeometryBase must implement update');
  },

  remove: function () {
    this.trigger('remove');
  },

  toGeoJSON: function () {
    return this.get('geojson');
  }
});

module.exports = GeometryBase;
