var Backbone = require('backbone');
var _ = require('underscore');

var OPTIONS = [{
  type: 'jpg',
  label: '.jpg'
}, {
  type: 'png',
  label: '.png'
}];

module.exports = Backbone.Model.extend({
  defaults: {
    type: 'none',
    title: ''
  },

  initialize: function (attrs, opts) {
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
        title: _t('editor.export-image.properties.width'),
        defaultValue: this.get('width'),
        validators: ['required', this._validateDimension],
        editorAttrs: {
          placeholder: _t('editor.export-image.properties.width')
        }
      },
      height: {
        type: 'Text',
        title: _t('editor.export-image.properties.height'),
        defaultValue: this.get('height'),
        validators: ['required', this._validateDimension],
        editorAttrs: {
          placeholder: _t('editor.export-image.properties.height')
        }
      },
      format: {
        type: 'Radio',
        title: _t('editor.export-image.properties.format'),
        options: _.map(OPTIONS, function (d) {
          return {
            val: d.type,
            label: d.label
          };
        }, this)
      }
    };
  },

  _validateDimension: function (value, formValues) {
    var numericValue = +value;

    if (_.isNumber(numericValue) && numericValue >= 1 && numericValue <= 2000) {
      return null; // valid dimension
    }

    return {
      message: _t('editor.export-image.invalid-dimension')
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
