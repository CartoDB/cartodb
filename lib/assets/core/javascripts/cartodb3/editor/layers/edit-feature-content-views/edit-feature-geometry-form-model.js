var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');

var MIN_LAT = -90;
var MAX_LAT = 90;

var MIN_LNG = -180;
var MAX_LNG = 180;

module.exports = Backbone.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.featureModel) throw new Error('featureModel is required');

    this._featureModel = opts.featureModel;

    this._generateSchema();
  },

  _formatCoordinate: function (coordinate) {
    if (this._isValidCoordinate(coordinate)) {
      return parseFloat(parseFloat(coordinate).toFixed(8));
    }
  },

  _isValidCoordinate: function (coordinate) {
    return _.isNumber(coordinate) || _.isString(coordinate);
  },

  _getLatitude: function (pos) {
    var latPos = pos && pos[0];

    if (latPos) {
      return this._formatCoordinate(latPos);
    }
  },

  _getLongitude: function (pos) {
    var lngPos = pos && pos[1];

    if (lngPos) {
      return this._formatCoordinate(lngPos);
    }
  },

  _validateGeom: function (value, formValues) {
    var coordinates;
    var lngError = '';
    var latError = '';

    var error = {
      type: 'the_geom',
      message: ''
    };

    var geoJSON = JSON.parse(value);

    if (this._featureModel.isLine()) {
      coordinates = cdb.helpers.GeoJSONHelper.getPolylineLatLngsFromGeoJSONCoords(geoJSON);
    } else {
      coordinates = cdb.helpers.GeoJSONHelper.getPolygonLatLngsFromGeoJSONCoords(geoJSON);
    }

    for (var i = 0, l = coordinates.length; i < l; i++) {
      var position = coordinates[i];

      var latitude = this._getLatitude(position);
      var longitude = this._getLongitude(position);

      if (latitude > MAX_LAT || latitude < MIN_LAT) {
        lngError = _t('editor.edit-feature.out-of-bounds-lat');
      }

      if (longitude > MAX_LNG || longitude < MIN_LNG) {
        latError = _t('editor.edit-feature.out-of-bounds-lng');
      }
    }

    if (lngError !== '' || latError !== '') {
      error.message = [lngError, latError].join(' ');

      return error;
    }

    return null; // valid the_geom
  },

  _generateSchema: function () {
    this.schema = {};

    this.schema.the_geom = {
      type: 'Text',
      validators: ['required', this._validateGeom.bind(this)],
      editorAttrs: {
        disabled: true
      },
      hasCopyButton: this._featureModel.has('the_geom')
    };
  }

});
