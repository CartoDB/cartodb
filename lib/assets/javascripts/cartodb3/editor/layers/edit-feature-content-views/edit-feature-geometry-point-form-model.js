var Backbone = require('backbone');
var _ = require('underscore');
var EditFeatureGeometryFormModel = require('./edit-feature-geometry-form-model');

var DEBOUNCE_TIME = 350;

module.exports = EditFeatureGeometryFormModel.extend({

  _onChange: function () {
    var self = this;

    _.each(this.changed, function (val, key) {
      if (key === 'lon' || key === 'lat') {
        var geom = JSON.parse(self._featureModel.get('the_geom'));

        var lon = geom.coordinates[0];
        var lat = geom.coordinates[1];

        if (key === 'lon') {
          lon = parseFloat(val);
        } else if (key === 'lat') {
          lat = parseFloat(val);
        }

        self._featureModel.set('the_geom', JSON.stringify({ 'type': 'Point', 'coordinates': [lon, lat] }));
      }
    });
  },

  _generateSchema: function () {
    this.schema = {};

    this.schema.lat = {
      type: 'Number',
      validators: ['required'],
      showSlider: false
    };
    this.schema.lon = {
      type: 'Number',
      validators: ['required'],
      showSlider: false
    };
  }

});
