var _ = require('underscore');
var EditFeatureGeometryFormModel = require('./edit-feature-geometry-form-model');

module.exports = EditFeatureGeometryFormModel.extend({

  _onChange: function () {
    var self = this;

    _.each(this.changed, function (val, key) {
      if (key === 'lng' || key === 'lat') {
        var lng = self._featureModel.get('lng');
        var lat = self._featureModel.get('lat');

        if (key === 'lng') {
          lng = parseFloat(val);
          self._featureModel.set('lng', lng);
        } else if (key === 'lat') {
          lat = parseFloat(val);
          self._featureModel.set('lat', parseFloat(val));
        }

        self._featureModel.set('the_geom', JSON.stringify({ 'type': 'Point', 'coordinates': [lng, lat] }))
      }
    });
  },

  _generateSchema: function () {
    this.schema = {};

    this.schema.lng = {
      type: 'Number',
      validators: ['required'],
      showSlider: false
    };
    this.schema.lat = {
      type: 'Number',
      validators: ['required'],
      showSlider: false
    };
  }

});
