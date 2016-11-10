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
    var currentGeoJSON = JSON.parse(this._featureModel.get('the_geom'));
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
