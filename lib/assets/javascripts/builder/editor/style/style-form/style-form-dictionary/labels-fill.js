var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

module.exports = {
  generate: function () {
    return {
      type: 'Fill',
      title: _t('editor.style.components.labels-fill'),
      options: [],
      dialogMode: DialogConstants.Mode.FLOAT,
      editorAttrs: {
        size: {
          min: 6,
          max: 24,
          hidePanes: ['value']
        },
        color: {
          hidePanes: ['value']
        }
      },
      validators: ['required']
    };
  }
};
