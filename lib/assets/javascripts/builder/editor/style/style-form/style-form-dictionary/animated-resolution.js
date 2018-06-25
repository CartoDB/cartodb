module.exports = {
  generate: function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.animated-resolution.label'),
      validators: ['required', {
        type: 'interval',
        min: 1,
        max: 16
      }],
      editorAttrs: {
        help: _t('editor.style.components.animated-resolution.help')
      }
    };
  }
};
