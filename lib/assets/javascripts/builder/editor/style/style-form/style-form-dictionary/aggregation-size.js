module.exports = {
  generate: function (params) {
    return {
      type: 'Number',
      title: _t('editor.style.components.aggregation-size.label'),
      help: _t('editor.style.components.aggregation-size.label-help'),
      validators: ['required', {
        type: 'interval',
        min: 10,
        max: 100
      }],
      editorAttrs: {
        help: _t('editor.style.components.aggregation-size.help', { type: _t('editor.style.tooltips.' + params.styleType) })
      }
    };
  }
};
