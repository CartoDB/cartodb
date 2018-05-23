var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

module.exports = {
  generate: function (params) {
    return {
      type: 'FillColor',
      title: _t('editor.style.components.labels-fill'),
      query: params.querySchemaModel.get('query'),
      options: [],
      configModel: params.configModel,
      userModel: params.userModel,
      validators: ['required'],
      modals: params.modals,
      dialogMode: DialogConstants.Mode.FLOAT,
      editorAttrs: {
        hidePanes: ['value']
      }
    };
  }
};
