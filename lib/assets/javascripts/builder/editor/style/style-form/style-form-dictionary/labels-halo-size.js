var DialogConstants = require('builder/components/form-components/_constants/_dialogs');
var FillConstants = require('builder/components/form-components/_constants/_fill');

module.exports = {
  generate: function () {
    return {
      type: 'Size',
      title: _t('editor.style.components.labels-halo-size'),
      options: [],
      dialogMode: DialogConstants.Mode.FLOAT,
      editorAttrs: {
        hidePanes: [FillConstants.Panes.BY_VALUE]
      },
      validators: ['required'],
      fieldClass: 'Editor-formInner--NoTabs'
    };
  }
};
