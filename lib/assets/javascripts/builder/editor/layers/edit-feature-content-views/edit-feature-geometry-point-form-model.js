var _ = require('underscore');
var EditFeatureGeometryFormModel = require('./edit-feature-geometry-form-model');

var getCoordinatesFromGeoJSON = function (geoJSON) {
  if (geoJSON && geoJSON.coordinates && geoJSON.coordinates.length === 2) {
    return geoJSON.coordinates;
  }
};

module.exports = EditFeatureGeometryFormModel.extend({

  initialize: function () {
    EditFeatureGeometryFormModel.prototype.initialize.apply(this, arguments);

    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change:lat', this._onLatLngChange, this);
    this.bind('change:lng', this._onLatLngChange, this);
  },

  _onLatLngChange: function () {
    var newGeoJSON = this._toGeoJSON();
    var currentGeoJSON = {};

    if (this._featureModel.get('the_geom')) {
      currentGeoJSON = JSON.parse(this._featureModel.get('the_geom'));
    }

    // Only set `the_geom` if there's new geoJSON
    if (!_.isEqual(newGeoJSON, currentGeoJSON)) {
      this._featureModel.set('the_geom', JSON.stringify(newGeoJSON));
    }
  },

  _toGeoJSON: function () {
    var latitude = this._formatCoordinate(this._getLatitude());
    var longitude = this._formatCoordinate(this._getLongitude());
    if (this._isValidCoordinate(latitude) && this._isValidCoordinate(longitude)) {
      return {
        'type': 'Point',
        'coordinates': [ longitude, latitude ]
      };
    }
  },

  _getLatitude: function () {
    if (this.has('lat')) {
      return this.get('lat');
    }

    var geoJSON = JSON.parse(this._featureModel.get('the_geom'));
    var geoJSONCoordinates = getCoordinatesFromGeoJSON(geoJSON);
    var latitudeFromGeoJSON = geoJSONCoordinates && geoJSONCoordinates[1];
    if (latitudeFromGeoJSON) {
      return latitudeFromGeoJSON;
    }
  },

  _getLongitude: function () {
    if (this.has('lng')) {
      return this.get('lng');
    }

    var geoJSON = JSON.parse(this._featureModel.get('the_geom'));
    var geoJSONCoordinates = getCoordinatesFromGeoJSON(geoJSON);
    var longitudeFromGeoJSON = geoJSONCoordinates && geoJSONCoordinates[1];
    if (longitudeFromGeoJSON) {
      return longitudeFromGeoJSON;
    }
  },

  _validateLatitude: function (value, formValues) {
    var numericValue = +value;

    var error = {
      message: _t('editor.edit-feature.valid-lat')
    };

    if (_.isNumber(numericValue) &&
       (numericValue >= this._COORDINATES_OPTIONS.min_lat && numericValue <= this._COORDINATES_OPTIONS.max_lat)) {
      return null; // valid latitude
    }

    if (_.isNumber(numericValue) &&
       (numericValue > this._COORDINATES_OPTIONS.max_lat || numericValue < this._COORDINATES_OPTIONS.min_lat)) {
      error.message = _t('editor.edit-feature.out-of-bounds-lat');
    }

    return error;
  },

  _validateLongitude: function (value, formValues) {
    var numericValue = +value;

    var error = {
      message: _t('editor.edit-feature.valid-lng')
    };

    if (_.isNumber(numericValue) &&
       (numericValue >= this._COORDINATES_OPTIONS.min_lng && numericValue <= this._COORDINATES_OPTIONS.max_lng)) {
      return null; // valid longitude
    }

    if (_.isNumber(numericValue) &&
       (numericValue > this._COORDINATES_OPTIONS.max_lng || numericValue < this._COORDINATES_OPTIONS.min_lng)) {
      error.message = _t('editor.edit-feature.out-of-bounds-lng');
    }

    return error;
  },

  _generateSchema: function () {
    this.schema = {};

    this.schema.lng = {
      type: 'Number',
      validators: ['required', this._validateLongitude.bind(this)],
      showSlider: false
    };

    this.schema.lat = {
      type: 'Number',
      validators: ['required', this._validateLatitude.bind(this)],
      showSlider: false
    };
  }

});
