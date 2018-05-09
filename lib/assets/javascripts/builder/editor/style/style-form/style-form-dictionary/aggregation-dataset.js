module.exports = {
  generate: function () {
    return {
      type: 'Select',
      title: _t('editor.style.components.aggregation-dataset.label'),
      dialogMode: 'float',
      options: [
        {
          val: 'countries'
        }, {
          val: 'provinces'
        }
      ],
      editorAttrs: {
        help: _t('editor.style.components.aggregation-dataset.help')
      }
    };
  }
};
