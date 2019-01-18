module.exports = {
  generate: function () {
    return {
      type: 'Radio',
      title: _t('editor.style.components.type.label'),
      options: [
        {
          val: 'simple',
          label: _t('editor.style.components.type.options.points')
        }, {
          val: 'heatmap',
          label: _t('editor.style.components.type.options.heatmap')
        }
      ]
    };
  }
};
