var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

module.exports = {
  generate: function () {
    return {
      type: 'Fill',
      title: _t('editor.style.components.labels-halo'),
      options: [],
      dialogMode: DialogConstants.Mode.FLOAT,
      editorAttrs: {
        size: {
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
