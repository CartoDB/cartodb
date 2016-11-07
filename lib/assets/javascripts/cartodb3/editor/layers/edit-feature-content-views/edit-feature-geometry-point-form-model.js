var _ = require('underscore');
var EditFeatureGeometryFormModel = require('./edit-feature-geometry-form-model');
var DEBOUNCE_TIME = 350;

module.exports = EditFeatureGeometryFormModel.extend({

  _initBinds: function () {
    this.bind('change', _.debounce(this._onChange.bind(this), DEBOUNCE_TIME), this);
  },

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

        this._featureModel.set('the_geom', JSON.stringify({ 'type': 'Point', 'coordinates': [lng, lat] }));
      }
    }, this);
  },

  _generateSchema: function () {
    this.schema = {};

    this.schema.lng = {
      type: 'Number',
      validators: ['required', {
        type: 'regexp',
        regexp: /^(\+|-)?(?:180(?:(?:\.0{1,})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,})?))$/, // https://www.debuggex.com/r/S82QD5uQ6hoQ1LvE
        message: _t('editor.edit-feature.valid')
      }],
      showSlider: false
    };
    this.schema.lat = {
      type: 'Number',
      validators: ['required', {
        type: 'regexp',
        regexp: /^(\+|-)?(?:90(?:(?:\.0{1,})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,})?))$/, // https://www.debuggex.com/r/v8TPMrQOnS765DuA
        message: _t('editor.edit-feature.valid')
      }],
      showSlider: false
    };
  }

});
