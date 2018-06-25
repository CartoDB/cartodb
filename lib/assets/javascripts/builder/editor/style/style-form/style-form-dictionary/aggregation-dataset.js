var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

module.exports = {
  generate: function () {
    return {
      type: 'Select',
      title: _t('editor.style.components.aggregation-dataset.label'),
      dialogMode: DialogConstants.Mode.FLOAT,
      options: [
        {
          val: 'countries'
        }, {
          val: 'provinces'
        }
      ],
      editorAttrs: {
        help: _t('editor.style.components.aggregation-dataset.help')
      }
    };
  }
};
