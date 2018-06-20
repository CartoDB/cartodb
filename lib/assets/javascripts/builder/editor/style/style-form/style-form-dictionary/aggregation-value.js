var DialogConstants = require('builder/components/form-components/_constants/_dialogs');
var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');

module.exports = {
  generate: function (params) {
    return {
      type: 'Operators',
      title: _t('editor.style.components.aggregation-value.label'),
      options: StyleFormDictionaryHelpers.getSchemaColumns(params.querySchemaModel),
      dialogMode: DialogConstants.Mode.FLOAT,
      editorAttrs: {
        help: _t('editor.style.components.aggregation-value.help')
      }
    };
  }
};
