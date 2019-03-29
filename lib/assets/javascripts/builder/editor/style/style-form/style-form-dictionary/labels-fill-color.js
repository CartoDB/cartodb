var DialogConstants = require('builder/components/form-components/_constants/_dialogs');
var FillConstants = require('builder/components/form-components/_constants/_fill');

var NO_PANES_CLASS = 'Editor-formInner--NoTabs';

module.exports = {
  generate: function () {
    return {
      type: 'FillColor',
      title: _t('editor.style.components.labels-fill-color'),
      fieldClass: NO_PANES_CLASS,
      options: [],
      validators: ['required'],
      dialogMode: DialogConstants.Mode.FLOAT,
      editorAttrs: {
        imageEnabled: false,
        hidePanes: [FillConstants.Panes.BY_VALUE]
      }
    };
  }
};
