var DialogConstants = require('builder/components/form-components/_constants/_dialogs');
var FillConstants = require('builder/components/form-components/_constants/_fill');

module.exports = {
  generate: function (params) {
    return {
      type: 'Size',
      title: _t('editor.style.components.labels-fill-size'),
      options: [],
      dialogMode: DialogConstants.Mode.FLOAT,
      query: params.querySchemaModel.get('query'),
      configModel: params.configModel,
      userModel: params.userModel,
      modals: params.modals,
      editorAttrs: {
        min: 6,
        max: 24,
        hidePanes: [FillConstants.Panes.BY_VALUE]
      },
      validators: ['required'],
      fieldClass: 'Editor-formInner--NoTabs'
    };
  }
};
