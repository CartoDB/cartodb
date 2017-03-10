var _ = require('underscore');
var EditFeatureGeometryFormModel = require('./edit-feature-geometry-form-model');

var formatCoordinate = function (coordinate) {
  if (isValidCoordinate(coordinate)) {
    return parseFloat(parseFloat(coordinate).toFixed(8));
  }
};

var isValidCoordinate = function (coordinate) {
  return _.isNumber(coordinate) || _.isString(coordinate);
};

var getCoordinatesFromGeoJSON = function (geoJSON) {
  if (geoJSON && geoJSON.coordinates && geoJSON.coordinates.length === 2) {
    return geoJSON.coordinates;
  }
};

var MIN_LAT = -90;
var MAX_LAT = 90;

var MIN_LNG = -180;
var MAX_LNG = 180;

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
    var latitude = this._getLatitude();
    var longitude = this._getLongitude();
    if (isValidCoordinate(latitude) && isValidCoordinate(longitude)) {
      return {
        'type': 'Point',
        'coordinates': [ longitude, latitude ]
      };
    }
  },

  _getLatitude: function () {
    if (this.has('lat')) {
      return formatCoordinate(this.get('lat'));
    }

    var geoJSON = JSON.parse(this._featureModel.get('the_geom'));
    var geoJSONCoordinates = getCoordinatesFromGeoJSON(geoJSON);
    var latitudeFromGeoJSON = geoJSONCoordinates && geoJSONCoordinates[1];
    if (latitudeFromGeoJSON) {
      return formatCoordinate(latitudeFromGeoJSON);
    }
  },

  _getLongitude: function () {
    if (this.has('lng')) {
      return formatCoordinate(this.get('lng'));
    }

    var geoJSON = JSON.parse(this._featureModel.get('the_geom'));
    var geoJSONCoordinates = getCoordinatesFromGeoJSON(geoJSON);
    var longitudeFromGeoJSON = geoJSONCoordinates && geoJSONCoordinates[1];
    if (longitudeFromGeoJSON) {
      return formatCoordinate(longitudeFromGeoJSON);
    }
  },

  _validateLatitude: function (value, formValues) {
    var numericValue = +value;

    var error = {
      type: 'lat',
      message: _t('editor.edit-feature.valid-lat')
    };

    if (_.isNumber(numericValue) && numericValue >= MIN_LAT && numericValue <= MAX_LAT) {
      return null; // valid latitude
    }

    if (_.isNumber(numericValue) && (numericValue > MAX_LAT || numericValue < MIN_LAT)) {
      error.message = _t('editor.edit-feature.out-of-bounds-lat');
    }

    return error;
  },

  _validateLongitude: function (value, formValues) {
    var numericValue = +value;

    var error = {
      type: 'lng',
      message: _t('editor.edit-feature.valid-lng')
    };

    if (_.isNumber(numericValue) && numericValue >= MIN_LNG && numericValue <= MAX_LNG) {
      return null; // valid longitude
    }

    if (_.isNumber(numericValue) && (numericValue > MAX_LNG || numericValue < MIN_LNG)) {
      error.message = _t('editor.edit-feature.out-of-bounds-lng');
    }

    return error;
  },

  _generateSchema: function () {
    this.schema = {};

    this.schema.lng = {
      type: 'Number',
      validators: ['required', this._validateLongitude],
      showSlider: false
    };

    this.schema.lat = {
      type: 'Number',
      validators: ['required', this._validateLatitude],
      showSlider: false
    };
  }

});
