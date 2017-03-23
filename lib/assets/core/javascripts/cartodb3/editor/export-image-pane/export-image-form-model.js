var Backbone = require('backbone');
var _ = require('underscore');
var checkAndBuildOpts = require('../../helpers/required-opts');
var REQUIRED_OPTS = [
  'vis'
];

var DIMENSION_LIMIT = 8192;
var GOOGLE_DIMENSION_LIMIT = 640;

var OPTIONS = [{
  type: 'png',
  label: '.png',
  className: 'track-DO track-typePNG'
}, {
  type: 'jpg',
  label: '.jpg',
  className: 'track-DO track-typeJPG'
}];

module.exports = Backbone.Model.extend({
  defaults: {
    type: 'none',
    title: ''
  },

  initialize: function (attrs, opts) {
    checkAndBuildOpts(attrs, REQUIRED_OPTS, this);

    this.schema = this._generateSchema();
    this.on('change:format change:width change:height', this._setSchema, this);
  },

  _setSchema: function () {
    this.schema = this._generateSchema();
  },

  _generateSchema: function () {
    return {
      width: {
        type: 'Text',
        title: _t('editor.export-image.properties.width') + ' (px)',
        defaultValue: this.get('width'),
        validators: ['required', this._validateDimension.bind(this)],
        editorAttrs: {
          className: 'track-DO track-inputWidth',
          placeholder: _t('editor.export-image.properties.width')
        }
      },
      height: {
        type: 'Text',
        title: _t('editor.export-image.properties.height') + ' (px)',
        defaultValue: this.get('height'),
        validators: ['required', this._validateDimension.bind(this)],
        editorAttrs: {
          className: 'track-DO track-inputHeight',
          placeholder: _t('editor.export-image.properties.height')
        }
      },
      format: {
        type: 'Radio',
        title: _t('editor.export-image.properties.format'),
        options: _.map(OPTIONS, function (d) {
          return {
            val: d.type,
            label: d.label,
            className: d.className
          };
        }, this)
      }
    };
  },

  _hasGoogleMapsBasemap: function () {
    return this._vis.map.get('provider') === 'googlemaps';
  },

  _validateDimension: function (value, formValues) {
    var numericValue = +value;

    var limit = DIMENSION_LIMIT;
    var hasGoogleBasemap = this._hasGoogleMapsBasemap();

    if (hasGoogleBasemap) {
      limit = GOOGLE_DIMENSION_LIMIT;
    }

    if (_.isNumber(numericValue) && numericValue >= 1 && numericValue <= limit) {
      return null; // valid dimension
    }

    return {
      message: _t('editor.export-image.invalid-dimension', { limit: limit })
    };
  },

  toJSON: function () {
    return _.extend(
      this.attributes,
      {
        type: this.get('type')
      }
    );
  }
});
