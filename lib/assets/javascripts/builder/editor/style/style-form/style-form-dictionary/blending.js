var _ = require('underscore');
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');
var StyleConstants = require('builder/components/form-components/_constants/_style');

module.exports = {
  generate: function (params) {
    var blendingOptions = this._getBlendingOptions(params);
    var options = this._generateBlendingOptions(blendingOptions);

    return {
      type: 'Select',
      title: _t('editor.style.components.blending.label'),
      options: options,
      dialogMode: DialogConstants.Mode.FLOAT,
      editorAttrs: {
        help: _t('editor.style.tooltips.blending')
      }
    };
  },

  _generateBlendingOptions: function (options) {
    return _.reduce(options, function (values, option) {
      values.push({
        val: option,
        label: _t('editor.style.components.blending.options.' + option)
      });

      return values;
    }, []);
  },

  _getBlendingOptions: function (params) {
    return params.styleType === StyleConstants.Type.ANIMATION
      ? StyleConstants.Blending.ANIMATION
      : StyleConstants.Blending.SIMPLE;
  }
};
