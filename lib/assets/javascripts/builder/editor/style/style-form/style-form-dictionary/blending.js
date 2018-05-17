var _ = require('underscore');
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

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
    var ANIMATION_OPTIONS = ['lighter', 'multiply', 'source-over', 'xor'];
    var SIMPLE_OPTIONS = ['none', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
      'color-dodge', 'color-burn', 'xor', 'src-over'];

    return params.styleType === 'animation'
      ? ANIMATION_OPTIONS
      : SIMPLE_OPTIONS;
  }
};
