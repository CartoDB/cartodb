var _ = require('underscore');
var EditFeatureGeometryFormModel = require('./edit-feature-geometry-form-model');

module.exports = EditFeatureGeometryFormModel.extend({

  _onChange: function () {
    _.each(this.changed, function (val, key) {
      if (key === 'lng' || key === 'lat') {
        var geojson = null;

        try {
          geojson = JSON.parse(this._featureModel.get('the_geom'));
        } catch (err) {
          // if the geom is not a valid json value
        }

        var lng = geojson && geojson.coordinates[0];
        var lat = geojson && geojson.coordinates[1];
        var val_ = parseFloat(val).toFixed(8);

        if (key === 'lng') {
          lng = val_;
        } else if (key === 'lat') {
          lat = val_;
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
