var _ = require('underscore');
var EditFeatureGeometryFormModel = require('./edit-feature-geometry-form-model');
var DEBOUNCE_TIME = 350;

module.exports = EditFeatureGeometryFormModel.extend({

  _initBinds: function () {
    this.bind('change', this._onChange, this);
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
        var val_ = Number(parseFloat(val).toFixed(8));

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
    var self = this;

    this.schema = {};

    this.schema.lng = {
      type: 'Number',
      validators: ['required', function checkLng(value, formValues) {
        var err = {
          type: 'lng',
          message: _t('editor.edit-feature.valid')
        };

        // https://www.debuggex.com/r/S82QD5uQ6hoQ1LvE
        var isLng = new RegExp(/^(\+|-)?(?:180(?:(?:\.0{1,})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,})?))$/);
        if (!isLng.test(value)) return err;
      }],
      showSlider: false
    };
    this.schema.lat = {
      type: 'Number',
      validators: ['required', function checkLat(value, formValues) {
        var err = {
          type: 'lat',
          message: _t('editor.edit-feature.valid')
        };

        // https://www.debuggex.com/r/v8TPMrQOnS765DuA
        var isLat = new RegExp(/^(\+|-)?(?:180(?:(?:\.0{1,})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,})?))$/);
        if (!isLat.test(value)) return err;
      }],
      showSlider: false
    };
  }

});
