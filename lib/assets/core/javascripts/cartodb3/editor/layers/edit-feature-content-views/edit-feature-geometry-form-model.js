var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');

module.exports = Backbone.Model.extend({

  _COORDINATES_OPTIONS: {
    min_lat: -90,
    max_lat: 90,
    min_lng: -180,
    max_lng: 180
  },

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

  _validateGeom: function (value) {
    var latError = false;
    var lngError = false;
    var coordinates;
    var errors = [];

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

      if (!latError) {
        latError = (latitude > this._COORDINATES_OPTIONS.max_lat || latitude < this._COORDINATES_OPTIONS.min_lat);
      }

      if (!lngError) {
        lngError = (longitude > this._COORDINATES_OPTIONS.max_lng || longitude < this._COORDINATES_OPTIONS.min_lng);
      }
    }

    if (latError) {
      errors.push(_t('editor.edit-feature.out-of-bounds-lat'));
    }

    if (lngError) {
      errors.push(_t('editor.edit-feature.out-of-bounds-lng'));
    }

    if (latError || lngError) {
      var error = {
        message: errors.join(' ')
      };

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
