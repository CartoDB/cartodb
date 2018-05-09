module.exports = {
  generate: function () {
    return {
      type: 'Fill',
      title: _t('editor.style.components.labels-halo'),
      options: [],
      dialogMode: 'float',
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
