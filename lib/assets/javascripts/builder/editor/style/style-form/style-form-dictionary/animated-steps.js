module.exports = {
  generate: function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.animated-steps.label'),
      validators: ['required', {
        type: 'interval',
        min: 1,
        max: 1024,
        step: 4
      }],
      editorAttrs: {
        help: _t('editor.style.components.animated-steps.help')
      }
    };
  }
};
