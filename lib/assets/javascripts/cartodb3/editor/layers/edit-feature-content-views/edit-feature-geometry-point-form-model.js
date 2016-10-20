var _ = require('underscore');
var EditFeatureGeometryFormModel = require('./edit-feature-geometry-form-model');

module.exports = EditFeatureGeometryFormModel.extend({

  _onChange: function () {
    _.each(this.changed, function (val, key) {
      if (key === 'lng' || key === 'lat') {
        var lng = this._featureModel.get('lng');
        var lat = this._featureModel.get('lat');

        if (key === 'lng') {
          lng = parseFloat(val);
          this._featureModel.set('lng', lng);
        } else if (key === 'lat') {
          lat = parseFloat(val);
          this._featureModel.set('lat', parseFloat(val));
        }

        this._featureModel.set('the_geom', JSON.stringify({ 'type': 'Point', 'coordinates': [lng, lat] }))
      }
    }, this);
  },

  _generateSchema: function () {
    this.schema = {};

    this.schema.lng = {
      type: 'Number',
      validators: ['required'],
      showSlider: false,
      editorAttrs: {
        disabled: true
      }
    };
    this.schema.lat = {
      type: 'Number',
      validators: ['required'],
      showSlider: false,
      editorAttrs: {
        disabled: true
      }
    };
  }

});
