module.exports = {
  generate: function () {
    return {
      type: 'Number',
      title: _t('editor.style.components.animated-trails.label'),
      validators: ['required', {
        type: 'interval',
        min: 0,
        max: 30
      }],
      editorAttrs: {
        help: _t('editor.style.components.animated-trails.help')
      }
    };
  }
};
