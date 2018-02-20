var Backbone = require('backbone');
var _ = require('underscore');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var REQUIRED_OPTS = [
  'userModel',
  'hasGoogleBasemap'
];

var DIMENSION_LIMIT = 8192;

var OPTIONS = [{
  type: 'png',
  label: '.png',
  className: 'track-ImageExport track-typePNG'
}, {
  type: 'jpg',
  label: '.jpg',
  className: 'track-ImageExport track-typeJPG'
}];

module.exports = Backbone.Model.extend({
  defaults: {
    type: 'none',
    title: ''
  },

  initialize: function (attrs, opts) {
    checkAndBuildOpts(attrs, REQUIRED_OPTS, this);

    this.schema = this._generateSchema();
    this._setSchema();
    this.on('change:format change:width change:height', this._setSchema, this);
  },

  _setSchema: function () {
    this.schema = this._generateSchema();
  },

  _generateSchema: function () {
    return {
      width: {
        type: 'Number',
        title: _t('editor.export-image.properties.width') + ' (px)',
        validators: ['required', this._validateDimension.bind(this)],
        showSlider: false,
        editorAttrs: {
          className: 'track-ImageExport track-inputWidth',
          placeholder: _t('editor.export-image.properties.width')
        }
      },
      height: {
        type: 'Number',
        title: _t('editor.export-image.properties.height') + ' (px)',
        validators: ['required', this._validateDimension.bind(this)],
        showSlider: false,
        editorAttrs: {
          className: 'track-ImageExport track-inputHeight',
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

  _validateDimension: function (value, formValues) {
    var numericValue = +value;
    var limit = DIMENSION_LIMIT;

    if (_.isNumber(numericValue) && numericValue >= 1 && numericValue <= limit) {
      return null; // valid dimension
    }

    return {
      message: _t('editor.export-image.invalid-dimension', { limit: limit })
    };
  },

  setErrors: function (errors) {
    // we don't want to set these errors as part as attributes
    // then we manually check if we should trigger the custom event
    var shouldTrigger = errors !== this._validationErrors;
    this._validationErrors = errors;
    shouldTrigger && this.trigger('change:errors');
  },

  canExport: function () {
    return _.isUndefined(this._validationErrors);
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
