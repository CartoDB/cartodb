module.exports = {
  generate: function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.animated-duration.label'),
      validators: ['required', {
        type: 'interval',
        min: 0,
        max: 60
      }],
      editorAttrs: {
        help: _t('editor.style.components.animated-duration.help')
      }
    };
  }
};
