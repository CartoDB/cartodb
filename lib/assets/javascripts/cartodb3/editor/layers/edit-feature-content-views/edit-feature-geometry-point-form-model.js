var _ = require('underscore');
var EditFeatureGeometryFormModel = require('./edit-feature-geometry-form-model');

module.exports = EditFeatureGeometryFormModel.extend({

  _onChange: function () {
    var self = this;

    _.each(this.changed, function (val, key) {
      if (key === 'lng') {
        self._featureModel.set('lng', parseFloat(val));
      } else if (key === 'lat') {
        self._featureModel.set('lat', parseFloat(val));
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
