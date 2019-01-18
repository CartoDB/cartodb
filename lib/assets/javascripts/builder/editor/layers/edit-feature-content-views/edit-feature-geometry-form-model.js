var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('internal-carto.js');

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
    return pos && pos[0];
  },

  _getLongitude: function (pos) {
    return pos && pos[1];
  },

  _validateGeom: function (value) {
    var validation;
    var coordinates;

    var geoJSON = JSON.parse(value);

    if (this._featureModel.isLine()) {
      coordinates = cdb.helpers.GeoJSONHelper.getPolylineLatLngsFromGeoJSONCoords(geoJSON);
    } else {
      coordinates = cdb.helpers.GeoJSONHelper.getPolygonLatLngsFromGeoJSONCoords(geoJSON);
    }

    var errors = _.chain(coordinates)
      .reduce(function (memo, coordinate) {
        var latitude = this._formatCoordinate(this._getLatitude(coordinate));
        var longitude = this._formatCoordinate(this._getLongitude(coordinate));

        var latError = (latitude > this._COORDINATES_OPTIONS.max_lat || latitude < this._COORDINATES_OPTIONS.min_lat);

        if (latError) {
          memo.push(_t('editor.edit-feature.out-of-bounds-lat'));
        }

        var lngError = (longitude > this._COORDINATES_OPTIONS.max_lng || longitude < this._COORDINATES_OPTIONS.min_lng);

        if (lngError) {
          memo.push(_t('editor.edit-feature.out-of-bounds-lng'));
        }

        return memo;
      }, [], this)
      .uniq()
      .value();

    if (errors.length) {
      validation = {
        message: errors.join(' ')
      };
    }

    return validation;
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
